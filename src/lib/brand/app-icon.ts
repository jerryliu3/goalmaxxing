export function buildAppIconSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${fill}"/><path d="M137 263l74 74 164-164" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="52"/></svg>`;
}

export function appIconHref(styleId: string): string {
  return `/brand-icon?style=${styleId}`;
}
