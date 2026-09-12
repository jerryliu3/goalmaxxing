import type { PlannerCalendarViewMode } from "./calendar-surface.types";
interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Mark {
    box: Box;
    day: string;
    text: string;
    color: string;
    background: string;
    border: string;
    radius: number;
    font: string;
    fontSize: number;
    title?: Box;
    index: number;
}
export interface PlanScene {
    mode: PlannerCalendarViewMode;
    bounds: Box;
    clip: Box;
    days: Map<string, Mark>;
    items: Map<string, Mark>;
    labels: Map<string, Mark>;
    aside: {
        box: Box;
        node: HTMLElement;
    } | null;
}
const DAY = "[data-calendar-week-row], [data-day-cell]";
const DAY_MS = 86400000;
const distance = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / DAY_MS);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function lerp(a: Box, b: Box, t: number): Box {
    return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) };
}
function box(el: Element, root: DOMRect): Box {
    const r = el.getBoundingClientRect();
    return { x: r.left - root.left, y: r.top - root.top, width: r.width, height: r.height };
}
function mark(el: HTMLElement, root: DOMRect, day: string, index = 0): Mark {
    const style = getComputedStyle(el);
    const title = el.querySelector<HTMLElement>('[data-testid="completion-title"]');
    const textStyle = getComputedStyle(title ?? el);
    return { box: box(el, root), day, index, text: (title ?? el).textContent ?? "", color: textStyle.color,
        background: style.backgroundColor, border: style.borderColor, radius: parseFloat(style.borderRadius) || 0,
        font: textStyle.font, fontSize: parseFloat(textStyle.fontSize), title: title ? box(title, root) : undefined };
}
function shown(el: HTMLElement) { return el.getBoundingClientRect().width > 0 && !el.closest('[aria-hidden="true"]'); }
export function capturePlanScene(root: HTMLElement, mode: PlannerCalendarViewMode): PlanScene {
    const r = root.getBoundingClientRect();
    const days = new Map<string, Mark>(), items = new Map<string, Mark>(), labels = new Map<string, Mark>();
    const calendar = root.querySelector<HTMLElement>('[data-testid="plan-calendar-split-calendar"]') ?? root;
    const viewport = calendar.querySelector<HTMLElement>('[data-calendar-month-vertical-viewport]');
    const cr = box(calendar, r), vr = viewport ? box(viewport, r) : cr;
    const clip = { x: cr.x, y: Math.max(cr.y, vr.y), width: cr.width, height: Math.min(cr.y + cr.height, vr.y + vr.height) - Math.max(cr.y, vr.y) };
    for (const el of root.querySelectorAll<HTMLElement>(DAY)) {
        if (!shown(el) || el.matches('[data-day-cell]') && el.closest('[data-calendar-week-row]'))
            continue;
        const day = el.dataset.day!;
        days.set(day, mark(el, r, day));
        const number = el.querySelector<HTMLElement>('[data-plan-day-number]');
        if (number)
            labels.set(`date:${day}`, mark(number, r, day));
        const weekday = el.querySelector<HTMLElement>('[data-plan-weekday]');
        if (weekday)
            labels.set(`weekday:${new Date(`${day}T12:00:00Z`).getUTCDay()}`, mark(weekday, r, day));
    }
    const dayPane = mode === 'day' ? root.querySelector<HTMLElement>('[data-testid="plan-day-pane"]') : null;
    if (dayPane)
        days.set(dayPane.dataset.planDay!, mark(dayPane, r, dayPane.dataset.planDay!));
    root.querySelectorAll<HTMLElement>('[data-calendar-weekday-grid] [data-plan-weekday-index]').forEach(el => {
        if (shown(el))
            labels.set(`weekday:${el.dataset.planWeekdayIndex}`, mark(el, r, ''));
    });
    const source = dayPane ?? calendar;
    const counts = new Map<string, number>();
    for (const el of source.querySelectorAll<HTMLElement>('[data-planner-entry-key]')) {
        if (!shown(el))
            continue;
        const day = el.closest<HTMLElement>('[data-day]')?.dataset.day ?? dayPane?.dataset.planDay ?? '';
        const index = counts.get(day) ?? 0;
        counts.set(day, index + 1);
        items.set(`${day}:${el.dataset.plannerEntryKey}`, mark(el, r, day, index));
    }
    const aside = root.querySelector<HTMLElement>('[data-testid="plan-desktop-day-pane"]');
    return { mode, bounds: { x: r.x, y: r.y, width: r.width, height: r.height }, clip, days, items, labels,
        aside: aside ? { box: box(aside, r), node: aside.cloneNode(true) as HTMLElement } : null };
}
/** Each date gets its own chronological slot, including dates outside the visible week. */
function projectedDay(scene: PlanScene, day: string): Mark | undefined {
    const exact = scene.days.get(day);
    if (exact)
        return exact;
    const ordered = [...scene.days.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (!ordered.length)
        return;
    const [firstDate, first] = ordered[0], [lastDate, last] = ordered[ordered.length - 1];
    if (scene.mode === 'month')
        return;
    const before = day < firstDate, anchor = before ? first : last, anchorDate = before ? firstDate : lastDate;
    const adjacent = before ? ordered[1]?.[1] : ordered.at(-2)?.[1];
    const gap = adjacent ? Math.max(0, before ? adjacent.box.y - first.box.y - first.box.height : last.box.y - adjacent.box.y - adjacent.box.height) : 0;
    const pitch = scene.mode === 'day' ? Math.max(anchor.box.height, scene.clip.height) + 24 : anchor.box.height + gap;
    return { ...anchor, day, box: { ...anchor.box, y: anchor.box.y + distance(day, anchorDate) * pitch } };
}
function projectedItem(scene: PlanScene, source: Mark): Mark | undefined {
    const day = projectedDay(scene, source.day);
    if (!day)
        return;
    const sample = [...scene.items.values()].find(m => m.index === 0);
    const sampleDay = sample ? scene.days.get(sample.day) : undefined;
    const offsetX = sample && sampleDay ? sample.box.x - sampleDay.box.x : 64;
    const offsetY = sample && sampleDay ? sample.box.y - sampleDay.box.y : 12;
    const h = sample?.box.height ?? 34;
    const target = { x: day.box.x + offsetX, y: day.box.y + offsetY + source.index * (h + 6), width: Math.max(24, day.box.width - offsetX - 8), height: h };
    const title = { x: target.x + 6, y: target.y + Math.max(0, (h - source.fontSize) / 2), width: Math.max(16, target.width - 12), height: source.fontSize * 1.3 };
    return { ...source, box: target, title };
}
function paintBox(el: HTMLElement, b: Box) {
    el.style.transform = `translate(${b.x}px,${b.y}px)`;
    el.style.width = `${Math.max(0, b.width)}px`;
    el.style.height = `${Math.max(0, b.height)}px`;
}
function surface(parent: HTMLElement, m: Mark, text = false) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', margin: '0', boxSizing: 'border-box', overflow: 'hidden', pointerEvents: 'none',
        background: text ? 'transparent' : m.background, border: text ? 'none' : `1px solid ${m.border}`, borderRadius: `${text ? 0 : m.radius}px`,
        color: m.color, font: m.font, whiteSpace: 'nowrap', textOverflow: 'ellipsis', transformOrigin: '0 0' });
    if (text)
        el.textContent = m.text;
    parent.append(el);
    return el;
}
interface Track {
    el: HTMLElement;
    from: Mark;
    to: Mark;
    title: HTMLElement | null;
    current: Mark;
    kind: 'days' | 'items' | 'labels';
    key: string;
}
export function animatePlanScene(root: HTMLElement, content: HTMLElement, from: PlanScene, to: PlanScene, onFinish: () => void) {
    const overlay = document.createElement('div');
    overlay.dataset.planMorphOverlay = 'true';
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    Object.assign(overlay.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '20' });
    root.append(overlay);
    const layer = document.createElement('div');
    Object.assign(layer.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
    overlay.append(layer);
    // Preserve screen coordinates if normal layout/scroll anchoring moved the frame at commit.
    const shiftX = from.bounds.x - to.bounds.x, shiftY = from.bounds.y - to.bounds.y;
    for (const group of [from.days, from.items, from.labels])
        for (const m of group.values()) {
            m.box = { ...m.box, x: m.box.x + shiftX, y: m.box.y + shiftY };
            if (m.title)
                m.title = { ...m.title, x: m.title.x + shiftX, y: m.title.y + shiftY };
        }
    from.clip = { ...from.clip, x: from.clip.x + shiftX, y: from.clip.y + shiftY };
    const tracks: Track[] = [];
    for (const kind of ['days', 'items', 'labels'] as const) {
        const keys = new Set([...from[kind].keys(), ...to[kind].keys()]);
        for (const key of keys) {
            let a = from[kind].get(key), b = to[kind].get(key);
            if (kind === 'days') {
                a ??= projectedDay(from, b!.day);
                b ??= projectedDay(to, a!.day);
            }
            if (kind === 'items') {
                if (!a && b)
                    a = projectedItem(from, b);
                if (!b && a)
                    b = projectedItem(to, a);
            }
            if (kind === 'labels') {
                const seed = a ?? b!;
                if (key.startsWith('date:')) {
                    const scene = a ? to : from, day = projectedDay(scene, seed.day);
                    const virtual = day ? { ...seed, box: { ...seed.box, x: day.box.x + 8, y: scene.mode === 'day' && scene.days.has(seed.day) ? -32 : day.box.y + 8 } } : undefined;
                    if (!a)
                        a = virtual;
                    if (!b)
                        b = virtual;
                }
                else {
                    a ??= { ...seed, box: { ...seed.box, y: -28 } };
                    b ??= { ...seed, box: { ...seed.box, y: -28 } };
                }
            }
            if (!a && b)
                a = { ...b, box: { ...b.box, y: from.clip.y + from.clip.height + 24 } };
            if (!b && a)
                b = { ...a, box: { ...a.box, y: to.clip.y + to.clip.height + 24 } };
            if (!a || !b)
                continue;
            const el = surface(kind === 'labels' && key.startsWith('weekday:') ? overlay : layer, a, kind === 'labels');
            el.dataset.morphKey = key;
            if (kind === 'labels') {
                el.style.overflow = 'visible';
                el.style.textOverflow = 'clip';
            }
            const title = kind === 'items' ? surface(el, a, true) : null;
            // Background changes are independent of position. The carried title never fades.
            el.animate([{ backgroundColor: a.background, borderColor: a.border, borderRadius: `${a.radius}px` }, { backgroundColor: b.background, borderColor: b.border, borderRadius: `${b.radius}px` }], { duration: 520, fill: 'forwards' });
            tracks.push({ el, from: a, to: b, title, current: a, kind, key });
        }
    }
    const aside = from.aside ?? to.aside;
    let asideNode: HTMLElement | null = null, asideFrom: Box | undefined, asideTo: Box | undefined;
    if (aside) {
        asideNode = aside.node;
        asideNode.removeAttribute('id');
        Object.assign(asideNode.style, { position: 'absolute', left: '0', top: '0', margin: '0', pointerEvents: 'none' });
        overlay.prepend(asideNode);
        const exit = (b: Box) => ({ ...b, x: b.x > to.bounds.width * .3 ? to.bounds.width + 24 : b.x, y: b.x > to.bounds.width * .3 ? b.y : Math.max(from.bounds.height, to.bounds.height) + 24 });
        asideFrom = from.aside?.box ?? exit(aside.box);
        asideTo = to.aside?.box ?? exit(aside.box);
    }
    content.style.visibility = 'hidden';
    content.inert = true;
    root.style.overflow = 'hidden';
    let frame = 0, progress = 0;
    const start = performance.now(), duration = 520;
    const finish = () => { cancelAnimationFrame(frame); overlay.remove(); content.style.visibility = ''; content.inert = false; root.style.height = ''; root.style.overflow = ''; };
    function draw(now: number) {
        const linear = Math.min(1, (now - start) / duration);
        progress = linear * linear * (3 - 2 * linear);
        const height = mix(from.bounds.height, to.bounds.height, progress);
        root.style.height = `${height}px`;
        const clip = lerp(from.clip, to.clip, progress);
        layer.style.clipPath = `inset(${Math.max(0, clip.y)}px ${Math.max(0, to.bounds.width - clip.x - clip.width)}px ${Math.max(0, height - clip.y - clip.height)}px ${Math.max(0, clip.x)}px)`;
        for (const tr of tracks) {
            const b = lerp(tr.from.box, tr.to.box, progress);
            paintBox(tr.el, b);
            tr.current = { ...tr.to, box: b, fontSize: mix(tr.from.fontSize, tr.to.fontSize, progress) };
            if (tr.kind === 'labels')
                tr.el.style.fontSize = `${tr.current.fontSize}px`;
            if (tr.title) {
                const a = tr.from.title ?? tr.from.box, z = tr.to.title ?? tr.to.box, t = lerp(a, z, progress);
                tr.current.title = t;
                paintBox(tr.title, { x: t.x - b.x, y: t.y - b.y, width: Math.min(t.width, b.width - (t.x - b.x)), height: t.height });
                tr.title.style.fontSize = `${mix(tr.from.fontSize, tr.to.fontSize, progress)}px`;
            }
        }
        if (asideNode && asideFrom && asideTo)
            paintBox(asideNode, lerp(asideFrom, asideTo, progress));
        if (linear < 1)
            frame = requestAnimationFrame(draw);
        else {
            finish();
            onFinish();
        }
    }
    frame = requestAnimationFrame(draw);
    return { cancel: finish, snapshot: (): PlanScene => ({ ...to, bounds: { ...to.bounds, height: mix(from.bounds.height, to.bounds.height, progress) }, clip: lerp(from.clip, to.clip, progress),
            days: new Map(tracks.filter(t => t.kind === 'days').map(t => [t.key, { ...t.current }])), items: new Map(tracks.filter(t => t.kind === 'items').map(t => [t.key, { ...t.current }])), labels: new Map(tracks.filter(t => t.kind === 'labels').map(t => [t.key, { ...t.current }])), aside: asideNode ? { box: lerp(asideFrom!, asideTo!, progress), node: asideNode.cloneNode(true) as HTMLElement } : null }) };
}
