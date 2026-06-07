import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface GraphNode {
  id: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight: number;
  state: "default" | "considering" | "selected" | "rejected";
}

interface DynamicGraphBuilderProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodesChange: (nodes: GraphNode[]) => void;
  onEdgesChange: (edges: GraphEdge[]) => void;
  disabled?: boolean;
  maxNodes?: number;
}

const DynamicGraphBuilder = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  disabled = false,
  maxNodes = 20,
}: DynamicGraphBuilderProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [newEdge, setNewEdge] = useState({ from: "", to: "", weight: "" });
  const [editingEdge, setEditingEdge] = useState<{ from: number; to: number } | null>(null);
  const [editWeight, setEditWeight] = useState("");

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addNode = () => {
    if (nodes.length >= maxNodes) {
      setError(`Maximum ${maxNodes} nodes allowed`);
      return;
    }

    const newId = nodes.length > 0 ? Math.max(...nodes.map((n) => n.id)) + 1 : 0;
    
    // Position new node in a circle pattern
    const angle = (2 * Math.PI * nodes.length) / Math.max(nodes.length + 1, 5);
    const radius = 120;
    const centerX = 200;
    const centerY = 180;

    const newNode: GraphNode = {
      id: newId,
      x: centerX + radius * Math.cos(angle - Math.PI / 2),
      y: centerY + radius * Math.sin(angle - Math.PI / 2),
    };

    onNodesChange([...nodes, newNode]);
  };

  const removeNode = (nodeId: number) => {
    onNodesChange(nodes.filter((n) => n.id !== nodeId));
    onEdgesChange(edges.filter((e) => e.from !== nodeId && e.to !== nodeId));
  };

  const handleAddEdge = () => {
    const from = parseInt(newEdge.from);
    const to = parseInt(newEdge.to);
    const weight = parseInt(newEdge.weight);

    // Validation
    if (isNaN(from) || isNaN(to) || isNaN(weight)) {
      setError("Please fill all fields with valid numbers");
      return;
    }

    if (from === to) {
      setError("Self-loops are not allowed");
      return;
    }

    if (weight <= 0) {
      setError("Weight must be a positive integer");
      return;
    }

    if (!nodes.find((n) => n.id === from) || !nodes.find((n) => n.id === to)) {
      setError("Invalid node IDs");
      return;
    }

    // Check for duplicate edge
    const existingEdge = edges.find(
      (e) =>
        (e.from === from && e.to === to) ||
        (e.from === to && e.to === from)
    );

    if (existingEdge) {
      setError("Edge already exists between these nodes");
      return;
    }

    const newEdgeObj: GraphEdge = {
      from: Math.min(from, to),
      to: Math.max(from, to),
      weight,
      state: "default",
    };

    onEdgesChange([...edges, newEdgeObj]);
    setNewEdge({ from: "", to: "", weight: "" });
    setEdgeDialogOpen(false);
  };

  const removeEdge = (from: number, to: number) => {
    onEdgesChange(
      edges.filter(
        (e) => !(e.from === from && e.to === to) && !(e.from === to && e.to === from)
      )
    );
  };

  const updateEdgeWeight = (from: number, to: number) => {
    const weight = parseInt(editWeight);
    if (isNaN(weight) || weight <= 0) {
      setError("Weight must be a positive integer");
      return;
    }

    onEdgesChange(
      edges.map((e) =>
        (e.from === from && e.to === to) || (e.from === to && e.to === from)
          ? { ...e, weight }
          : e
      )
    );
    setEditingEdge(null);
    setEditWeight("");
  };

  const clearGraph = () => {
    onNodesChange([]);
    onEdgesChange([]);
  };

  // Drag handling
  const handleMouseDown = (nodeId: number, e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setDraggingNode(nodeId);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingNode === null || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 400;
      const y = ((e.clientY - rect.top) / rect.height) * 360;

      // Clamp to bounds
      const clampedX = Math.max(30, Math.min(370, x));
      const clampedY = Math.max(30, Math.min(330, y));

      onNodesChange(
        nodes.map((n) =>
          n.id === draggingNode ? { ...n, x: clampedX, y: clampedY } : n
        )
      );
    },
    [draggingNode, nodes, onNodesChange]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    if (draggingNode !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingNode, handleMouseMove, handleMouseUp]);

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

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={addNode}
          disabled={disabled || nodes.length >= maxNodes}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Node ({nodes.length}/{maxNodes})
        </Button>

        <Dialog open={edgeDialogOpen} onOpenChange={setEdgeDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || nodes.length < 2}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Edge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Add Edge</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Node A</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newEdge.from}
                    onChange={(e) =>
                      setNewEdge({ ...newEdge, from: e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Node B</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newEdge.to}
                    onChange={(e) =>
                      setNewEdge({ ...newEdge, to: e.target.value })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Weight</label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={newEdge.weight}
                    onChange={(e) =>
                      setNewEdge({ ...newEdge, weight: e.target.value })
                    }
                    min={1}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Available nodes: {nodes.map((n) => n.id).join(", ") || "None"}
              </p>
              <Button onClick={handleAddEdge}>Add Edge</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="outline"
          onClick={clearGraph}
          disabled={disabled || (nodes.length === 0 && edges.length === 0)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear Graph
        </Button>
      </div>

      {/* Graph Canvas */}
      <div className="relative w-full aspect-square max-w-[400px] mx-auto border border-border rounded-lg bg-card/50">
        <svg
          ref={svgRef}
          viewBox="0 0 400 360"
          className="w-full h-full"
          style={{ overflow: "visible", cursor: draggingNode !== null ? "grabbing" : "default" }}
        >
          {/* SVG filter definitions for glow effects */}
          <defs>
            <filter id="builder-node-glow" x="-50%" y="-50%" width="200%" height="200%">
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
                  r="14"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />
                {editingEdge?.from === edge.from && editingEdge?.to === edge.to ? (
                  <foreignObject x={midX - 20} y={midY - 12} width="40" height="24">
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-full h-full text-xs text-center bg-background border border-primary rounded px-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateEdgeWeight(edge.from, edge.to);
                        } else if (e.key === "Escape") {
                          setEditingEdge(null);
                        }
                      }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono cursor-pointer hover:font-bold"
                    fill="#334155"
                    fontWeight="600"
                    onClick={() => {
                      if (!disabled) {
                        setEditingEdge({ from: edge.from, to: edge.to });
                        setEditWeight(edge.weight.toString());
                      }
                    }}
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g
              key={`node-${node.id}`}
              style={{ cursor: disabled ? "default" : "grab" }}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              className="graph-node-group"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="24"
                className="transition-all duration-300"
                style={{
                  fill: "#1E293B",
                  stroke: "#E2E8F0",
                  strokeWidth: 2,
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
                }}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-sm font-mono font-bold pointer-events-none"
                fill="#FFFFFF"
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Click "Add Node" to start building your graph
          </div>
        )}
      </div>

      {/* Edge List */}
      {edges.length > 0 && !disabled && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            Edges ({edges.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {edges.map((edge, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-card px-2 py-1 rounded text-xs font-mono"
              >
                <span>
                  ({edge.from}, {edge.to}): {edge.weight}
                </span>
                <button
                  onClick={() => {
                    setEditingEdge({ from: edge.from, to: edge.to });
                    setEditWeight(edge.weight.toString());
                  }}
                  className="text-muted-foreground hover:text-primary ml-1"
                  title="Edit weight"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeEdge(edge.from, edge.to)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Delete edge"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Controls */}
      {nodes.length > 0 && !disabled && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            Nodes ({nodes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-1 bg-card px-2 py-1 rounded text-xs font-mono"
              >
                <span>Node {node.id}</span>
                <button
                  onClick={() => removeNode(node.id)}
                  className="text-muted-foreground hover:text-destructive ml-1"
                  title="Delete node"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicGraphBuilder;
