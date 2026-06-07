interface Edge {
  from: number;
  to: number;
  weight: number;
  state: "default" | "considering" | "selected" | "rejected";
}

interface EdgeListProps {
  edges: Edge[];
  currentEdgeIndex?: number;
}

const EdgeList = ({ edges, currentEdgeIndex }: EdgeListProps) => {
  // Sort edges by weight for display
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold mb-3">Sorted Edges (by weight)</div>
      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
        {sortedEdges.map((edge, index) => {
          const isCurrentlyConsidering = edge.state === "considering";
          const isSelected = edge.state === "selected";
          const isRejected = edge.state === "rejected";

          return (
            <div
              key={`${edge.from}-${edge.to}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                isCurrentlyConsidering
                  ? "bg-primary/20 border border-primary"
                  : isSelected
                  ? "bg-success/20 border border-success"
                  : isRejected
                  ? "bg-destructive/20 border border-destructive opacity-60"
                  : "bg-muted/50 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isSelected
                      ? "bg-success text-success-foreground"
                      : isRejected
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {index + 1}
                </span>
                <span>
                  ({edge.from}, {edge.to})
                </span>
              </span>
              <span
                className={`font-bold ${
                  isCurrentlyConsidering
                    ? "text-primary"
                    : isSelected
                    ? "text-success"
                    : isRejected
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                w={edge.weight}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EdgeList;
