import { useState, useEffect, useCallback, useRef } from "react";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, SkipForward, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";

/* ── Types ─────────────────────────────────────────── */

type NodeStatus = "unexplored" | "exploring" | "found" | "pruned" | "backtrack";

interface TreeNode {
  id: number;
  level: number;       // 0-based, which element index we're deciding on
  subset: number[];
  sum: number;
  parentId: number | null;
  branch: "include" | "exclude" | "root";
  status: NodeStatus;
  label: string;
}

interface SimStep {
  nodes: TreeNode[];
  activeNodeId: number;
  message: string;
  solutionsFound: number;
  currentSubset: number[];
  currentSum: number;
}

/* ── Quiz ──────────────────────────────────────────── */

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What is the Sum of Subsets problem?", options: ["Find maximum subset", "Find a subset whose sum equals a target value", "Sort a set of numbers", "Find all permutations"], correctAnswer: 1, explanation: "The problem asks whether there is a subset of a given set whose elements sum to a target value." },
    { question: "What algorithmic technique is used to solve Sum of Subsets?", options: ["Greedy", "Dynamic Programming only", "Backtracking", "Divide and Conquer"], correctAnswer: 2, explanation: "Backtracking explores subsets by including/excluding elements and prunes branches that cannot lead to a solution." },
    { question: "What does pruning mean in this context?", options: ["Adding more elements", "Stopping exploration when current sum exceeds target", "Sorting the elements", "Removing elements from the set"], correctAnswer: 1, explanation: "Pruning stops exploring a branch when the current sum already exceeds the target, saving time." },
    { question: "In the state space tree, what does each level represent?", options: ["A possible solution", "A decision to include or exclude a specific element", "The total sum", "A sorted element"], correctAnswer: 1, explanation: "Each level corresponds to a decision about one element: include it or exclude it." },
    { question: "How many children does each node in the state space tree have?", options: ["1", "2", "3", "N"], correctAnswer: 1, explanation: "Each node has two children: one for including the element and one for excluding it." },
  ],
  advanced: [
    { question: "What is the worst-case time complexity of the backtracking approach?", options: ["O(N)", "O(N²)", "O(2^N)", "O(N!)"], correctAnswer: 2, explanation: "In the worst case, all 2^N subsets may need to be examined." },
    { question: "What is the space complexity?", options: ["O(1)", "O(N)", "O(2^N)", "O(N²)"], correctAnswer: 1, explanation: "O(N) for the recursion stack and subset storage (depth of tree)." },
    { question: "When should a branch be pruned?", options: ["When the current sum is less than target", "When the current sum exceeds the target", "When all elements are included", "Never"], correctAnswer: 1, explanation: "If the current sum already exceeds the target, no further inclusion can fix it (assuming positive numbers)." },
    { question: "For set {3, 5, 6, 7} and target 15, is {3, 5, 7} a valid solution?", options: ["Yes, sum = 15", "No, sum = 14", "No, sum = 16", "Cannot determine"], correctAnswer: 0, explanation: "3 + 5 + 7 = 15, which equals the target." },
    { question: "How does sorting the set improve backtracking?", options: ["It doesn't help", "Larger elements are tried first", "Pruning happens earlier with sorted (ascending) sets", "It reduces space complexity"], correctAnswer: 2, explanation: "With ascending sort, if adding the next smallest remaining element exceeds the target, all further branches can be pruned." },
  ],
  mastery: [
    { question: "[GATE] The Sum of Subsets problem using backtracking builds a state-space tree. For a set of n elements, the maximum number of leaf nodes is:", options: ["n", "n²", "2^n", "n!"], correctAnswer: 2, explanation: "Each element has two choices (include/exclude), giving 2^n leaf nodes in the worst case." },
    { question: "[GATE] What is the key difference between Sum of Subsets and 0/1 Knapsack?", options: ["They are identical problems", "Sum of Subsets finds exact target sum; Knapsack maximizes value under weight constraint", "Knapsack uses backtracking only", "Sum of Subsets maximizes profit"], correctAnswer: 1, explanation: "Sum of Subsets seeks an exact target sum, while 0/1 Knapsack maximizes value under a weight constraint." },
    { question: "[GATE] In the backtracking approach for Sum of Subsets, if elements are sorted in ascending order, which additional pruning condition can be applied?", options: ["If current sum + remaining sum < target, prune", "If current element is even, skip", "If element index > n/2, prune", "No additional pruning possible"], correctAnswer: 0, explanation: "If current sum + sum of all remaining elements is less than target, no solution is possible in that branch — prune it." },
    { type: "input" as const, question: "[GATE PYQ] For set {1, 2, 3, 4, 5} and target 10, how many valid subsets exist?", correctAnswer: "3", explanation: "Valid subsets: {1,4,5}=10, {2,3,5}=10, {1,2,3,4}=10. That's 3 subsets.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] For set {3, 5, 6, 7} and target 15, how many nodes will be pruned (sum exceeds target) in the state-space tree?", correctAnswer: "3", explanation: "Branches where partial sum exceeds 15 get pruned: {3,5,6,7}=21, {3,5,7}... leading to 3 pruned nodes.", placeholder: "Enter a number" },
  ],
};

