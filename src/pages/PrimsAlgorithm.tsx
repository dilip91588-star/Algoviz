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
  activeNode?: number;
  selectedNodes: number[];
  totalWeight: number;
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
    { question: "What type of algorithm is Prim's Algorithm?", options: ["Dynamic Programming", "Divide and Conquer", "Greedy", "Backtracking"], correctAnswer: 2, explanation: "Prim's Algorithm is a greedy algorithm because it always selects the minimum weight edge at each step." },
    { question: "What does MST stand for?", options: ["Maximum Spanning Tree", "Minimum Spanning Tree", "Multiple Source Tree", "Minimal Search Tree"], correctAnswer: 1, explanation: "MST stands for Minimum Spanning Tree — a tree connecting all vertices with minimum total edge weight." },
    { question: "How many edges does an MST have for a graph with V vertices?", options: ["V", "V - 1", "V + 1", "2V"], correctAnswer: 1, explanation: "An MST with V vertices always has exactly V-1 edges." },
    { question: "Prim's Algorithm works on which type of graph?", options: ["Directed graphs only", "Unweighted graphs", "Weighted undirected connected graphs", "Disconnected graphs"], correctAnswer: 2, explanation: "Prim's requires a weighted, undirected, connected graph." },
    { question: "In Prim's Algorithm, how do we start?", options: ["Select the minimum weight edge", "Select any arbitrary vertex", "Select the vertex with most edges", "Select two vertices with minimum edge"], correctAnswer: 1, explanation: "Prim's starts from any arbitrary vertex and grows the MST from there." },
  ],
  advanced: [
    { question: "What is the time complexity of Prim's Algorithm using a binary heap?", options: ["O(V²)", "O(E log V)", "O(V log E)", "O(E²)"], correctAnswer: 1, explanation: "Using a binary heap, Prim's runs in O(E log V) time." },
    { question: "What data structure is typically used to efficiently implement Prim's Algorithm?", options: ["Stack", "Queue", "Priority Queue / Min-Heap", "Linked List"], correctAnswer: 2, explanation: "A priority queue (min-heap) efficiently finds the minimum weight edge at each step." },
    { question: "What is the space complexity of Prim's Algorithm?", options: ["O(1)", "O(log V)", "O(V)", "O(E)"], correctAnswer: 2, explanation: "Prim's uses O(V) space for MST vertices and key values." },
    { question: "Which property ensures Prim's Algorithm produces optimal results?", options: ["Optimal Substructure", "Greedy Choice Property", "Both A and B", "Neither"], correctAnswer: 2, explanation: "Both optimal substructure and greedy choice property ensure optimality." },
    { question: "If all edges have the same weight, how many possible MSTs exist?", options: ["Exactly 1", "At most V", "Depends on graph structure", "None"], correctAnswer: 2, explanation: "When all edges have equal weights, multiple valid MSTs may exist depending on graph structure." },
  ],
  mastery: [
    { question: "[GATE] What is the time complexity of Prim's Algorithm using an adjacency matrix representation (without a priority queue)?", options: ["O(V²)", "O(E log V)", "O(V log V)", "O(E²)"], correctAnswer: 0, explanation: "Without a priority queue, each iteration does a linear scan of V vertices to find the minimum key, giving O(V²)." },
    { question: "[GATE] Consider a connected weighted undirected graph with all distinct edge weights. How many distinct MSTs does it have?", options: ["0", "Exactly 1", "At most V", "Depends on graph structure"], correctAnswer: 1, explanation: "If all edge weights are distinct, the MST is unique. This is a well-known property proved using the cut property." },
    { question: "[GATE] Can Prim's Algorithm work correctly on a graph with negative edge weights?", options: ["No, never", "Yes, it works correctly", "Only with modification", "Only if all weights are negative"], correctAnswer: 1, explanation: "Prim's works with negative weights since it only compares edge weights relative to each other, unlike shortest path algorithms." },
    { type: "input" as const, question: "[GATE PYQ] Given edges: (A-B,1), (A-C,4), (B-C,2), (B-D,6), (C-D,3). Starting from A, what is the total MST weight using Prim's?", correctAnswer: "6", explanation: "Prim's from A: add A-B(1), then B-C(2), then C-D(3). Total = 1+2+3 = 6.", placeholder: "Enter the total weight" },
    { type: "input" as const, question: "[GATE] A complete graph K₆ has 6 vertices and all edge weights equal to 1. How many edges does its MST contain?", correctAnswer: "5", explanation: "Any MST of a graph with V vertices has exactly V-1 edges. For V=6, MST has 5 edges.", placeholder: "Enter a number" },
  ],
};

