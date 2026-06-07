import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import DynamicGraphBuilder, {
  GraphNode,
  GraphEdge,
} from "@/components/graph/DynamicGraphBuilder";
import DynamicGraphVisualizer from "@/components/graph/DynamicGraphVisualizer";
import UnionFindVisualizer from "@/components/graph/UnionFindVisualizer";
import EdgeList from "@/components/graph/EdgeList";
import { Button } from "@/components/ui/button";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  AlertCircle,
} from "lucide-react";

interface Step {
  description: string;
  edges: GraphEdge[];
  parent: number[];
  rank: number[];
  highlightedNodes: number[];
  totalWeight: number;
  phase: "sorting" | "processing" | "complete";
}

// Default graph for demo
const getDefaultNodes = (): GraphNode[] => [
  { id: 0, x: 200, y: 60 },
  { id: 1, x: 320, y: 130 },
  { id: 2, x: 280, y: 270 },
  { id: 3, x: 120, y: 270 },
  { id: 4, x: 80, y: 130 },
];

const getDefaultEdges = (): GraphEdge[] => [
  { from: 0, to: 1, weight: 2, state: "default" },
  { from: 0, to: 3, weight: 6, state: "default" },
  { from: 1, to: 2, weight: 3, state: "default" },
  { from: 1, to: 3, weight: 8, state: "default" },
  { from: 1, to: 4, weight: 5, state: "default" },
  { from: 2, to: 4, weight: 7, state: "default" },
  { from: 3, to: 4, weight: 9, state: "default" },
];

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What is the first step in Kruskal's algorithm?", options: ["Select a starting vertex", "Sort all edges by weight", "Find the MST", "Create a priority queue"], correctAnswer: 1, explanation: "Kruskal's first sorts all edges by weight in ascending order." },
    { question: "What data structure does Kruskal's use to detect cycles?", options: ["Stack", "Priority Queue", "Union-Find (DSU)", "Binary Search Tree"], correctAnswer: 2, explanation: "Union-Find efficiently detects whether adding an edge would create a cycle." },
    { question: "How many edges does an MST have for V vertices?", options: ["V edges", "V - 1 edges", "V + 1 edges", "2V edges"], correctAnswer: 1, explanation: "A spanning tree with V vertices always has V-1 edges." },
    { question: "When does Kruskal's reject an edge?", options: ["Maximum weight", "Would create a cycle", "Connects visited vertex", "Queue is empty"], correctAnswer: 1, explanation: "An edge is rejected if both endpoints are already in the same component." },
    { question: "What does the 'Find' operation in Union-Find do?", options: ["Finds minimum edge", "Finds root of a set", "Finds next edge", "Finds total weight"], correctAnswer: 1, explanation: "Find returns the root representative of the set containing an element." },
  ],
  advanced: [
    { question: "What is the time complexity of Kruskal's algorithm?", options: ["O(V²)", "O(E log V)", "O(E log E)", "O(V log V)"], correctAnswer: 2, explanation: "O(E log E) dominated by sorting edges. Union-Find operations are nearly O(1)." },
    { question: "What optimization is used in Union-Find's Find operation?", options: ["Dynamic programming", "Memoization", "Path compression", "Binary search"], correctAnswer: 2, explanation: "Path compression flattens the tree, achieving nearly O(1) time." },
    { question: "What is 'Union by Rank'?", options: ["Sorting unions by size", "Attaching smaller tree under larger tree's root", "Processing edges by rank", "Ranking vertices by degree"], correctAnswer: 1, explanation: "Union by Rank keeps trees balanced by attaching smaller under larger." },
    { question: "When is Kruskal's more efficient than Prim's?", options: ["Dense graphs", "Sparse graphs", "Complete graphs", "Always"], correctAnswer: 1, explanation: "Kruskal's is better for sparse graphs since its complexity depends on E log E." },
    { question: "What is the main difference between Kruskal's and Prim's?", options: ["Kruskal's uses BFS, Prim's uses DFS", "Kruskal's processes edges globally, Prim's grows from one vertex", "Kruskal's is always faster", "Kruskal's finds maximum spanning tree"], correctAnswer: 1, explanation: "Kruskal's processes edges globally in sorted order; Prim's grows from a starting vertex." },
  ],
  mastery: [
    { question: "[GATE] In Kruskal's algorithm with Union-Find using path compression and union by rank, the amortized time per operation is bounded by:", options: ["O(1)", "O(log N)", "O(α(N)) where α is the inverse Ackermann function", "O(N)"], correctAnswer: 2, explanation: "With both path compression and union by rank, each Union-Find operation takes O(α(N)) amortized time, where α is the near-constant inverse Ackermann function." },
    { question: "[GATE] A graph has 7 vertices and 10 edges. How many edges will Kruskal's algorithm reject (assuming the graph is connected)?", options: ["3", "4", "5", "6"], correctAnswer: 1, explanation: "MST needs V-1 = 6 edges. Out of 10 edges, 10-6 = 4 will be rejected." },
    { question: "[GATE] What happens if you run Kruskal's on a disconnected graph with 3 components?", options: ["It fails", "It produces 3 separate MSTs (a minimum spanning forest)", "It connects all components", "It loops forever"], correctAnswer: 1, explanation: "On a disconnected graph, Kruskal's produces a minimum spanning forest — one MST per connected component." },
    { type: "input" as const, question: "[GATE PYQ] Given edges sorted by weight: (A-B,1), (C-D,2), (A-C,3), (B-C,4), (B-D,5). How many edges does Kruskal's accept for 4 vertices?", correctAnswer: "3", explanation: "For 4 vertices, MST needs V-1 = 3 edges. Accept (A-B,1), (C-D,2), (A-C,3). Edge (B-C,4) would form a cycle.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] Using the edges above, what is the total MST weight?", correctAnswer: "6", explanation: "MST edges: weight 1 + 2 + 3 = 6.", placeholder: "Enter the total weight" },
  ],
};

