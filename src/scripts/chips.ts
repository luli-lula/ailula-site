// Filter chips: a [data-filter] group of buttons with data-key ("all" or a key). Clicking one shows only
// the [data-keys] items (space-separated keys) inside the nearest [data-filter-scope], and hides any
// [data-group] left empty.
export function wireChips(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-filter]').forEach((group) => {
    const scope = group.closest('[data-filter-scope]') ?? document;
    group.querySelectorAll<HTMLButtonElement>('button[data-key]').forEach((b) =>
      b.addEventListener('click', () => {
        const key = b.dataset.key!;
        group.querySelectorAll('button[data-key]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        scope.querySelectorAll<HTMLElement>('[data-keys]').forEach((el) => (el.hidden = key !== 'all' && !el.dataset.keys!.split(' ').includes(key)));
        scope.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => (g.hidden = !g.querySelector('[data-keys]:not([hidden])')));
      }),
    );
  });
}
