import type { PlannerCalendarViewMode } from "./calendar-surface.types";

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * The CSS `font` shorthand omits letter-spacing and text-transform, so a surrogate
 * built from it renders "Mon" at normal tracking where the week row paints "MON"
 * wide-tracked. Every text property that changes glyph geometry is captured here.
 */
interface Typography {
    family: string;
    weight: string;
    style: string;
    size: number;
    letterSpacing: string;
    textTransform: string;
    lineHeight: string;
    color: string;
}
/** Where a mark lives structurally, which decides whether it should fly or cross-fade. */
type Role = 'cell' | 'pane' | 'header' | 'item';
interface Mark {
    box: Box;
    day: string;
    text: string;
    background: string;
    border: string;
    /** Selected-day emphasis is a ring, i.e. a box-shadow rather than a border. */
    shadow: string;
    radius: number;
    role: Role;
    index: number;
    /** Painted text rect, not the element rect: day numbers centre inside a pill in week view. */
    glyph?: Box;
    type?: Typography;
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
    /** Re-read each frame so a late scroll or reflow cannot leave the morph short of the real layout. */
    anchor: {
        selector: string;
        box: Box;
    } | null;
}
const DAY = "[data-calendar-week-row], [data-day-cell]";
const DAY_MS = 86400000;
/** The zoom concept runs at 720ms; month transitions move every tile at once and read better slower. */
export const PLAN_MORPH_DURATION_MS = 720;
export const PLAN_MORPH_MONTH_DURATION_MS = 820;
/** Smootherstep: zero velocity *and* zero acceleration at both ends, so nothing snaps into motion. */
const ease = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
/** Progress through a sub-window of the morph, for staggered fades. */
const ramp = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const distance = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / DAY_MS);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function lerp(a: Box, b: Box, t: number): Box {
    return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) };
}
function union(a: Box, b: Box): Box {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}
function opaque(color: string) { return Boolean(color) && color !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(color); }
function hasChrome(m: Mark) { return (m.shadow && m.shadow !== 'none') || opaque(m.background); }
function shift(b: Box, dx: number, dy: number): Box {
    return { x: b.x + dx, y: b.y + dy, width: b.width, height: b.height };
}
function box(el: Element, root: DOMRect): Box {
    const r = el.getBoundingClientRect();
    return { x: r.left - root.left, y: r.top - root.top, width: r.width, height: r.height };
}
/**
 * Union of the client rects of an element's text, so centring and padding drop out.
 * Falls back to the element box where range measurement is unavailable.
 */