/* ── Helpers ───────────────────────────────────────── */

function getPathToRoot(nodes: TreeNode[], nodeId: number): Set<number> {
  const ids = new Set<number>();
  let cur: TreeNode | undefined = nodes.find(n => n.id === nodeId);
  while (cur) {
    ids.add(cur.id);
    cur = cur.parentId !== null ? nodes.find(n => n.id === cur!.parentId) : undefined;
  }
  return ids;
}

function generateSteps(numbers: number[], target: number): SimStep[] {
  const steps: SimStep[] = [];
  const allNodes: TreeNode[] = [];
  let nodeIdCounter = 0;
  let solutionsFound = 0;

  const rootNode: TreeNode = {
    id: nodeIdCounter++, level: -1, subset: [], sum: 0,
    parentId: null, branch: "root", status: "exploring",
    label: "{∅}\nsum=0",
  };
  allNodes.push(rootNode);

  steps.push({
    nodes: cloneNodes(allNodes), activeNodeId: rootNode.id,
    message: "Starting Sum of Subsets algorithm",
    solutionsFound, currentSubset: [], currentSum: 0,
  });

  function fmtSubset(s: number[]): string {
    return s.length === 0 ? "{∅}" : `{${s.join(",")}}`;
  }

  function solve(level: number, currentSubset: number[], currentSum: number, parentId: number) {
    if (currentSum === target) {
      solutionsFound++;
      const parentIdx = allNodes.findIndex(n => n.id === parentId);
      if (parentIdx >= 0) allNodes[parentIdx].status = "found";
      steps.push({
        nodes: cloneNodes(allNodes), activeNodeId: parentId,
        message: `✅ Solution found! Subset ${fmtSubset(currentSubset)} = ${target}`,
        solutionsFound, currentSubset: [...currentSubset], currentSum,
      });
      return;
    }

    if (level >= numbers.length) return;
    if (currentSum > target) return;

    const elem = numbers[level];

    // Include branch
    const inclSubset = [...currentSubset, elem];
    const inclSum = currentSum + elem;
    const inclNode: TreeNode = {
      id: nodeIdCounter++, level, subset: inclSubset,
      sum: inclSum, parentId, branch: "include",
      status: "exploring",
      label: `${fmtSubset(inclSubset)}\nsum=${inclSum}`,
    };
    allNodes.push(inclNode);

    steps.push({
      nodes: cloneNodes(allNodes), activeNodeId: inclNode.id,
      message: `Include ${elem} (level ${level}) → ${fmtSubset(inclSubset)}, sum=${inclSum}`,
      solutionsFound, currentSubset: inclSubset, currentSum: inclSum,
    });

    if (inclSum > target) {
      inclNode.status = "pruned";
      steps.push({
        nodes: cloneNodes(allNodes), activeNodeId: inclNode.id,
        message: `✂️ Pruned! Sum ${inclSum} exceeds target ${target}`,
        solutionsFound, currentSubset: inclSubset, currentSum: inclSum,
      });
    } else {
      solve(level + 1, inclSubset, inclSum, inclNode.id);
      if (inclNode.status === "exploring") {
        inclNode.status = "backtrack";
        steps.push({
          nodes: cloneNodes(allNodes), activeNodeId: inclNode.id,
          message: `↩️ Backtracking from include ${elem}`,
          solutionsFound, currentSubset: [...currentSubset], currentSum,
        });
      }
    }

    // Exclude branch
    const exclNode: TreeNode = {
      id: nodeIdCounter++, level, subset: [...currentSubset],
      sum: currentSum, parentId, branch: "exclude",
      status: "exploring",
      label: `${fmtSubset(currentSubset)}\nsum=${currentSum}`,
    };
    allNodes.push(exclNode);

    steps.push({
      nodes: cloneNodes(allNodes), activeNodeId: exclNode.id,
      message: `Skip ${elem} (level ${level}) → ${fmtSubset(currentSubset)}, sum=${currentSum}`,
      solutionsFound, currentSubset: [...currentSubset], currentSum,
    });

    solve(level + 1, [...currentSubset], currentSum, exclNode.id);

    if (exclNode.status === "exploring") {
      exclNode.status = "backtrack";
      steps.push({
        nodes: cloneNodes(allNodes), activeNodeId: exclNode.id,
        message: `↩️ Backtracking from skip ${elem}`,
        solutionsFound, currentSubset: [...currentSubset], currentSum,
      });
    }
  }

  solve(0, [], 0, rootNode.id);

  rootNode.status = solutionsFound > 0 ? "found" : "backtrack";
  steps.push({
    nodes: cloneNodes(allNodes), activeNodeId: rootNode.id,
    message: `Algorithm complete! Found ${solutionsFound} solution${solutionsFound !== 1 ? "s" : ""}.`,
    solutionsFound, currentSubset: [], currentSum: 0,
  });

  return steps;
}

function cloneNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(n => ({ ...n, subset: [...n.subset] }));
}

/* ── Component ─────────────────────────────────────── */

const SumOfSubsets = () => {
  const algorithmId = useAlgorithmId("Sum of Subsets");

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
  const [inputSet, setInputSet] = useState("3,4,5,6");
  const [targetSum, setTargetSum] = useState("9");
  const [steps, setSteps] = useState<SimStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const currentData = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

  const formattedTraceSteps = steps.map((step) => {
    if (step.message.startsWith("Starting")) {
      return "Start the Sum of Subsets algorithm";
    }
    if (step.message.startsWith("Include")) {
      const match = step.message.match(/Include (\d+)/);
      const val = match ? match[1] : "";
      const subsetStr = step.currentSubset.length === 0 ? "∅" : step.currentSubset.join(", ");
      return `Include ${val}. Current subset: {${subsetStr}}. Current Sum = ${step.currentSum}`;
    }
    if (step.message.startsWith("Skip")) {
      const match = step.message.match(/Skip (\d+)/);
      const val = match ? match[1] : "";
      const subsetStr = step.currentSubset.length === 0 ? "∅" : step.currentSubset.join(", ");
      return `Exclude ${val}. Current subset: {${subsetStr}}. Current Sum = ${step.currentSum}`;
    }
    if (step.message.includes("Pruned")) {
      return `Sum ${step.currentSum} exceeds target. Pruning branch.`;
    }
    if (step.message.includes("Backtracking")) {
      const match = step.message.match(/Backtracking from (include|skip) (\d+)/);
      const action = match ? match[1] : "";
      const val = match ? match[2] : "";
      return `Backtrack from ${action} ${val}.`;
    }
    if (step.message.includes("Solution found")) {
      const subsetStr = step.currentSubset.length === 0 ? "∅" : step.currentSubset.join(", ");
      return `Solution found! Subset {${subsetStr}} sums to target.`;
    }
    if (step.message.startsWith("Algorithm complete")) {
      return `Search complete! Found ${step.solutionsFound} solution(s).`;
    }
    return step.message;
  });

  const parsedNumbers = inputSet.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

  const handleGenerate = useCallback(() => {
    const nums = parsedNumbers;
    const t = parseInt(targetSum);
    if (nums.length === 0 || isNaN(t) || t <= 0) return;
    if (nums.length > 8) return;
    const s = generateSteps(nums, t);
    setSteps(s);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [inputSet, targetSum]);

  const handleReset = () => { setIsPlaying(false); setCurrentStep(-1); setSteps([]); };
  const handleStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); };
  const handleStart = () => {
    if (steps.length === 0) { handleGenerate(); setIsPlaying(true); return; }
    if (currentStep >= steps.length - 1) { setCurrentStep(0); }
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => setCurrentStep(p => p + 1), speed);
      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, steps.length, speed]);

  const speedLabel = speed <= 300 ? "Fast" : speed <= 600 ? "Normal" : speed <= 1200 ? "Slow" : "Very Slow";

  /* ── Tree rendering ──────────────────────────────── */

  const renderTree = () => {
    if (!currentData) return <p className="text-muted-foreground text-center py-8">Press Start to begin the simulation</p>;

    const nodes = currentData.nodes;
    const activeId = currentData.activeNodeId;
    const pathIds = getPathToRoot(nodes, activeId);

    // Group nodes by level for layout
    const levels = new Map<number, TreeNode[]>();
    nodes.forEach(n => {
      const lvl = n.level;
      if (!levels.has(lvl)) levels.set(lvl, []);
      levels.get(lvl)!.push(n);
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);

    // Calculate positions
    const nodePositions = new Map<number, { x: number; y: number }>();
    const nodeWidth = 110;
    const nodeHeight = 54;
    const levelGap = 75;

    sortedLevels.forEach((level, li) => {
      const nodesAtLevel = levels.get(level)!;
      const totalWidth = nodesAtLevel.length * nodeWidth + (nodesAtLevel.length - 1) * 24;
      const startX = -totalWidth / 2;
      nodesAtLevel.forEach((node, ni) => {
        nodePositions.set(node.id, {
          x: startX + ni * (nodeWidth + 24) + nodeWidth / 2,
          y: li * (nodeHeight + levelGap) + nodeHeight / 2 + 10,
        });
      });
    });

    // Compute SVG bounds
    const allPositions = Array.from(nodePositions.values());
    if (allPositions.length === 0) return null;
    const minX = Math.min(...allPositions.map(p => p.x)) - nodeWidth;
    const maxX = Math.max(...allPositions.map(p => p.x)) + nodeWidth;
    const maxY = Math.max(...allPositions.map(p => p.y)) + nodeHeight;
    const svgWidth = maxX - minX + 20;
    const svgHeight = maxY + 30;
    const offsetX = -minX + 10;

    const getFill = (n: TreeNode, isActive: boolean) => {
      if (isActive) return "hsl(var(--primary) / 0.25)";
      switch (n.status) {
        case "found": return "hsl(var(--success) / 0.2)";
        case "pruned": return "hsl(var(--destructive) / 0.2)";
        case "backtrack": return "hsl(var(--warning) / 0.2)";
        case "exploring": return "hsl(var(--primary) / 0.1)";
        default: return "hsl(var(--muted))";
      }
    };
    const getStroke = (n: TreeNode, isActive: boolean) => {
      if (isActive) return "hsl(var(--primary))";
      switch (n.status) {
        case "found": return "hsl(var(--success))";
        case "pruned": return "hsl(var(--destructive))";
        case "backtrack": return "hsl(var(--warning))";
        case "exploring": return "hsl(var(--primary) / 0.5)";
        default: return "hsl(var(--border))";
      }
    };
    const getTextFill = (n: TreeNode, isActive: boolean) => {
      if (isActive) return "hsl(var(--primary))";
      switch (n.status) {
        case "found": return "hsl(var(--success))";
        case "pruned": return "hsl(var(--destructive))";
        case "backtrack": return "hsl(var(--warning))";
        default: return "hsl(var(--foreground))";
      }
    };

    return (
      <div ref={treeContainerRef} className="overflow-auto max-h-[450px]">
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          {/* Edges */}
          {nodes.filter(n => n.parentId !== null).map(n => {
            const parentPos = nodePositions.get(n.parentId!);
            const childPos = nodePositions.get(n.id);
            if (!parentPos || !childPos) return null;
            const onPath = pathIds.has(n.id) && pathIds.has(n.parentId!);
            return (
              <line
                key={`edge-${n.id}`}
                x1={parentPos.x + offsetX} y1={parentPos.y + 22}
                x2={childPos.x + offsetX} y2={childPos.y - 22}
                stroke={onPath ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={onPath ? 2.5 : 1.5}
                strokeDasharray={n.status === "pruned" ? "4 3" : undefined}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map(n => {
            const pos = nodePositions.get(n.id);
            if (!pos) return null;
            const isActive = n.id === activeId;
            const rw = 52;
            const rh = 26;
            const elem = n.level >= 0 && n.level < parsedNumbers.length ? parsedNumbers[n.level] : null;
            const subsetStr = n.subset.length === 0 ? "∅" : n.subset.join(",");
            return (
              <g key={`node-${n.id}`}>
                <rect
                  x={pos.x + offsetX - rw} y={pos.y - rh}
                  width={rw * 2} height={rh * 2} rx={8}
                  fill={getFill(n, isActive)}
                  stroke={getStroke(n, isActive)}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* Subset label */}
                <text
                  x={pos.x + offsetX}
                  y={pos.y - 5}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-semibold"
                  fill={getTextFill(n, isActive)}
                >
                  [{subsetStr}]
                </text>
                {/* Sum label */}
                <text
                  x={pos.x + offsetX}
                  y={pos.y + 10}
                  textAnchor="middle"
                  className="text-[9px] font-mono"
                  fill={getTextFill(n, isActive)}
                >
                  sum={n.sum}
                </text>
                {/* Level indicator */}
                {n.level >= 0 && (
                  <text
                    x={pos.x + offsetX + rw - 4}
                    y={pos.y - rh + 10}
                    textAnchor="end"
                    className="text-[7px] font-mono"
                    fill="hsl(var(--muted-foreground))"
                  >
                    i={n.level}
                  </text>
                )}
                {/* Branch label */}
                {n.branch !== "root" && (
                  <text
                    x={pos.x + offsetX}
                    y={pos.y - rh - 6}
                    textAnchor="middle"
                    className="text-[9px] font-medium"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {n.branch === "include" ? `+${elem}` : `skip ${elem}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  /* ── Sections ────────────────────────────────────── */

  const theoryContent = (
    <TheorySection
      introduction={
        <>
          <p>
            The <strong className="text-foreground">Sum of Subsets</strong> problem asks: given a set of positive integers
            and a target sum, find all subsets whose elements add up exactly to the target. It is a classic
            <strong className="text-foreground"> constraint satisfaction problem</strong> solved using backtracking.
          </p>
          <p className="mt-3">
            The algorithm builds a <strong className="text-foreground">State Space Tree</strong> where each level corresponds
            to a decision about one element — include it or exclude it. Branches are pruned when the running sum exceeds
            the target, drastically reducing the search space compared to brute-force enumeration of all 2<sup>n</sup> subsets.
          </p>
        </>
      }
      steps={[
        "Sort the input set (optional optimization for earlier pruning)",
        "Start with an empty subset and sum = 0",
        "For each element, make two recursive decisions: include or exclude",
        "If the current sum equals the target, record the solution",
        "If the current sum exceeds the target, prune this branch (stop exploring)",
        "Backtrack and try the next branch",
        "Continue until all branches have been explored or pruned",
      ]}
      stepsTitle="Backtracking Approach"
      timeComplexity="O(2ᴺ)"
      timeComplexityNote="In the worst case, all 2^N subsets may be explored. Pruning reduces this in practice."
      spaceComplexity="O(N)"
      spaceComplexityNote="Recursion stack depth equals the number of elements"
      applications={[
        "Resource allocation problems",
        "Cryptography and subset-sum based encryption",
        "Budget planning and financial analysis",
        "Bin packing and load balancing",
      ]}
      diagram={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">State Space Tree</h4>
            <p className="text-sm text-muted-foreground">
              Binary tree where left branch = include element, right branch = exclude element.
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Pruning</h4>
            <p className="text-sm text-muted-foreground">
              If current sum exceeds target, the entire subtree is abandoned — no further exploration needed.
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Example</h4>
            <p className="text-sm text-muted-foreground">
              Set = &#123;3, 4, 5, 6&#125;, Target = 9 → Solutions: &#123;3, 6&#125;, &#123;4, 5&#125;
            </p>
          </div>
        </div>
      }
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Sum of Subsets"
      code={`#include <stdio.h>

int set[20], n, target;
int subset[20], subsetSize = 0;
int solutionCount = 0;

void printSubset() {
    printf("{ ");
    for (int i = 0; i < subsetSize; i++)
        printf("%d ", subset[i]);
    printf("}\\n");
}

void sumOfSubsets(int index, int currentSum) {
    if (currentSum == target) {
        solutionCount++;
        printf("Solution %d: ", solutionCount);
        printSubset();
        return;
    }

    if (index >= n || currentSum > target)
        return;  // Prune: exceeded target or no elements left

    // Include set[index]
    subset[subsetSize++] = set[index];
    sumOfSubsets(index + 1, currentSum + set[index]);
    subsetSize--;  // Backtrack

    // Exclude set[index]
    sumOfSubsets(index + 1, currentSum);
}

int main() {
    printf("Enter number of elements: ");
    scanf("%d", &n);

    printf("Enter %d positive integers: ", n);
    for (int i = 0; i < n; i++)
        scanf("%d", &set[i]);

    printf("Enter target sum: ");
    scanf("%d", &target);

    printf("\\nSubsets with sum %d:\\n", target);
    sumOfSubsets(0, 0);

    if (solutionCount == 0)
        printf("No solution found.\\n");
    else
        printf("\\nTotal solutions: %d\\n", solutionCount);

    return 0;
}`}
    />
  );

  const simulatorContent = (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Input</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Set of Numbers (comma separated, max 8)</label>
            <Input value={inputSet} onChange={e => setInputSet(e.target.value)} placeholder="e.g. 3,4,5,6" className="font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Sum</label>
            <Input value={targetSum} onChange={e => setTargetSum(e.target.value)} placeholder="e.g. 9" className="font-mono" type="number" />
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">State Space Tree</h3>
          <div className="flex items-center gap-3 min-w-[200px]">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Speed: {speedLabel}</label>
            <Slider
              value={[2000 - speed]}
              onValueChange={val => setSpeed(2000 - val[0])}
              min={0} max={1800} step={100}
              className="w-28"
            />
          </div>
        </div>

        {renderTree()}

        {/* Info Panel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Current Subset</span>
            <div className="font-mono text-sm mt-1 text-foreground">
              {currentData ? `{${currentData.currentSubset.join(", ") || "∅"}}` : "—"}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Current Sum</span>
            <div className="font-mono text-lg text-primary">{currentData?.currentSum ?? "—"}</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Target Sum</span>
            <div className="font-mono text-lg text-foreground">{targetSum || "—"}</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Solutions Found</span>
            <div className="font-mono text-lg text-success">{currentData?.solutionsFound ?? 0}</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Step</span>
            <div className="font-mono text-lg text-accent">{currentStep >= 0 ? `${currentStep + 1}/${steps.length}` : "—"}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-muted border border-border" /><span className="text-muted-foreground">Unexplored</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-primary/20 border border-primary" /><span className="text-muted-foreground">Exploring</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-success/20 border border-success" /><span className="text-muted-foreground">Solution Found</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-destructive/20 border border-destructive" /><span className="text-muted-foreground">Pruned</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded bg-warning/20 border border-warning" /><span className="text-muted-foreground">Backtracking</span></div>
        </div>

        {/* Status Message */}
        {currentData && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border mt-4",
            currentData.message.includes("✅") ? "bg-success/10 border-success/30" :
            currentData.message.includes("✂️") ? "bg-destructive/10 border-destructive/30" :
            currentData.message.includes("↩️") ? "bg-warning/10 border-warning/30" :
            "bg-primary/10 border-primary/30"
          )}>
            {currentData.message.includes("✅") ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> :
             <Eye className="h-5 w-5 text-primary shrink-0" />}
            <span className="text-sm">{currentData.message}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
          {!isPlaying ? (
            <Button onClick={handleStart} variant="accent">
              <Play className="h-4 w-4 mr-2" />
              {steps.length === 0 ? "Start" : currentStep >= steps.length - 1 ? "Restart" : "Resume"}
            </Button>
          ) : (
            <Button onClick={() => setIsPlaying(false)} variant="secondary">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={handleStep} variant="outline" disabled={isPlaying || currentStep >= steps.length - 1}>
            <SkipForward className="h-4 w-4 mr-2" />
            Step
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <ExecutionTracePanel
        steps={formattedTraceSteps}
        currentStepIndex={currentStep}
        categoryColor="accent"
      />
    </div>
  );

  const quizContent = (
    <QuizContainer
      title="Sum of Subsets Quiz"
      levels={quizLevels}
      backPath="/backtracking/sum-of-subsets"
      backLabel="Back to Simulator"
      accentColor="accent"
      onQuizComplete={handleQuizComplete}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Sum of Subsets"
      description="Find subsets that add up to a target sum using backtracking"
      categoryName="Backtracking"
      categoryPath="/backtracking"
      categoryColor="accent"
      theoryContent={theoryContent}
      algorithmContent={algorithmContent}
      simulatorContent={simulatorContent}
      quizContent={quizContent}
      onTabChange={handleTabChange}
    />
  );
};

export default SumOfSubsets;
