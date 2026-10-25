// Old Hugo URLs → new routes. Keys and values are decoded paths with a trailing slash.
const sections: Record<string, string> = {
  '/posts/': '/writing/',
  '/archives/': '/writing/',
  '/tags/': '/writing/',
  '/categories/': '/writing/',
  '/series/': '/writing/',
  '/search/': '/writing/',
  '/movies/': '/cinema/',
  '/books/': '/cinema/',
  '/about/': '/',
};

export const EXTRA_REDIRECTS: Record<string, string> = Object.fromEntries(
  Object.entries(sections).flatMap(([from, to]) => [
    [from, to],
    [`/zh${from}`, `/zh${to === '/' ? '/' : to}`],
  ]),
);

export function buildRedirects(
  entries: { legacyPaths: string[]; newPath: string }[],
  extras: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [from, to] of Object.entries(extras)) if (from !== to) out[from] = to;
  for (const { legacyPaths, newPath } of entries) {
    for (const p of legacyPaths) if (p !== newPath) out[p] = newPath;
  }
  return out;
}

// Old tag pages (/tags/<tag>/) all fold into the writing index.
export function tagRedirects(oldUrls: string[]): Record<string, string> {
  return Object.fromEntries(
    oldUrls
      .filter((u) => /^\/(zh\/)?tags\/.+\/$/.test(u))
      .map((u) => [u, u.startsWith('/zh/') ? '/zh/writing/' : '/writing/']),
  );
}
