interface UnionFindVisualizerProps {
  parent: number[];
  rank: number[];
  highlightedNodes?: number[];
}

const UnionFindVisualizer = ({
  parent,
  rank,
  highlightedNodes = [],
}: UnionFindVisualizerProps) => {
  // Group nodes by their root
  const getRoot = (node: number): number => {
    if (parent[node] === node) return node;
    return getRoot(parent[node]);
  };

  const forests = new Map<number, number[]>();
  parent.forEach((_, index) => {
    const root = getRoot(index);
    if (!forests.has(root)) {
      forests.set(root, []);
    }
    forests.get(root)!.push(index);
  });

  const forestsArray = Array.from(forests.entries());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {forestsArray.map(([root, nodes]) => (
          <div
            key={root}
            className="bg-card border-2 border-border rounded-lg p-3 min-w-[80px] transition-all duration-300"
            style={{
              borderColor: highlightedNodes.some((n) => nodes.includes(n))
                ? "hsl(var(--primary))"
                : undefined,
            }}
          >
            <div className="text-xs text-muted-foreground text-center mb-2">
              Set {root}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {nodes.map((node) => (
                <div
                  key={node}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${
                    node === root
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : highlightedNodes.includes(node)
                      ? "bg-accent/20 text-accent border-2 border-accent"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {node}
                </div>
              ))}
            </div>
            {nodes.length > 1 && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                Rank: {rank[root]}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary"></div>
          <span>Root node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-muted border border-border"></div>
          <span>Set member</span>
        </div>
      </div>
    </div>
  );
};

export default UnionFindVisualizer;
