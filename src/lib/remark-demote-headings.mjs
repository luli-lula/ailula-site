// Old posts use "#" for section titles; the page already has its own <h1>, so shift every heading down one level.
export default function remarkDemoteHeadings() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'heading') node.depth = Math.min(6, node.depth + 1);
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