const KruskalsAlgorithm = () => {
  const algorithmId = useAlgorithmId("Kruskal's Algorithm");

  const handleTabChange = (tab: string) => {
    if (!algorithmId) return;
    if (tab === "theory") updateProgress(algorithmId, "theory_completed", true);
    if (tab === "simulator") updateProgress(algorithmId, "simulation_completed", true);
  };

  const handleQuizComplete = (score: number, total: number) => {
    if (!algorithmId) return;
    updateProgress(algorithmId, "quiz_completed", true);
    updateProgress(algorithmId, "quiz_score", Math.round((score / total) * 100));
  };
  const [nodes, setNodes] = useState<GraphNode[]>(getDefaultNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(getDefaultEdges);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const canRun = nodes.length >= 2 && edges.length >= 1;

  const runKruskalsAlgorithm = useCallback(() => {
    if (!canRun) return;

    const nodeIds = nodes.map((n) => n.id);
    const n = nodeIds.length;
    const allSteps: Step[] = [];

    const idToIndex = new Map<number, number>();
    nodeIds.forEach((id, index) => idToIndex.set(id, index));

    let parent = Array.from({ length: n }, (_, i) => i);
    let rank = new Array(n).fill(0);

    const find = (x: number, p: number[]): number => {
      if (p[x] !== x) {
        return find(p[x], p);
      }
      return x;
    };

    const union = (x: number, y: number, p: number[], r: number[]): boolean => {
      const rootX = find(x, p);
      const rootY = find(y, p);
      if (rootX === rootY) return false;

      if (r[rootX] < r[rootY]) {
        p[rootX] = rootY;
      } else if (r[rootX] > r[rootY]) {
        p[rootY] = rootX;
      } else {
        p[rootY] = rootX;
        r[rootX]++;
      }
      return true;
    };

    allSteps.push({
      description: "Starting Kruskal's Algorithm. First, we initialize Union-Find with each node in its own set.",
      edges: edges.map((e) => ({ ...e, state: "default" })),
      parent: [...parent],
      rank: [...rank],
      highlightedNodes: [],
      totalWeight: 0,
      phase: "sorting",
    });

    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

    allSteps.push({
      description: `Edges sorted by weight: ${sortedEdges.map((e) => `(${e.from},${e.to}):${e.weight}`).join(", ")}`,
      edges: sortedEdges.map((e) => ({ ...e, state: "default" })),
      parent: [...parent],
      rank: [...rank],
      highlightedNodes: [],
      totalWeight: 0,
      phase: "sorting",
    });

    let mstEdges: GraphEdge[] = [];
    let totalWeight = 0;

    for (const edge of sortedEdges) {
      const fromIndex = idToIndex.get(edge.from)!;
      const toIndex = idToIndex.get(edge.to)!;
      const rootFrom = find(fromIndex, parent);
      const rootTo = find(toIndex, parent);

      const consideringEdges = sortedEdges.map((e) => {
        if (e.from === edge.from && e.to === edge.to) {
          return { ...e, state: "considering" as const };
        }
        if (mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
          return { ...e, state: "selected" as const };
        }
        if (sortedEdges.indexOf(e) < sortedEdges.indexOf(edge) && !mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
          return { ...e, state: "rejected" as const };
        }
        return { ...e, state: "default" as const };
      });

      allSteps.push({
        description: `Considering edge (${edge.from}, ${edge.to}) with weight ${edge.weight}. Node ${edge.from} is in set ${rootFrom}, node ${edge.to} is in set ${rootTo}.`,
        edges: consideringEdges,
        parent: [...parent],
        rank: [...rank],
        highlightedNodes: [edge.from, edge.to],
        totalWeight,
        phase: "processing",
      });

      if (rootFrom !== rootTo) {
        const newParent = [...parent];
        const newRank = [...rank];
        union(fromIndex, toIndex, newParent, newRank);
        parent = newParent;
        rank = newRank;

        mstEdges.push({ ...edge, state: "selected" });
        totalWeight += edge.weight;

        const selectedEdges = sortedEdges.map((e) => {
          if (mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
            return { ...e, state: "selected" as const };
          }
          if (sortedEdges.indexOf(e) <= sortedEdges.indexOf(edge) && !mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
            return { ...e, state: "rejected" as const };
          }
          return { ...e, state: "default" as const };
        });

        allSteps.push({
          description: `Added edge (${edge.from}, ${edge.to}) to MST. Sets merged! Total weight: ${totalWeight}`,
          edges: selectedEdges,
          parent: [...parent],
          rank: [...rank],
          highlightedNodes: [edge.from, edge.to],
          totalWeight,
          phase: "processing",
        });
      } else {
        const rejectedEdges = sortedEdges.map((e) => {
          if (e.from === edge.from && e.to === edge.to) {
            return { ...e, state: "rejected" as const };
          }
          if (mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
            return { ...e, state: "selected" as const };
          }
          if (sortedEdges.indexOf(e) < sortedEdges.indexOf(edge) && !mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
            return { ...e, state: "rejected" as const };
          }
          return { ...e, state: "default" as const };
        });

        allSteps.push({
          description: `Rejected edge (${edge.from}, ${edge.to}) - would create a cycle (both nodes in same set ${rootFrom})`,
          edges: rejectedEdges,
          parent: [...parent],
          rank: [...rank],
          highlightedNodes: [edge.from, edge.to],
          totalWeight,
          phase: "processing",
        });
      }

      if (mstEdges.length === n - 1) break;
    }

    allSteps.push({
      description: `Kruskal's Algorithm complete! MST total weight: ${totalWeight}. All nodes connected with minimum total edge weight.`,
      edges: sortedEdges.map((e) => {
        if (mstEdges.some((me) => me.from === e.from && me.to === e.to)) {
          return { ...e, state: "selected" as const };
        }
        return { ...e, state: "rejected" as const };
      }),
      parent: [...parent],
      rank: [...rank],
      highlightedNodes: [],
      totalWeight,
      phase: "complete",
    });

    setSteps(allSteps);
    setCurrentStepIndex(0);
  }, [nodes, edges, canRun]);

  const reset = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSteps([]);
    setCurrentStepIndex(-1);
  };

  const resetToDefault = () => {
    reset();
    setNodes(getDefaultNodes());
    setEdges(getDefaultEdges());
  };

  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (steps.length === 0) {
      runKruskalsAlgorithm();
      setIsPlaying(true);
    } else if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, steps.length]);

  const currentStep = steps[currentStepIndex];
  const displayEdges = currentStep?.edges || edges;
  const nodeCount = nodes.length;
  const initialParent = Array.from({ length: nodeCount }, (_, i) => i);
  const initialRank = new Array(nodeCount).fill(0);

  const getNodeName = (id: number) => String.fromCharCode(65 + id);

  const formattedTraceSteps = steps.map((step) => {
    if (step.description.startsWith("Starting")) {
      return "Initialize Union-Find sets";
    }
    if (step.description.startsWith("Edges sorted")) {
      return "Sort all edges by weight in ascending order";
    }
    if (step.description.startsWith("Considering")) {
      const match = step.description.match(/Considering edge \((\d+),\s*(\d+)\)\s*with weight\s*(\d+)/);
      if (match) {
        const from = getNodeName(parseInt(match[1]));
        const to = getNodeName(parseInt(match[2]));
        const weight = match[3];
        return `Consider edge ${from}-${to} (weight ${weight}). Check if they are in different sets`;
      }
      return step.description;
    }
    if (step.description.startsWith("Added")) {
      const match = step.description.match(/Added edge \((\d+),\s*(\d+)\)/);
      if (match) {
        const from = getNodeName(parseInt(match[1]));
        const to = getNodeName(parseInt(match[2]));
        return `No cycle detected. Add edge ${from}-${to} to MST. Current MST cost = ${step.totalWeight}`;
      }
      return step.description;
    }
    if (step.description.startsWith("Rejected")) {
      const match = step.description.match(/Rejected edge \((\d+),\s*(\d+)\)/);
      if (match) {
        const from = getNodeName(parseInt(match[1]));
        const to = getNodeName(parseInt(match[2]));
        return `Cycle detected. Reject edge ${from}-${to}`;
      }
      return step.description;
    }
    if (step.description.startsWith("Kruskal's Algorithm complete")) {
      return `MST completed. Total MST cost = ${step.totalWeight}`;
    }
    return step.description;
  });

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          <strong className="text-foreground">Kruskal's Algorithm</strong> is a greedy algorithm
          that finds a minimum spanning tree by processing edges in order of increasing weight.
          It uses the Union-Find data structure to efficiently detect cycles.
        </p>
      }
      steps={[
        "Sort all edges by weight in ascending order",
        "Initialize each vertex as its own set (Union-Find)",
        "For each edge (in sorted order): If it connects two different sets, add it to MST and merge sets",
        "If the edge connects vertices in the same set, reject it (would create cycle)",
        "Repeat until MST has V-1 edges",
      ]}
      stepsTitle="How It Works"
      timeComplexity="O(E log E)"
      timeComplexityNote="Dominated by sorting edges. Union-Find operations are nearly O(1) with path compression."
      spaceComplexity="O(V + E)"
      spaceComplexityNote="For storing edges list and Union-Find parent/rank arrays."
      applications={[
        "Network design (telecommunications, electrical grids)",
        "Cluster analysis in machine learning",
        "Image segmentation",
        "Approximation algorithms for NP-hard problems",
      ]}
      additionalSections={
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Union-Find Data Structure</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              The <strong className="text-foreground">Union-Find</strong> (Disjoint Set Union) data structure
              efficiently tracks which vertices belong to which connected component.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Find Operation</h4>
                <p className="text-sm">
                  Determines which set a vertex belongs to by finding its root representative.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Union Operation</h4>
                <p className="text-sm">
                  Merges two sets together using union by rank for optimal performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );

  const simulatorContent = (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Input & Controls */}
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Build Your Graph</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetToDefault}
              disabled={isPlaying || currentStepIndex >= 0}
            >
              Load Example
            </Button>
          </div>
          <DynamicGraphBuilder
            nodes={nodes}
            edges={edges}
            onNodesChange={(newNodes) => {
              setNodes(newNodes);
              reset();
            }}
            onEdgesChange={(newEdges) => {
              setEdges(newEdges);
              reset();
            }}
            disabled={isPlaying || currentStepIndex >= 0}
            maxNodes={20}
          />
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Controls</h3>

          {!canRun && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Add at least 2 nodes and 1 edge to run the algorithm
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant={isPlaying ? "secondary" : "glow"}
              onClick={togglePlay}
              disabled={!canRun}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {steps.length === 0 ? "Run" : "Play"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={stepForward}
              disabled={!canRun || isPlaying || (steps.length > 0 && currentStepIndex >= steps.length - 1)}
            >
              <StepForward className="h-4 w-4 mr-2" />
              Step
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground">
              Animation Speed: {speed <= 500 ? "Fast" : speed <= 1200 ? "Normal" : "Slow"}
            </label>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={2200 - speed}
              onChange={(e) => setSpeed(2200 - parseInt(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        {/* Edge List */}
        <div className="bg-card border border-border rounded-xl p-6">
          <EdgeList edges={displayEdges} currentEdgeIndex={currentStepIndex} />
        </div>
      </div>

      {/* Right: Visualization */}
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Graph Visualization</h3>
          <DynamicGraphVisualizer
            nodes={nodes}
            edges={displayEdges}
            selectedNodes={currentStep?.highlightedNodes || []}
          />
          <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-muted-foreground"></div>
              <span className="text-muted-foreground">Default</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary"></div>
              <span className="text-muted-foreground">Considering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-success"></div>
              <span className="text-muted-foreground">Selected (MST)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-destructive"></div>
              <span className="text-muted-foreground">Rejected</span>
            </div>
          </div>
        </div>

        {/* Union-Find Visualization */}
        {nodeCount > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Union-Find Sets</h3>
            <UnionFindVisualizer
              parent={currentStep?.parent || initialParent}
              rank={currentStep?.rank || initialRank}
              highlightedNodes={currentStep?.highlightedNodes || []}
            />
          </div>
        )}

        {/* Step Info */}
        {currentStep && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Step {currentStepIndex + 1} of {steps.length}
              </h3>
              <span className="text-sm font-mono text-primary">
                Weight: {currentStep.totalWeight}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{currentStep.description}</p>
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  currentStep.phase === "sorting"
                    ? "bg-primary/20 text-primary"
                    : currentStep.phase === "complete"
                    ? "bg-success/20 text-success"
                    : "bg-accent/20 text-accent"
                }`}
              >
                {currentStep.phase === "sorting" && "Initialization"}
                {currentStep.phase === "processing" && "Processing Edges"}
                {currentStep.phase === "complete" && "Complete"}
              </span>
            </div>
          </div>
        )}

        <ExecutionTracePanel
          steps={formattedTraceSteps}
          currentStepIndex={currentStepIndex}
          categoryColor="primary"
        />
      </div>
    </div>
  );

  const quizContent = (
    <QuizContainer
      title="Kruskal's Algorithm Quiz"
      levels={quizLevels}
      backPath="/greedy-algorithms/kruskals"
      backLabel="Back to Simulator"
      accentColor="primary"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Kruskal's Algorithm"
      code={`#include <stdio.h>
#include <stdlib.h>

struct Edge {
    int src, dest, weight;
};

struct Graph {
    int V, E;
    struct Edge* edge;
};

int parent[100], rank_arr[100];

int find(int i) {
    if (parent[i] != i)
        parent[i] = find(parent[i]);
    return parent[i];
}

void unionSets(int x, int y) {
    int xroot = find(x);
    int yroot = find(y);
    if (rank_arr[xroot] < rank_arr[yroot])
        parent[xroot] = yroot;
    else if (rank_arr[xroot] > rank_arr[yroot])
        parent[yroot] = xroot;
    else {
        parent[yroot] = xroot;
        rank_arr[xroot]++;
    }
}

int compare(const void* a, const void* b) {
    return ((struct Edge*)a)->weight - ((struct Edge*)b)->weight;
}

void kruskalMST(struct Graph* graph) {
    int V = graph->V;
    struct Edge result[V];
    int e = 0, i = 0;

    qsort(graph->edge, graph->E, sizeof(graph->edge[0]), compare);

    for (int v = 0; v < V; v++) {
        parent[v] = v;
        rank_arr[v] = 0;
    }

    while (e < V - 1 && i < graph->E) {
        struct Edge next = graph->edge[i++];
        int x = find(next.src);
        int y = find(next.dest);

        if (x != y) {
            result[e++] = next;
            unionSets(x, y);
        }
    }

    printf("Edges in MST:\\n");
    int totalWeight = 0;
    for (i = 0; i < e; i++) {
        printf("%d -- %d == %d\\n", result[i].src, result[i].dest, result[i].weight);
        totalWeight += result[i].weight;
    }
    printf("Total MST Weight: %d\\n", totalWeight);
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Kruskal's Algorithm"
      description="Edge-based greedy algorithm using Union-Find for MST construction"
      categoryName="Greedy Algorithms"
      categoryPath="/greedy-algorithms"
      categoryColor="primary"
      theoryContent={theoryContent}
      algorithmContent={algorithmContent}
      simulatorContent={simulatorContent}
      quizContent={quizContent}
      onTabChange={handleTabChange}
    />
  );
};

export default KruskalsAlgorithm;
