import { useMemo } from "react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  state: "default" | "considering" | "selected" | "rejected";
}

interface GraphVisualizerProps {
  nodeCount: number;
  edges: Edge[];
  activeNode?: number;
  selectedNodes?: number[];
}

const GraphVisualizer = ({
  nodeCount,
  edges,
  activeNode,
  selectedNodes = [],
}: GraphVisualizerProps) => {
  // Calculate node positions in a circle
  const nodePositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const centerX = 200;
    const centerY = 180;
    const radius = 120;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return positions;
  }, [nodeCount]);

  const getEdgeClass = (state: Edge["state"]) => {
    switch (state) {
      case "considering":
        return "edge-considering";
      case "selected":
        return "edge-selected";
      case "rejected":
        return "edge-rejected";
      default:
        return "edge-default";
    }
  };

  const getNodeClass = (index: number) => {
    if (activeNode === index) return "node-active";
    if (selectedNodes.includes(index)) return "node-selected";
    return "node-default";
  };

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      <svg
        viewBox="0 0 400 360"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* Edges */}
        {edges.map((edge, index) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`transition-all duration-500 ${getEdgeClass(edge.state)}`}
              />
              {/* Edge weight label */}
              <circle
                cx={midX}
                cy={midY}
                r="12"
                className="fill-background stroke-border stroke-1"
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-mono fill-foreground"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodePositions.map((pos, index) => (
          <g key={`node-${index}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="24"
              className={`transition-all duration-300 ${getNodeClass(index)}`}
              style={{
                fill:
                  activeNode === index
                    ? "hsl(187 85% 53% / 0.2)"
                    : selectedNodes.includes(index)
                    ? "hsl(160 70% 45% / 0.2)"
                    : "hsl(220 20% 15%)",
                stroke:
                  activeNode === index
                    ? "hsl(187 85% 53%)"
                    : selectedNodes.includes(index)
                    ? "hsl(160 70% 45%)"
                    : "hsl(220 15% 25%)",
                strokeWidth: activeNode === index || selectedNodes.includes(index) ? 3 : 2,
              }}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-sm font-mono font-bold fill-foreground"
            >
              {index}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default GraphVisualizer;
