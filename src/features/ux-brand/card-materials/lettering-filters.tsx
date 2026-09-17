/** Glyph-alpha masks preserve foil color while lighting the actual letter edges.
 * Unlike reversed drop shadows, engraving casts its shadow INSIDE the glyph. */
function ReliefFilter({ id, depth, engraved }: { id: string; depth: number; engraved: boolean }) {
  return <filter id={id} x="-30%" y="-40%" width="160%" height="180%" colorInterpolationFilters="sRGB">
    <feOffset in="SourceAlpha" dx={depth * .65} dy={depth} result="lower" />
    <feOffset in="SourceAlpha" dx={-depth * .65} dy={-depth} result="upper" />
    <feComposite in="SourceAlpha" in2="lower" operator="out" result="insideTop" />
    <feComposite in="SourceAlpha" in2="upper" operator="out" result="insideBottom" />
    <feComposite in="lower" in2="SourceAlpha" operator="out" result="outsideBottom" />

    {engraved ? <>
      {/* The floor of the cut receives less light, retaining the original foil. */}
      <feComponentTransfer in="SourceGraphic" result="face">
        <feFuncR type="linear" slope=".76" /><feFuncG type="linear" slope=".76" /><feFuncB type="linear" slope=".76" />
      </feComponentTransfer>
      <feFlood floodColor="#101923" floodOpacity=".9" result="shadowInk" />
      <feComposite in="shadowInk" in2="insideTop" operator="in" result="innerShadow" />
      <feFlood floodColor="#fff9e9" floodOpacity=".65" result="lightInk" />
      <feComposite in="lightInk" in2="insideBottom" operator="in" result="innerLight" />
      <feComposite in="lightInk" in2="outsideBottom" operator="in" result="cutLip" />
      <feMerge>
        <feMergeNode in="cutLip" /><feMergeNode in="face" />
        <feMergeNode in="innerShadow" /><feMergeNode in="innerLight" />
      </feMerge>
    </> : <>
      {/* Two adjoining offsets form a short wall, with no floating text copies. */}
      <feOffset in="SourceAlpha" dx={depth * .325} dy={depth * .5} result="wallMid" />
      <feMerge result="wallMask"><feMergeNode in="lower" /><feMergeNode in="wallMid" /></feMerge>
      <feFlood floodColor="#303039" floodOpacity=".85" result="wallInk" />
      <feComposite in="wallInk" in2="wallMask" operator="in" result="wall" />
      <feGaussianBlur in="lower" stdDeviation={depth * .4} result="contactMask" />
      <feFlood floodColor="#111923" floodOpacity=".4" result="contactInk" />
      <feComposite in="contactInk" in2="contactMask" operator="in" result="contactShadow" />
      <feFlood floodColor="#fffbea" floodOpacity=".9" result="lightInk" />
      <feComposite in="lightInk" in2="insideTop" operator="in" result="bevelLight" />
      <feFlood floodColor="#151e29" floodOpacity=".55" result="shadeInk" />
      <feComposite in="shadeInk" in2="insideBottom" operator="in" result="bevelShade" />
      <feMerge>
        <feMergeNode in="contactShadow" /><feMergeNode in="wall" /><feMergeNode in="SourceGraphic" />
        <feMergeNode in="bevelShade" /><feMergeNode in="bevelLight" />
      </feMerge>
    </>}
  </filter>;
}

/** Keep definitions mounted (not display:none) for HTML and SVG text consumers. */
export function LetteringFilters({ id }: { id: string }) {
  return <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", pointerEvents: "none" }}>
    <defs>{[{ name: "text", depth: 1.1 }, { name: "display", depth: 2.8 }].map(size => <g key={size.name}>
      <ReliefFilter id={`${id}-raised-${size.name}`} depth={size.depth} engraved={false} />
      <ReliefFilter id={`${id}-recessed-${size.name}`} depth={size.depth} engraved />
    </g>)}</defs>
  </svg>;
}