function glyphBox(el: HTMLElement, root: DOMRect): Box | undefined {
    const range = typeof document.createRange === 'function' ? document.createRange() : null;
    if (!range || typeof range.getClientRects !== 'function')
        return undefined;
    range.selectNodeContents(el);
    const rects = Array.from(range.getClientRects());
    range.detach?.();
    if (!rects.length)
        return undefined;
    const left = Math.min(...rects.map(r => r.left)), top = Math.min(...rects.map(r => r.top));
    const right = Math.max(...rects.map(r => r.right)), bottom = Math.max(...rects.map(r => r.bottom));
    if (right <= left || bottom <= top)
        return undefined;
    return { x: left - root.left, y: top - root.top, width: right - left, height: bottom - top };
}
function typography(style: CSSStyleDeclaration): Typography {
    return { family: style.fontFamily, weight: style.fontWeight, style: style.fontStyle, size: parseFloat(style.fontSize) || 12,
        letterSpacing: style.letterSpacing, textTransform: style.textTransform, lineHeight: style.lineHeight, color: style.color };
}
/** `textEl` is the single element whose glyphs travel; omit it for pure surfaces such as day cells. */
function mark(el: HTMLElement, root: DOMRect, day: string, role: Role, index = 0, textEl?: HTMLElement | null): Mark {
    const style = getComputedStyle(el);
    const base: Mark = { box: box(el, root), day, index, role, text: "",
        background: style.backgroundColor, border: style.borderColor, shadow: style.boxShadow, radius: parseFloat(style.borderRadius) || 0 };
    if (!textEl)
        return base;
    return { ...base, text: textEl.textContent?.trim() ?? "", glyph: glyphBox(textEl, root), type: typography(getComputedStyle(textEl)) };
}
function labelMark(el: HTMLElement, root: DOMRect, day: string, role: Role): Mark {
    return mark(el, root, day, role, 0, el);
}
function itemMark(el: HTMLElement, root: DOMRect, day: string, index: number): Mark {
    return mark(el, root, day, 'item', index, el.querySelector<HTMLElement>('[data-testid="completion-title"]'));
}
function shown(el: HTMLElement) { return el.getBoundingClientRect().width > 0 && !el.closest('[aria-hidden="true"]'); }
function anchorSelector(day: string) {
    return `[data-plan-day="${day}"], [data-calendar-week-row][data-day="${day}"], [data-day-cell="true"][data-day="${day}"]`;
}
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
        days.set(day, mark(el, r, day, 'cell'));
        const number = el.querySelector<HTMLElement>('[data-plan-day-number]');
        if (number)
            labels.set(`date:${day}`, labelMark(number, r, day, 'cell'));
        const weekday = el.querySelector<HTMLElement>('[data-plan-weekday]');
        if (weekday)
            labels.set(`weekday:${new Date(`${day}T12:00:00Z`).getUTCDay()}`, labelMark(weekday, r, day, 'cell'));
    }
    const dayPane = mode === 'day' ? root.querySelector<HTMLElement>('[data-testid="plan-day-pane"]') : null;
    if (dayPane) {
        const day = dayPane.dataset.planDay!;
        days.set(day, mark(dayPane, r, day, 'pane'));
        // Day view carries its own number/weekday so week<->day has real endpoints
        // instead of synthetic off-screen ones.
        const number = dayPane.querySelector<HTMLElement>('[data-plan-day-number]');
        if (number)
            labels.set(`date:${day}`, labelMark(number, r, day, 'pane'));
        const weekday = dayPane.querySelector<HTMLElement>('[data-plan-weekday]');
        if (weekday)
            labels.set(`weekday:${new Date(`${day}T12:00:00Z`).getUTCDay()}`, labelMark(weekday, r, day, 'pane'));
    }
    root.querySelectorAll<HTMLElement>('[data-calendar-weekday-grid] [data-plan-weekday-index]').forEach(el => {
        if (shown(el))
            labels.set(`weekday:${el.dataset.planWeekdayIndex}`, labelMark(el, r, el.dataset.planWeekdayDate ?? '', 'header'));
    });
    const source = dayPane ?? calendar;
    const counts = new Map<string, number>();
    for (const el of source.querySelectorAll<HTMLElement>('[data-planner-entry-key]')) {
        if (!shown(el))
            continue;
        const day = el.closest<HTMLElement>('[data-day]')?.dataset.day ?? dayPane?.dataset.planDay ?? '';
        const index = counts.get(day) ?? 0;
        counts.set(day, index + 1);
        items.set(`${day}:${el.dataset.plannerEntryKey}`, itemMark(el, r, day, index));
    }
    const aside = root.querySelector<HTMLElement>('[data-testid="plan-desktop-day-pane"]');
    const anchorDay = [...days.keys()].sort()[Math.floor(days.size / 2)];
    return { mode, bounds: { x: r.x, y: r.y, width: r.width, height: r.height }, clip, days, items, labels,
        aside: aside ? { box: box(aside, r), node: aside.cloneNode(true) as HTMLElement } : null,
        anchor: anchorDay ? { selector: anchorSelector(anchorDay), box: days.get(anchorDay)!.box } : null };
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
    // Drop the anchor's emphasis: in day view the anchor is the selected pane, and
    // inheriting its ring drew a selected border around every projected date.
    return { ...anchor, day, shadow: 'none', box: { ...anchor.box, y: anchor.box.y + distance(day, anchorDate) * pitch } };
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
    const glyphSource = sample?.glyph && sampleDay ? { dx: sample.glyph.x - sample.box.x, dy: sample.glyph.y - sample.box.y } : { dx: 6, dy: 0 };
    const type = sample?.type ?? source.type;
    const glyph = { x: target.x + glyphSource.dx, y: target.y + glyphSource.dy + Math.max(0, (h - (type?.size ?? 12) * 1.2) / 2),
        width: Math.max(16, target.width - glyphSource.dx - 6), height: (type?.size ?? 12) * 1.2 };
    return { ...source, box: target, glyph, type };
}
/**
 * A label whose counterpart is missing travels with its own date instead of a fixed
 * off-screen slot, which is what made week->day drag every label upward.
 */