const PrimsAlgorithm = () => {
  const algorithmId = useAlgorithmId("Prim's Algorithm");

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

  // Build adjacency list from edges
  const buildAdjacencyList = useCallback(
    (nodesList: GraphNode[], edgesList: GraphEdge[]) => {
      const adj: Map<number, Array<{ to: number; weight: number }>> = new Map();
      nodesList.forEach((n) => adj.set(n.id, []));
      edgesList.forEach((e) => {
        adj.get(e.from)?.push({ to: e.to, weight: e.weight });
        adj.get(e.to)?.push({ to: e.from, weight: e.weight });
      });
      return adj;
    },
    []
  );

  const canRun = nodes.length >= 2 && edges.length >= 1;

  const runPrimsAlgorithm = useCallback(() => {
    if (!canRun) return;

    const adj = buildAdjacencyList(nodes, edges);
    const nodeIds = nodes.map((n) => n.id);
    const n = nodeIds.length;
    const inMST = new Set<number>();
    const mstEdges: Array<{ from: number; to: number; weight: number }> = [];
    const allSteps: Step[] = [];

    const startNode = nodeIds[0];
    inMST.add(startNode);

    allSteps.push({
      description: `Starting Prim's Algorithm from node ${startNode}`,
      edges: edges.map((e) => ({ ...e, state: "default" })),
      activeNode: startNode,
      selectedNodes: [startNode],
      totalWeight: 0,
    });

    let totalWeight = 0;

    while (mstEdges.length < n - 1) {
      let minWeight = Infinity;
      let minEdge: { from: number; to: number; weight: number } | null = null;

      for (const nodeId of inMST) {
        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (!inMST.has(neighbor.to) && neighbor.weight < minWeight) {
            minWeight = neighbor.weight;
            minEdge = { from: nodeId, to: neighbor.to, weight: neighbor.weight };
          }
        }
      }

      if (!minEdge) break;

      const consideringEdges = edges.map((e) => {
        const isSelected = mstEdges.some(
          (me) => (me.from === e.from && me.to === e.to) || (me.from === e.to && me.to === e.from)
        );
        const isConsidering =
          (e.from === minEdge!.from && e.to === minEdge!.to) ||
          (e.from === minEdge!.to && e.to === minEdge!.from);
        return {
          ...e,
          state: isSelected ? "selected" : isConsidering ? "considering" : "default",
        } as GraphEdge;
      });

      allSteps.push({
        description: `Considering edge (${minEdge.from}, ${minEdge.to}) with weight ${minEdge.weight}`,
        edges: consideringEdges,
        activeNode: minEdge.to,
        selectedNodes: Array.from(inMST),
        totalWeight,
      });

      mstEdges.push(minEdge);
      inMST.add(minEdge.to);
      totalWeight += minEdge.weight;

      const selectedEdges = edges.map((e) => {
        const isSelected = mstEdges.some(
          (me) => (me.from === e.from && me.to === e.to) || (me.from === e.to && me.to === e.from)
        );
        return { ...e, state: isSelected ? "selected" : "default" } as GraphEdge;
      });

      allSteps.push({
        description: `Added edge (${minEdge.from}, ${minEdge.to}) to MST. Total weight: ${totalWeight}`,
        edges: selectedEdges,
        selectedNodes: Array.from(inMST),
        totalWeight,
      });
    }

    allSteps.push({
      description: `Prim's Algorithm complete! MST total weight: ${totalWeight}`,
      edges: allSteps[allSteps.length - 1]?.edges || edges,
      selectedNodes: Array.from(inMST),
      totalWeight,
    });

    setSteps(allSteps);
    setCurrentStepIndex(0);
  }, [nodes, edges, canRun, buildAdjacencyList]);

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
      runPrimsAlgorithm();
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

  const getNodeName = (id: number) => String.fromCharCode(65 + id);

  const formattedTraceSteps = steps.map((step) => {
    if (step.description.startsWith("Starting")) {
      const start = step.activeNode !== undefined ? getNodeName(step.activeNode) : "A";
      return `Start from vertex ${start}`;
    }
    if (step.description.startsWith("Considering")) {
      const edge = step.edges.find((e) => e.state === "considering");
      if (edge) {
        return `Select edge ${getNodeName(edge.from)}-${getNodeName(edge.to)} with weight ${edge.weight} as candidate`;
      }
      return step.description;
    }
    if (step.description.startsWith("Added")) {
      const match = step.description.match(/Added edge \((\d+),\s*(\d+)\)/);
      if (match) {
        const to = getNodeName(parseInt(match[2]));
        return `Add vertex ${to} to MST. Current MST cost = ${step.totalWeight}`;
      }
      return step.description;
    }
    if (step.description.startsWith("Prim's Algorithm complete")) {
      return `MST completed. Total MST cost = ${step.totalWeight}`;
    }
    return step.description;
  });

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          <strong className="text-foreground">Prim's Algorithm</strong> is a greedy algorithm that
          finds a minimum spanning tree for a weighted undirected graph. It starts from an arbitrary
          vertex and grows the MST by always adding the minimum weight edge connecting the tree to a
          vertex not yet in the tree.
        </p>
      }
      steps={[
        "Start with an arbitrary vertex as the initial MST",
        "Find the minimum weight edge connecting the MST to a vertex not in the MST",
        "Add that edge and vertex to the MST",
        "Repeat until all vertices are included",
      ]}
      stepsTitle="How It Works"
      timeComplexity="O(E log V)"
      timeComplexityNote="Using binary heap / priority queue"
      spaceComplexity="O(V)"
      spaceComplexityNote="For storing the MST vertices and edges"
      applications={[
        "Network design (telecommunications, electrical grids)",
        "Cluster analysis in data mining",
        "Image segmentation",
        "Approximation algorithms for NP-hard problems",
      ]}
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

          {/* Speed control */}
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
            <p className="text-muted-foreground">{currentStep.description}</p>
          </div>
        )}
      </div>

      {/* Right: Visualization & Execution Trace */}
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Graph Visualization</h3>
          <DynamicGraphVisualizer
            nodes={nodes}
            edges={displayEdges}
            activeNode={currentStep?.activeNode}
            selectedNodes={currentStep?.selectedNodes || []}
          />
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
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
          </div>
        </div>

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
      title="Prim's Algorithm Quiz"
      levels={quizLevels}
      backPath="/greedy-algorithms/prims"
      backLabel="Back to Simulator"
      accentColor="primary"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Prim's Algorithm"
      code={`#include <stdio.h>
#include <limits.h>
#include <stdbool.h>

#define V 5

int minKey(int key[], bool mstSet[]) {
    int min = INT_MAX, min_index;
    for (int v = 0; v < V; v++)
        if (!mstSet[v] && key[v] < min)
            min = key[v], min_index = v;
    return min_index;
}

void printMST(int parent[], int graph[V][V]) {
    printf("Edge \\tWeight\\n");
    for (int i = 1; i < V; i++)
        printf("%d - %d \\t%d\\n", parent[i], i, graph[i][parent[i]]);
}

void primMST(int graph[V][V]) {
    int parent[V];
    int key[V];
    bool mstSet[V];

    for (int i = 0; i < V; i++)
        key[i] = INT_MAX, mstSet[i] = false;

    key[0] = 0;
    parent[0] = -1;

    for (int count = 0; count < V - 1; count++) {
        int u = minKey(key, mstSet);
        mstSet[u] = true;

        for (int v = 0; v < V; v++)
            if (graph[u][v] && !mstSet[v] && graph[u][v] < key[v])
                parent[v] = u, key[v] = graph[u][v];
    }

    printMST(parent, graph);
}

int main() {
    int graph[V][V] = {
        {0, 2, 0, 6, 0},
        {2, 0, 3, 8, 5},
        {0, 3, 0, 0, 7},
        {6, 8, 0, 0, 9},
        {0, 5, 7, 9, 0}
    };
    primMST(graph);
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Prim's Algorithm"
      description="Greedy algorithm to find the Minimum Spanning Tree using adjacency list"
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

export default PrimsAlgorithm;
