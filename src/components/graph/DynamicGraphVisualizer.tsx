import { GraphNode, GraphEdge } from "./DynamicGraphBuilder";

interface DynamicGraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeNode?: number;
  selectedNodes?: number[];
}

const DynamicGraphVisualizer = ({
  nodes,
  edges,
  activeNode,
  selectedNodes = [],
}: DynamicGraphVisualizerProps) => {
  const getEdgeClass = (state: GraphEdge["state"]) => {
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

  const getNodeStyle = (nodeId: number) => {
    if (activeNode === nodeId) {
      return {
        fill: "#3B82F6",
        stroke: "#93C5FD",
        strokeWidth: 2.5,
        filter: "drop-shadow(0 2px 8px rgba(59,130,246,0.45))",
      };
    }
    if (selectedNodes.includes(nodeId)) {
      return {
        fill: "#10B981",
        stroke: "#6EE7B7",
        strokeWidth: 2.5,
        filter: "drop-shadow(0 2px 8px rgba(16,185,129,0.45))",
      };
    }
    return {
      fill: "#1E293B",
      stroke: "#E2E8F0",
      strokeWidth: 2,
      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
    };
  };

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      <svg
        viewBox="0 0 400 360"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* SVG filter definitions for glow effects */}
        <defs>
          <filter id="node-hover-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, index) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className={`transition-all duration-500 ${getEdgeClass(edge.state)}`}
              />
              {/* Edge weight label */}
              <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-mono"
                fill="#334155"
                fontWeight="600"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const style = getNodeStyle(node.id);
          return (
            <g key={`node-${node.id}`} className="graph-node-group">
              <circle
                cx={node.x}
                cy={node.y}
                r="24"
                className="transition-all duration-300"
                style={style}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-sm font-mono"
                fill="#FFFFFF"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Build your graph to see visualization
        </div>
      )}
    </div>
  );
};

export default DynamicGraphVisualizer;