function projectedLabel(target: PlanScene, source: PlanScene, seed: Mark): Mark | undefined {
    const to = projectedDay(target, seed.day), from = source.days.get(seed.day) ?? projectedDay(source, seed.day);
    if (!to || !from)
        return;
    const dx = to.box.x - from.box.x, dy = to.box.y - from.box.y;
    return { ...seed, box: shift(seed.box, dx, dy), glyph: seed.glyph ? shift(seed.glyph, dx, dy) : undefined };
}
function paintBox(el: HTMLElement, b: Box) {
    el.style.transform = `translate(${b.x}px,${b.y}px)`;
    el.style.width = `${Math.max(0, b.width)}px`;
    el.style.height = `${Math.max(0, b.height)}px`;
}
function surface(parent: HTMLElement, m: Mark) {
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', margin: '0', boxSizing: 'border-box', overflow: 'hidden', pointerEvents: 'none',
        background: m.background, border: `1px solid ${m.border}`, boxShadow: m.shadow === 'none' ? '' : m.shadow,
        borderRadius: `${m.radius}px`, transformOrigin: '0 0' });
    parent.append(el);
    return el;
}
/**
 * One layer per endpoint, each pinned to its own typography and cross-faded. Family,
 * weight, tracking and casing cannot be interpolated, so both ends stay pixel-exact
 * and the change reads as a dissolve rather than a snap.
 */
