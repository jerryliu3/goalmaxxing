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
    borderWidths: string;
    borderStyles: string;
    /** Selected-day emphasis is a ring, i.e. a box-shadow rather than a border. */
    shadow: string;
    radius: number;
    role: Role;
    index: number;
    /** Painted text rect, not the element rect: day numbers centre inside a pill in week view. */
    glyph?: Box;
    type?: Typography;
    textClip?: Box;
    auxiliary?: HTMLElement;
    completed?: boolean;
    opacity?: number;
}
export interface PlanScene {
    mode: PlannerCalendarViewMode;
    bounds: Box;
    clip: Box;
    days: Map<string, Mark>;
    items: Map<string, Mark>;
    labels: Map<string, Mark>;
    residue: HTMLElement;
    header: { box: Box; node: HTMLElement } | null;
    aside: {
        box: Box;
        node: HTMLElement;
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
/**
 * The frame hides the destination before the morph can measure it, and the morph
 * reveals it again. Both go through here so the two can never disagree about which
 * property is doing the hiding and leave the view stuck invisible.
 */
export function hidePlanContent(content: HTMLElement) {
    content.style.opacity = '0';
}
export function revealPlanContent(content: HTMLElement) {
    content.style.opacity = '';
    content.style.visibility = '';
}
const distance = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / DAY_MS);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function lerp(a: Box, b: Box, t: number): Box {
    return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) };
}
function union(a: Box, b: Box): Box {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}
function intersection(a: Box, b: Box): Box {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) };
}
function clipTo(el: HTMLElement, b: Box, viewport: Box) {
    el.style.clipPath = `inset(${Math.max(0, viewport.y - b.y)}px ${Math.max(0, b.x + b.width - viewport.x - viewport.width)}px ${Math.max(0, b.y + b.height - viewport.y - viewport.height)}px ${Math.max(0, viewport.x - b.x)}px)`;
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
        background: style.backgroundColor, border: style.borderColor, borderWidths: style.borderWidth,
        borderStyles: style.borderStyle, shadow: style.boxShadow, radius: parseFloat(style.borderRadius) || 0 };
    if (!textEl)
        return base;
    return { ...base, text: textEl.textContent?.trim() ?? "", glyph: glyphBox(textEl, root), type: typography(getComputedStyle(textEl)),
        completed: textEl.dataset.completed === 'true' };
}
function labelMark(el: HTMLElement, root: DOMRect, day: string, role: Role): Mark {
    return mark(el, root, day, role, 0, el);
}
function itemMark(el: HTMLElement, root: DOMRect, day: string, index: number): Mark {
    const title = el.querySelector<HTMLElement>('[data-testid="completion-title"]');
    const item = mark(el, root, day, 'item', index, title);
    const auxiliary = el.cloneNode(true) as HTMLElement;
    auxiliary.querySelectorAll<HTMLElement>('[data-testid="completion-title"]').forEach(node => node.style.visibility = 'hidden');
    clearChrome(auxiliary);
    const titleBox = title ? box(title, root) : item.box;
    // Measure the available title column, not the intrinsic width of an inline span.
    // Text stays at its natural width; only this viewport and the moving tile clip it.
    const textViewport = title?.closest<HTMLElement>('[data-plan-title-viewport], .truncate');
    const viewport = textViewport ? box(textViewport, root) : item.box;
    const viewportStyle = textViewport ? getComputedStyle(textViewport) : getComputedStyle(el);
    const right = Math.min(item.box.x + item.box.width,
        viewport.x + viewport.width - (parseFloat(viewportStyle.paddingRight) || 0) - (parseFloat(viewportStyle.borderRightWidth) || 0));
    return { ...item, auxiliary, textClip: {
        x: Math.max(item.box.x, titleBox.x, viewport.x), y: viewport.y,
        width: Math.max(0, right - Math.max(item.box.x, titleBox.x, viewport.x)),
        height: viewport.height,
    } };
}
function clearChrome(node: HTMLElement) {
    node.style.background = 'transparent';
    node.style.borderColor = 'transparent';
    node.style.boxShadow = 'none';
}
function residue(root: HTMLElement, mode: PlannerCalendarViewMode) {
    const source = root.querySelector<HTMLElement>('[data-plan-view]') ?? root;
    const node = source.cloneNode(true) as HTMLElement;
    node.style.opacity = '1';
    node.style.visibility = 'visible';
    // Leave section headings, todos, empty states and other non-carried content.
    // They fade independently, without fading the moving items themselves.
    node.querySelectorAll<HTMLElement>('[data-planner-entry-key], [data-plan-day-number], [data-plan-weekday], [data-calendar-weekday-grid], [data-testid="plan-desktop-day-pane"]').forEach(el => el.style.visibility = 'hidden');
    if (mode !== 'day') node.querySelectorAll<HTMLElement>(DAY).forEach(el => el.style.visibility = 'hidden');
    node.querySelectorAll<HTMLElement>('[data-plan-day]').forEach(clearChrome);
    return node;
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
    const header = root.querySelector<HTMLElement>('[data-calendar-weekday-grid]');
    return { mode, bounds: { x: r.x, y: r.y, width: r.width, height: r.height }, clip, days, items, labels,
        residue: residue(root, mode), header: header ? { box: box(header, r), node: header.cloneNode(true) as HTMLElement } : null,
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
    // Drop the anchor's emphasis: in day view the anchor is the selected pane, and
    // inheriting its ring drew a selected border around every projected date.
    return { ...anchor, day, shadow: 'none', borderWidths: '0px', box: { ...anchor.box, y: anchor.box.y + distance(day, anchorDate) * pitch } };
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
    return { ...source, box: target, glyph, type, textClip: target };
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
        background: m.background, borderColor: m.border, borderWidth: m.borderWidths, borderStyle: m.borderStyles,
        boxShadow: m.shadow === 'none' ? '' : m.shadow,
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
    if (m.completed) {
        el.className = 'gm-completion-title';
        el.dataset.completed = 'true';
    }
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
    g.el.style.width = 'max-content';
    g.el.style.overflow = 'visible';
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
    auxiliaryFrom: HTMLElement | null;
    auxiliaryTo: HTMLElement | null;
    singleGlyph: boolean;
    chrome: Animation | null;
    borders: [HTMLElement, HTMLElement] | null;
}
function borderLayer(parent: HTMLElement, mark: Mark) {
    const node = document.createElement('div');
    Object.assign(node.style, { position: 'absolute', inset: '0', pointerEvents: 'none',
        boxSizing: 'border-box', borderRadius: 'inherit', borderColor: mark.border,
        borderWidth: mark.borderWidths, borderStyle: mark.borderStyles });
    parent.append(node);
    return node;
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
    // Build and measure invisibly; reveal only after every layer is positioned.
    overlay.style.visibility = 'hidden';
    const layer = document.createElement('div');
    Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: `${stage}px` });
    overlay.append(layer);
    const surfaces = document.createElement('div');
    const glyphs = document.createElement('div');
    for (const el of [surfaces, glyphs])
        Object.assign(el.style, { position: 'absolute', inset: '0' });
    layer.append(surfaces, glyphs);
    const residueLayers = [from.residue, to.residue];
    residueLayers.forEach((node, index) => {
        Object.assign(node.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none' });
        node.style.width = `${(index ? to : from).bounds.width}px`;
        overlay.append(node);
    });
    const headerLayers = [from.header, to.header].map(header => {
        if (!header) return null;
        Object.assign(header.node.style, { position: 'absolute', left: '0', top: '0', margin: '0', pointerEvents: 'none' });
        header.node.style.backgroundColor = getComputedStyle(root).getPropertyValue('--background').trim()
            ? 'var(--background)' : getComputedStyle(document.body).backgroundColor;
        overlay.append(header.node);
        paintBox(header.node, header.box);
        return header.node;
    });
    const overlayRect = overlay.getBoundingClientRect();
    // Preserve screen coordinates if normal layout/scroll anchoring moved the frame at commit.
    const shiftX = from.bounds.x - to.bounds.x, shiftY = from.bounds.y - to.bounds.y;
    for (const group of [from.days, from.items, from.labels])
        for (const m of group.values()) {
            m.box = shift(m.box, shiftX, shiftY);
            if (m.glyph)
                m.glyph = shift(m.glyph, shiftX, shiftY);
            if (m.textClip) m.textClip = shift(m.textClip, shiftX, shiftY);
        }
    from.clip = shift(from.clip, shiftX, shiftY);
    const tracks: Track[] = [];
    for (const kind of ['days', 'items', 'labels'] as const) {
        const keys = new Set([...from[kind].keys(), ...to[kind].keys()]);
        for (const key of keys) {
            const realA = from[kind].get(key), realB = to[kind].get(key);
            let a = realA, b = realB;
            // Month headings fade as one stationary strip. Week labels remain
            // attached to their date, rather than flying into that strip.
            if (kind === 'labels' && (a?.role === 'header' || b?.role === 'header')) {
                if (a?.role === 'header') a = undefined;
                if (b?.role === 'header') b = undefined;
                if (!a && !b) continue;
            }
            const sourcePresent = Boolean(a), targetPresent = Boolean(b);
            if (kind === 'days') {
                a ??= projectedDay(from, b!.day);
                b ??= projectedDay(to, a!.day);
                // Projection supplies coordinates, never another date's appearance.
                if (!realA && a && realB) a = { ...realB, box: a.box };
                if (!realB && b && realA) b = { ...realA, box: b.box };
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
            const fade: Track['fade'] = !sourcePresent ? 'in' : !targetPresent ? 'out' : null;
            const host = glyphs;
            // Labels normally carry no surface, but the selected date's ring and circle do.
            const el = kind !== 'labels' || hasChrome(a) || hasChrome(b)
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
            const auxiliaryFrom = kind === 'items' ? a.auxiliary?.cloneNode(true) as HTMLElement | undefined : undefined;
            const auxiliaryTo = kind === 'items' ? b.auxiliary?.cloneNode(true) as HTMLElement | undefined : undefined;
            for (const auxiliary of [auxiliaryFrom, auxiliaryTo]) {
                if (!auxiliary) continue;
                Object.assign(auxiliary.style, { position: 'absolute', left: '0', top: '0', margin: '0', overflow: 'hidden', pointerEvents: 'none' });
                glyphs.append(auxiliary);
            }
            const singleGlyph = a.text === b.text && a.type?.family === b.type?.family && a.type?.style === b.type?.style && a.type?.textTransform === b.type?.textTransform;
            const borders: Track['borders'] = el ? [borderLayer(el, a), borderLayer(el, b)] : null;
            const chrome = el && typeof el.animate === 'function' ? el.animate([
                { backgroundColor: a.background, borderRadius: `${a.radius}px`, boxShadow: a.shadow },
                { backgroundColor: b.background, borderRadius: `${b.radius}px`, boxShadow: b.shadow },
            ], { duration, fill: 'both', easing: 'linear' }) : null;
            chrome?.pause();
            if (el) el.style.borderWidth = '0';
            tracks.push({ el, clip, from: a, to: b, fromGlyph: glyph(clip ?? host, a, overlayRect, origin),
                toGlyph: singleGlyph ? null : glyph(clip ?? host, b, overlayRect, origin), current: a, kind, key, fade,
                auxiliaryFrom: auxiliaryFrom ?? null, auxiliaryTo: auxiliaryTo ?? null, singleGlyph, chrome, borders });
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
    // The live tree stays hidden until handoff. Only ancillary layers dissolve.
    hidePlanContent(content);
    content.toggleAttribute('inert', true);
    root.style.overflowAnchor = 'none';
    // Held constant rather than interpolated: an animated clip edge is a visible line
    // sweeping across the tiles. This still masks month-grid overflow.
    const clipRect = union(from.clip, to.clip);
    layer.style.clipPath = `inset(${Math.max(0, clipRect.y)}px ${Math.max(0, to.bounds.width - clipRect.x - clipRect.width)}px ${Math.max(0, stage - clipRect.y - clipRect.height)}px ${Math.max(0, clipRect.x)}px)`;
    let frame = 0, progress = 0;
    const start = performance.now();
    const finish = () => {
        cancelAnimationFrame(frame);
        overlay.remove();
        revealPlanContent(content);
        content.toggleAttribute('inert', false);
        root.style.height = '';
        root.style.overflowAnchor = '';
        tracks.forEach(track => track.chrome?.cancel());
    };
    function draw(now: number) {
        const linear = Math.min(1, (now - start) / duration);
        progress = ease(linear);
        root.style.height = `${mix(from.bounds.height, to.bounds.height, progress)}px`;
        residueLayers[0].style.transform = `translate(${shiftX}px,${shiftY}px)`;
        residueLayers[0].style.opacity = `${1 - ramp(linear, 0, .3)}`;
        residueLayers[1].style.opacity = `${ramp(linear, .4, .85)}`;
        headerLayers.forEach((node, index) => {
            if (!node) return;
            const header = index ? to.header! : from.header!;
            paintBox(node, index ? header.box : shift(header.box, shiftX, shiftY));
            node.style.opacity = `${index ? ramp(linear, .55, .9) : 1 - ramp(linear, 0, .3)}`;
        });
        const dayBoxes = new Map(tracks.filter(tr => tr.kind === 'days').map(tr => [tr.key, lerp(tr.from.box, tr.to.box, progress)]));
        for (const tr of tracks) {
            const b = lerp(tr.from.box, tr.to.box, progress);
            const presence = tr.fade === 'in' ? ramp(linear, .05, .35)
                : tr.fade === 'out' ? 1 - ramp(linear, .35, .85)
                : 1;
            const alpha = presence * mix(tr.from.opacity ?? 1, tr.to.opacity ?? 1, progress);
            const viewport = tr.kind === 'items' ? intersection(b, dayBoxes.get(tr.to.day) ?? b) : b;
            if (tr.el) {
                paintBox(tr.el, b);
                tr.el.style.opacity = `${alpha}`;
                if (tr.kind === 'items') clipTo(tr.el, b, viewport);
                // Chrome and geometry share the same clock and eased progress.
                if (tr.chrome) tr.chrome.currentTime = progress * duration;
                if (tr.borders) {
                    tr.borders[0].style.opacity = `${1 - progress}`;
                    tr.borders[1].style.opacity = `${progress}`;
                }
            }
            const textViewport = intersection(viewport, lerp(tr.from.textClip ?? tr.from.box, tr.to.textClip ?? tr.to.box, progress));
            if (tr.clip) paintBox(tr.clip, textViewport);
            for (const [index, auxiliary] of [tr.auxiliaryFrom, tr.auxiliaryTo].entries()) {
                if (!auxiliary) continue;
                paintBox(auxiliary, b);
                clipTo(auxiliary, b, viewport);
                auxiliary.style.opacity = `${alpha * (index ? ramp(linear, .35, .8) : 1 - ramp(linear, .15, .6))}`;
            }
            tr.current = { ...tr.to, box: b, textClip: textViewport, opacity: alpha };
            if (tr.fromGlyph || tr.toGlyph) {
                const origin = tr.clip ? textViewport : ORIGIN;
                const a0 = tr.from.glyph ?? tr.from.box, z = tr.to.glyph ?? tr.to.box;
                const g = lerp(a0, z, progress);
                tr.current.glyph = g;
                if (tr.singleGlyph && tr.fromGlyph && tr.from.type && tr.to.type) {
                    const scale = g.height / tr.fromGlyph.own.height;
                    tr.fromGlyph.el.style.fontWeight = `${mix(parseFloat(tr.from.type.weight) || 400, parseFloat(tr.to.type.weight) || 400, progress)}`;
                    tr.fromGlyph.el.style.letterSpacing = `${mix(parseFloat(tr.from.type.letterSpacing) || 0, parseFloat(tr.to.type.letterSpacing) || 0, progress) / (scale || 1)}px`;
                    tr.fromGlyph.el.style.color = `color-mix(in srgb, ${tr.from.type.color} ${(1 - progress) * 100}%, ${tr.to.type.color})`;
                }
                if (tr.fromGlyph)
                    paintGlyph(tr.fromGlyph, g, origin, alpha * (tr.singleGlyph ? 1 : 1 - progress));
                if (tr.toGlyph)
                    paintGlyph(tr.toGlyph, g, origin, alpha * progress);
            }
        }
        if (asideNode && asideFrom && asideTo)
            paintBox(asideNode, lerp(asideFrom, asideTo, progress));
        if (asideNode) asideNode.style.opacity = `${!to.aside ? 1 - ramp(linear, .35, .85) : !from.aside ? ramp(linear, .15, .65) : 1}`;
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
    overlay.style.visibility = 'visible';
    return { cancel: finish, snapshot: (): PlanScene => {
        const currentResidue = document.createElement('div');
        residueLayers.forEach(node => currentResidue.append(node.cloneNode(true)));
        return ({ ...to, residue: currentResidue, bounds: { ...to.bounds, height: mix(from.bounds.height, to.bounds.height, progress) }, clip: lerp(from.clip, to.clip, progress),
            days: new Map(tracks.filter(t => t.kind === 'days').map(t => [t.key, { ...t.current }])), items: new Map(tracks.filter(t => t.kind === 'items').map(t => [t.key, { ...t.current }])), labels: new Map(tracks.filter(t => t.kind === 'labels').map(t => [t.key, { ...t.current }])),
            aside: asideNode ? { box: lerp(asideFrom!, asideTo!, progress), node: asideNode.cloneNode(true) as HTMLElement } : null });
    } };
}