interface Glyph {
    el: HTMLElement;
    /** Text rect relative to its container's paint origin at measurement time. */
    own: Box;
}
const ORIGIN: Box = { x: 0, y: 0, width: 0, height: 0 };
function glyph(parent: HTMLElement, m: Mark, overlay: DOMRect, origin: Box): Glyph | null {
    if (!m.glyph || !m.type || !m.text)
        return null;
    const el = document.createElement('div');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', margin: '0', padding: '0', pointerEvents: 'none',
        whiteSpace: 'nowrap', transformOrigin: '0 0', fontFamily: m.type.family, fontWeight: m.type.weight, fontStyle: m.type.style,
        fontSize: `${m.type.size}px`, letterSpacing: m.type.letterSpacing, textTransform: m.type.textTransform,
        lineHeight: m.type.lineHeight, color: m.type.color });
    el.textContent = m.text;
    parent.append(el);
    const measured = glyphBox(el, overlay);
    if (!measured) {
        el.remove();
        return null;
    }
    return { el, own: shift(measured, -origin.x, -origin.y) };
}
function paintGlyph(g: Glyph, target: Box, origin: Box, opacity: number) {
    const scale = g.own.height > 0 ? target.height / g.own.height : 1;
    g.el.style.transform = `translate(${target.x - origin.x - g.own.x * scale}px,${target.y - origin.y - g.own.y * scale}px) scale(${scale})`;
    g.el.style.opacity = `${opacity}`;
}
interface Track {
    /** Background, border and ring. */
    el: HTMLElement | null;
    /** Bounds carried text to its tile, so month pills stay truncated mid-morph. */
    clip: HTMLElement | null;
    from: Mark;
    to: Mark;
    fromGlyph: Glyph | null;
    toGlyph: Glyph | null;
    current: Mark;
    kind: 'days' | 'items' | 'labels';
    key: string;
    /** Present on only one side: fade there rather than cut out at the end. */
    fade: 'in' | 'out' | null;
    /** Endpoints play different structural roles: cross-fade in place instead of flying. */
    hold: boolean;
    /** Whether the month grid's scroll correction applies to this mark. */
    corrected: boolean;
}
export function animatePlanScene(root: HTMLElement, content: HTMLElement, from: PlanScene, to: PlanScene, onFinish: () => void) {
    const duration = from.mode === 'month' || to.mode === 'month' ? PLAN_MORPH_MONTH_DURATION_MS : PLAN_MORPH_DURATION_MS;
    // The stage keeps a constant height across the morph. Sizing it to the shrinking
    // root instead made the root's bottom edge sweep up through the tiles.
    const stage = Math.max(from.bounds.height, to.bounds.height);
    const overlay = document.createElement('div');
    overlay.dataset.planMorphOverlay = 'true';
    overlay.toggleAttribute('inert', true);
    overlay.setAttribute('aria-hidden', 'true');
    Object.assign(overlay.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: `${stage}px`, pointerEvents: 'none', zIndex: '20' });
    root.append(overlay);
    const layer = document.createElement('div');
    Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: `${stage}px` });
    overlay.append(layer);
    const surfaces = document.createElement('div');
    const glyphs = document.createElement('div');
    const headerGlyphs = document.createElement('div');
    for (const el of [surfaces, glyphs, headerGlyphs])
        Object.assign(el.style, { position: 'absolute', inset: '0' });
    layer.append(surfaces, glyphs);
    overlay.append(headerGlyphs);
    const overlayRect = overlay.getBoundingClientRect();
    // Preserve screen coordinates if normal layout/scroll anchoring moved the frame at commit.
    const shiftX = from.bounds.x - to.bounds.x, shiftY = from.bounds.y - to.bounds.y;
    for (const group of [from.days, from.items, from.labels])
        for (const m of group.values()) {
            m.box = shift(m.box, shiftX, shiftY);
            if (m.glyph)
                m.glyph = shift(m.glyph, shiftX, shiftY);
        }
    from.clip = shift(from.clip, shiftX, shiftY);
    const tracks: Track[] = [];
    for (const kind of ['days', 'items', 'labels'] as const) {
        const keys = new Set([...from[kind].keys(), ...to[kind].keys()]);
        for (const key of keys) {
            const realA = from[kind].get(key), realB = to[kind].get(key);
            let a = realA, b = realB;
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
                if (!a && b)
                    a = projectedLabel(from, to, b);
                else if (!b && a)
                    b = projectedLabel(to, from, a);
                const seed = a ?? b;
                a ??= seed;
                b ??= seed;
            }
            if (!a && b)
                a = { ...b, box: { ...b.box, y: from.clip.y + from.clip.height + 24 } };
            if (!b && a)
                b = { ...a, box: { ...a.box, y: to.clip.y + to.clip.height + 24 } };
            if (!a || !b)
                continue;
            const fade: Track['fade'] = !realA ? 'in' : !realB ? 'out' : null;
            // A weekday label moving between a day cell and the month header changes role
            // rather than position; flying it read as a jump at both ends.
            const hold = kind === 'labels' && key.startsWith('weekday:')
                && (a.role === 'header') !== (b.role === 'header');
            // The correction tracks the month grid's scroll. The weekday header sits
            // outside that viewport, so inheriting it pulled the header off its landing.
            const corrected = a.role !== 'header' && b.role !== 'header';
            const host = kind === 'labels' && (a.role === 'header' || b.role === 'header') ? headerGlyphs : glyphs;
            // Labels normally carry no surface, but the selected date's ring and circle do.
            const el = kind !== 'labels' || (!hold && (hasChrome(a) || hasChrome(b)))
                ? surface(surfaces, a)
                : null;
            if (el)
                paintBox(el, a.box);
            let clip: HTMLElement | null = null;
            if (kind === 'items') {
                clip = document.createElement('div');
                Object.assign(clip.style, { position: 'absolute', left: '0', top: '0', overflow: 'hidden', pointerEvents: 'none', transformOrigin: '0 0' });
                host.append(clip);
                paintBox(clip, a.box);
            }
            const origin = clip ? a.box : ORIGIN;
            if (el && typeof el.animate === 'function')
                el.animate([{ backgroundColor: a.background, borderColor: a.border, borderRadius: `${a.radius}px`, boxShadow: a.shadow },
                    { backgroundColor: b.background, borderColor: b.border, borderRadius: `${b.radius}px`, boxShadow: b.shadow }], { duration, fill: 'forwards' });
            tracks.push({ el, clip, from: a, to: b, fromGlyph: glyph(clip ?? host, a, overlayRect, origin),
                toGlyph: glyph(clip ?? host, b, overlayRect, origin), current: a, kind, key, fade, hold, corrected });
        }
    }
    const aside = from.aside ?? to.aside;
    let asideNode: HTMLElement | null = null, asideFrom: Box | undefined, asideTo: Box | undefined;
    if (aside) {
        asideNode = aside.node;
        asideNode.removeAttribute('id');
        Object.assign(asideNode.style, { position: 'absolute', left: '0', top: '0', margin: '0', pointerEvents: 'none' });
        overlay.prepend(asideNode);
        const exit = (b: Box) => ({ ...b, x: b.x > to.bounds.width * .3 ? to.bounds.width + 24 : b.x, y: b.x > to.bounds.width * .3 ? b.y : stage + 24 });
        asideFrom = from.aside?.box ?? exit(aside.box);
        asideTo = to.aside?.box ?? exit(aside.box);
    }
    // Opacity rather than visibility: the destination carries plenty the morph never
    // models (checkboxes, section headings), and those need to fade rather than pop.
    content.style.opacity = '0';
    content.toggleAttribute('inert', true);
    // Held constant rather than interpolated: an animated clip edge is a visible line
    // sweeping across the tiles. This still masks month-grid overflow.
    const clipRect = union(from.clip, to.clip);
    layer.style.clipPath = `inset(${Math.max(0, clipRect.y)}px ${Math.max(0, to.bounds.width - clipRect.x - clipRect.width)}px ${Math.max(0, stage - clipRect.y - clipRect.height)}px ${Math.max(0, clipRect.x)}px)`;
    let frame = 0, progress = 0, correctX = 0, correctY = 0;
    const start = performance.now();
    const finish = () => {
        cancelAnimationFrame(frame);
        overlay.remove();
        content.style.opacity = '';
        content.toggleAttribute('inert', false);
        root.style.height = '';
    };
    /**
     * The month viewport aligns its scroll in a later frame than the commit, so the
     * measured destination can be stale. Re-reading one live element each frame keeps
     * the end of the morph on the real layout instead of cutting to it.
     */
    function correction() {
        if (!to.anchor)
            return;
        const live = root.querySelector<HTMLElement>(to.anchor.selector);
        if (!live)
            return;
        const now = box(live, root.getBoundingClientRect());
        correctX = now.x - to.anchor.box.x;
        correctY = now.y - to.anchor.box.y;
    }
    function draw(now: number) {
        const linear = Math.min(1, (now - start) / duration);
        progress = ease(linear);
        correction();
        const aim = (tr: Track, b: Box) => tr.corrected ? shift(b, correctX * progress, correctY * progress) : b;
        root.style.height = `${mix(from.bounds.height, to.bounds.height, progress)}px`;
        // Cross-dissolve into the real view over the tail, once surrogates have all but
        // converged, so unmodelled chrome settles in instead of appearing at the end.
        content.style.opacity = `${ramp(progress, .68, 1)}`;
        overlay.style.opacity = `${1 - ramp(progress, .82, 1)}`;
        for (const tr of tracks) {
            const b = lerp(tr.from.box, aim(tr, tr.to.box), progress);
            const alpha = tr.fade === 'in' ? ramp(progress, .05, .55)
                : tr.fade === 'out' ? 1 - ramp(progress, .1, .6)
                : 1;
            if (tr.el) {
                paintBox(tr.el, b);
                tr.el.style.opacity = `${alpha}`;
            }
            if (tr.clip)
                paintBox(tr.clip, b);
            tr.current = { ...tr.to, box: b };
            if (tr.fromGlyph || tr.toGlyph) {
                const origin = tr.clip ? b : ORIGIN;
                const a0 = tr.from.glyph ?? tr.from.box, z = aim(tr, tr.to.glyph ?? tr.to.box);
                const g = lerp(a0, z, progress);
                tr.current.glyph = g;
                if (tr.fromGlyph)
                    paintGlyph(tr.fromGlyph, tr.hold ? a0 : g, origin, alpha * (tr.fade ? 1 : 1 - progress));
                if (tr.toGlyph)
                    paintGlyph(tr.toGlyph, tr.hold ? z : g, origin, alpha * (tr.fade ? 1 : progress));
            }
        }
        if (asideNode && asideFrom && asideTo)
            paintBox(asideNode, lerp(asideFrom, shift(asideTo, correctX * progress, correctY * progress), progress));
        if (linear < 1)
            frame = requestAnimationFrame(draw);
        else {
            finish();
            onFinish();
        }
    }
    // Painted synchronously, in the same task that inserted the surrogates: waiting for
    // the first frame let every unpositioned element show as a pile at the stage origin.
    draw(start);
    return { cancel: finish, snapshot: (): PlanScene => ({ ...to, bounds: { ...to.bounds, height: mix(from.bounds.height, to.bounds.height, progress) }, clip: lerp(from.clip, to.clip, progress),
            days: new Map(tracks.filter(t => t.kind === 'days').map(t => [t.key, { ...t.current }])), items: new Map(tracks.filter(t => t.kind === 'items').map(t => [t.key, { ...t.current }])), labels: new Map(tracks.filter(t => t.kind === 'labels').map(t => [t.key, { ...t.current }])),
            aside: asideNode ? { box: lerp(asideFrom!, asideTo!, progress), node: asideNode.cloneNode(true) as HTMLElement } : null }) };
}
