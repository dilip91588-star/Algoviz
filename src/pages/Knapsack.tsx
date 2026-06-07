import { useState, useEffect, useCallback, useMemo } from "react";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";
import { Link } from "react-router-dom";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  HelpCircle,
  Plus,
  Trash2,
  Package,
} from "lucide-react";

interface Item {
  id: number;
  weight: number;
  value: number;
}

interface CellState {
  value: number;
  isActive: boolean;
  isBacktrack: boolean;
  isFilled: boolean;
  fromAbove: boolean;
}

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What type of problem is the 0/1 Knapsack?", options: ["Greedy optimization", "Dynamic Programming optimization", "Graph traversal", "String matching"], correctAnswer: 1, explanation: "0/1 Knapsack is a classic DP problem." },
    { question: "What does '0/1' mean?", options: ["Binary weight values", "Item taken 0 or 1 times (no fractions)", "Maximum 1 item", "Weight must be 0 or 1"], correctAnswer: 1, explanation: "Each item is either taken (1) or not (0) — no fractions." },
    { question: "What is the base case for the DP table?", options: ["dp[0][w]=0 for all w", "dp[i][0]=0 for all i", "Both A and B", "dp[n][W]=0"], correctAnswer: 2, explanation: "First row (no items) and first column (zero capacity) are all 0." },
    { question: "When can we consider including an item?", options: ["Always", "Value exceeds weight", "Weight ≤ current capacity", "Item is heaviest"], correctAnswer: 2, explanation: "Only if item weight doesn't exceed current capacity." },
    { question: "How does Fractional Knapsack differ?", options: ["Same problem", "Allows taking fractions of items", "No weight limit", "0/1 is faster"], correctAnswer: 1, explanation: "Fractional Knapsack allows fractions, solvable by greedy." },
  ],
  advanced: [
    { question: "What is the time complexity?", options: ["O(n)", "O(n×W)", "O(2^n)", "O(n²)"], correctAnswer: 1, explanation: "O(n×W) where n is items and W is capacity." },
    { question: "Why is 0/1 Knapsack 'pseudo-polynomial'?", options: ["Not actually polynomial", "Complexity depends on value of W, not bit representation", "Uses approximation", "Exponential worst case"], correctAnswer: 1, explanation: "O(n×W) depends on numeric value of W, not bits to represent W." },
    { question: "What is the recurrence relation?", options: ["dp[i][w] = dp[i-1][w]", "dp[i][w] = max(dp[i-1][w], v[i]+dp[i-1][w-wt[i]])", "dp[i][w] = dp[i-1][w]+v[i]", "dp[i][w] = min(dp[i-1][w], dp[i][w-1])"], correctAnswer: 1, explanation: "Max of excluding item vs including it." },
    { question: "What is the space complexity?", options: ["O(1)", "O(n)", "O(W)", "O(n×W)"], correctAnswer: 3, explanation: "Standard solution uses a 2D table of size n×W." },
    { question: "How do we find which items were selected?", options: ["Read last row", "Backtrack from dp[n][W]", "Sum all cells", "Check diagonal"], correctAnswer: 1, explanation: "Backtrack from dp[n][W] checking if including each item led to the optimal." },
  ],
  mastery: [
    { question: "[GATE] The 0/1 Knapsack DP solution has time complexity O(n×W). Why is this called pseudo-polynomial?", options: ["It's actually polynomial", "O(n×W) depends on the numeric value of W, not the number of bits to represent W", "The algorithm uses approximation", "It's exponential in disguise"], correctAnswer: 1, explanation: "W requires log₂(W) bits to represent. Polynomial in input size would be O(n × log W). Since O(n×W) = O(n × 2^(log W)), it's exponential in the input size — hence 'pseudo-polynomial'." },
    { question: "[GATE] In the 1D space-optimized DP for 0/1 Knapsack, why must capacity be traversed right-to-left?", options: ["For correctness of base case", "To prevent using the same item more than once", "For faster computation", "To handle negative weights"], correctAnswer: 1, explanation: "Traversing right-to-left ensures that when computing dp[w], we use the previous row's value of dp[w-wt[i]], not the current row's updated value." },
    { question: "[GATE] If all items have weight greater than the knapsack capacity W, the optimal value is:", options: ["Sum of all values", "Maximum single item value", "0", "Undefined"], correctAnswer: 2, explanation: "If no item can fit in the knapsack, no item is selected and the total value is 0." },
    { type: "input" as const, question: "[GATE PYQ] Items: (wt=1,val=1), (wt=3,val=4), (wt=4,val=5), (wt=5,val=7). Capacity W=7. What is the maximum value?", correctAnswer: "9", explanation: "Take items: (wt=3,val=4) + (wt=4,val=5) = total weight 7, value 9. Or (wt=1,val=1)+(wt=3,val=4)+(wt=3...) — checking: {wt=3,val=4}+{wt=4,val=5}=9 is optimal.", placeholder: "Enter the max value" },
    { type: "input" as const, question: "[GATE] For n=4 items and W=5, how many cells are in the DP table (including base cases)?", correctAnswer: "30", explanation: "Table dimensions: (4+1)×(5+1) = 5×6 = 30 cells.", placeholder: "Enter a number" },
  ],
};

const Knapsack = () => {
  const algorithmId = useAlgorithmId("Knapsack");

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
  const [items, setItems] = useState<Item[]>([
    { id: 1, weight: 2, value: 3 },
    { id: 2, weight: 3, value: 4 },
    { id: 3, weight: 4, value: 5 },
    { id: 4, weight: 5, value: 6 },
  ]);
  const [capacity, setCapacity] = useState(8);
  const [newWeight, setNewWeight] = useState("");
  const [newValue, setNewValue] = useState("");

  const [dpTable, setDpTable] = useState<CellState[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [phase, setPhase] = useState<"idle" | "filling" | "backtracking" | "complete">("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [maxValue, setMaxValue] = useState(0);
  const [explanation, setExplanation] = useState("Configure items and capacity, then start the visualization.");

  const formattedTraceSteps = useMemo(() => {
    const n = items.length;
    const W = capacity;
    const stepsList: string[] = [];

    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      for (let w = 1; w <= W; w++) {
        if (item.weight <= w) {
          const includeValue = item.value + dp[i - 1][w - item.weight];
          const excludeValue = dp[i - 1][w];
          if (includeValue > excludeValue) {
            dp[i][w] = includeValue;
            stepsList.push(
              `Calculate dp[${i}][${w}] for Item ${i} (w=${item.weight}, v=${item.value}). Use formula max(exclude dp[${i - 1}][${w}], include val + dp[${i - 1}][${w - item.weight}]). Store value ${includeValue} (Include)`
            );
          } else {
            dp[i][w] = excludeValue;
            stepsList.push(
              `Calculate dp[${i}][${w}] for Item ${i} (w=${item.weight}, v=${item.value}). Use formula max(exclude dp[${i - 1}][${w}], include val + dp[${i - 1}][${w - item.weight}]). Store value ${excludeValue} (Exclude)`
            );
          }
        } else {
          dp[i][w] = dp[i - 1][w];
          stepsList.push(
            `Calculate dp[${i}][${w}] for Item ${i} (w=${item.weight}, v=${item.value}). Item too heavy for capacity ${w}. Use dp[${i - 1}][${w}]. Store value ${dp[i - 1][w]}`
          );
        }
      }
    }

    stepsList.push(
      `DP table complete! Maximum profit = ${dp[n][W]}. Now backtracking from dp[${n}][${W}] to identify selected items...`
    );

    let iTemp = n;
    let wTemp = W;
    const selected: number[] = [];
    while (iTemp > 0 && wTemp > 0) {
      if (dp[iTemp][wTemp] !== dp[iTemp - 1][wTemp]) {
        selected.push(iTemp);
        wTemp -= items[iTemp - 1].weight;
      }
      iTemp--;
    }
    selected.reverse();

    stepsList.push(
      `Backtracking complete! Selected items: ${selected.length > 0 ? selected.map(id => `Item ${id}`).join(", ") : "None"}. Maximum value: ${dp[n][W]}`
    );

    return stepsList;
  }, [items, capacity]);

  const currentStepIndex = useMemo(() => {
    if (phase === "idle") return -1;
    if (phase === "filling") {
      const idx = (currentRow - 1) * capacity + (currentCol - 1);
      return Math.min(items.length * capacity - 1, idx);
    }
    if (phase === "backtracking") {
      return items.length * capacity;
    }
    if (phase === "complete") {
      return items.length * capacity + 1;
    }
    return -1;
  }, [phase, currentRow, currentCol, capacity, items.length]);

  const initializeTable = useCallback(() => {
    const n = items.length;
    const W = capacity;
    const table: CellState[][] = [];

    for (let i = 0; i <= n; i++) {
      table[i] = [];
      for (let w = 0; w <= W; w++) {
        table[i][w] = {
          value: 0,
          isActive: false,
          isBacktrack: false,
          isFilled: i === 0 || w === 0,
          fromAbove: false,
        };
      }
    }

    setDpTable(table);
    setCurrentRow(1);
    setCurrentCol(1);
    setPhase("idle");
    setSelectedItems([]);
    setMaxValue(0);
    setExplanation("Configure items and capacity, then start the visualization.");
  }, [items, capacity]);

  useEffect(() => {
    initializeTable();
  }, [initializeTable]);

  const addItem = () => {
    const w = parseInt(newWeight);
    const v = parseInt(newValue);
    if (!isNaN(w) && !isNaN(v) && w > 0 && v > 0) {
      setItems([...items, { id: items.length + 1, weight: w, value: v }]);
      setNewWeight("");
      setNewValue("");
    }
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id).map((item, idx) => ({ ...item, id: idx + 1 })));
    }
  };

  const fillNextCell = useCallback(() => {
    if (phase !== "filling") return;

    const n = items.length;
    const W = capacity;

    if (currentRow > n) {
      setPhase("backtracking");
      setMaxValue(dpTable[n][W].value);
      setExplanation(`DP table complete! Maximum value = ${dpTable[n][W].value}. Now backtracking to find selected items...`);
      return;
    }

    setDpTable((prev) => {
      const newTable = prev.map((row) => row.map((cell) => ({ ...cell, isActive: false })));
      const i = currentRow;
      const w = currentCol;
      const item = items[i - 1];

      newTable[i][w].isActive = true;

      if (item.weight <= w) {
        const includeValue = item.value + newTable[i - 1][w - item.weight].value;
        const excludeValue = newTable[i - 1][w].value;

        if (includeValue > excludeValue) {
          newTable[i][w].value = includeValue;
          newTable[i][w].fromAbove = false;
          setExplanation(`Item ${i} (w=${item.weight}, v=${item.value}): Include! ${item.value} + dp[${i - 1}][${w - item.weight}] = ${includeValue} > ${excludeValue}`);
        } else {
          newTable[i][w].value = excludeValue;
          newTable[i][w].fromAbove = true;
          setExplanation(`Item ${i} (w=${item.weight}, v=${item.value}): Exclude. dp[${i - 1}][${w}] = ${excludeValue} >= ${includeValue}`);
        }
      } else {
        newTable[i][w].value = newTable[i - 1][w].value;
        newTable[i][w].fromAbove = true;
        setExplanation(`Item ${i} (w=${item.weight}, v=${item.value}): Too heavy for capacity ${w}. Copy dp[${i - 1}][${w}] = ${newTable[i - 1][w].value}`);
      }

      newTable[i][w].isFilled = true;
      return newTable;
    });

    if (currentCol < W) {
      setCurrentCol(currentCol + 1);
    } else {
      setCurrentRow(currentRow + 1);
      setCurrentCol(1);
    }
  }, [phase, currentRow, currentCol, items, capacity, dpTable]);

  const backtrackStep = useCallback(() => {
    if (phase !== "backtracking") return;

    const n = items.length;
    let i = n;
    let w = capacity;
    const selected: number[] = [];

    setDpTable((prev) => {
      const newTable = prev.map((row) => row.map((cell) => ({ ...cell, isActive: false })));

      while (i > 0 && w > 0) {
        newTable[i][w].isBacktrack = true;
        if (newTable[i][w].value !== newTable[i - 1][w].value) {
          selected.push(i);
          w -= items[i - 1].weight;
        }
        i--;
      }
      return newTable;
    });

    setSelectedItems(selected.reverse());
    setPhase("complete");
    setExplanation(`Backtracking complete! Selected items: ${selected.length > 0 ? selected.join(", ") : "None"}. Total value: ${maxValue}`);
  }, [phase, items, capacity, maxValue]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (phase === "filling") fillNextCell();
      else if (phase === "backtracking") backtrackStep();
      else if (phase === "complete") setIsPlaying(false);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, phase, fillNextCell, backtrackStep, speed]);

  const startVisualization = () => {
    initializeTable();
    setTimeout(() => {
      setPhase("filling");
      setIsPlaying(true);
      setExplanation("Starting DP table construction...");
    }, 100);
  };

  const stepForward = () => {
    if (phase === "idle") {
      setPhase("filling");
      setExplanation("Starting DP table construction...");
    } else if (phase === "filling") fillNextCell();
    else if (phase === "backtracking") backtrackStep();
  };

  const reset = () => {
    setIsPlaying(false);
    initializeTable();
  };

  const getCellClass = (cell: CellState, rowIdx: number, colIdx: number) => {
    const base = "w-10 h-10 flex items-center justify-center text-xs font-mono border border-border transition-all duration-300";
    if (cell.isActive) return `${base} bg-primary/30 border-primary text-primary scale-110`;
    if (cell.isBacktrack) return `${base} bg-success/30 border-success text-success`;
    if (rowIdx === 0 || colIdx === 0) return `${base} bg-muted text-muted-foreground`;
    if (cell.isFilled) return `${base} bg-secondary text-foreground`;
    return `${base} bg-card text-muted-foreground`;
  };

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          The <strong className="text-foreground">0/1 Knapsack Problem</strong> is a classic optimization problem:
          given a set of items with weights and values, determine which items to include in a knapsack
          to maximize total value without exceeding the weight capacity. Each item can only be taken once (0 or 1 times).
        </p>
      }
      steps={[
        "Create a DP table of size (n+1) × (W+1) where n is items count and W is capacity",
        "Initialize first row and column to 0 (base cases)",
        "For each item i and capacity w: decide whether to include or exclude the item",
        "If item weight ≤ w: dp[i][w] = max(exclude, include) where include = value[i] + dp[i-1][w-weight[i]]",
        "If item weight > w: dp[i][w] = dp[i-1][w] (can't include)",
        "The answer is at dp[n][W]; backtrack to find selected items",
      ]}
      stepsTitle="Algorithm Steps"
      timeComplexity="O(n × W)"
      timeComplexityNote="Where n is number of items and W is knapsack capacity"
      spaceComplexity="O(n × W)"
      spaceComplexityNote="For the DP table"
      applications={[
        "Resource allocation and budgeting",
        "Cargo loading optimization",
        "Portfolio optimization in finance",
        "Cutting stock problems in manufacturing",
      ]}
    />
  );

  const simulatorContent = (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Panel - Configuration */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedItems.includes(item.id) ? "bg-success/20 border-success" : "bg-secondary border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">#{item.id}</span>
                  <div className="text-sm">
                    <span className="text-muted-foreground">W:</span> <span className="font-semibold">{item.weight}</span>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">V:</span> <span className="font-semibold text-accent">{item.value}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={phase !== "idle" || items.length <= 1}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {phase === "idle" && (
              <div className="flex gap-2 pt-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Weight</Label>
                  <Input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="W" min="1" className="h-9" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="V" min="1" className="h-9" />
                </div>
                <div className="flex items-end">
                  <Button onClick={addItem} size="icon" className="h-9 w-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Knapsack Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
                min="1"
                max="15"
                disabled={phase !== "idle"}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">Max: 15</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {phase === "idle" ? (
                <Button onClick={startVisualization} variant="accent" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={() => setIsPlaying(!isPlaying)} variant={isPlaying ? "outline" : "accent"} className="flex-1" disabled={phase === "complete"}>
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              )}
              <Button onClick={stepForward} variant="outline" disabled={isPlaying || phase === "complete"}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button onClick={reset} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Speed: {speed <= 400 ? "Fast" : speed <= 900 ? "Normal" : "Slow"}</Label>
              <input type="range" min="100" max="1500" step="100" value={1600 - speed} onChange={(e) => setSpeed(1600 - parseInt(e.target.value))} className="w-full mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center - DP Table */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">DP Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-max">
                <div className="flex gap-1 mb-1">
                  <div className="w-10 h-10 flex items-center justify-center text-xs font-mono text-muted-foreground">i\w</div>
                  {Array.from({ length: capacity + 1 }, (_, w) => (
                    <div key={w} className="w-10 h-10 flex items-center justify-center text-xs font-mono bg-muted rounded text-muted-foreground">{w}</div>
                  ))}
                </div>
                {dpTable.map((row, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    <div className="w-10 h-10 flex items-center justify-center text-xs font-mono bg-muted rounded text-muted-foreground">{i}</div>
                    {row.map((cell, w) => (
                      <div key={w} className={getCellClass(cell, i, w)}>{cell.isFilled ? cell.value : ""}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              Current Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{explanation}</p>
          </CardContent>
        </Card>

        {phase === "complete" && (
          <Card className="border-success/50 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-success">Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Maximum Value:</span>
                <span className="text-2xl font-bold text-success">{maxValue}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Selected Items: </span>
                <span className="font-mono">{selectedItems.length > 0 ? selectedItems.map((id) => `Item ${id}`).join(", ") : "None"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-4">
          <ExecutionTracePanel
            steps={formattedTraceSteps}
            currentStepIndex={currentStepIndex}
            categoryColor="accent"
          />
        </div>
      </div>
    </div>
  );

  const quizContent = (
    <QuizContainer
      title="0/1 Knapsack Quiz"
      levels={quizLevels}
      backPath="/dynamic-programming/knapsack"
      backLabel="Back to Simulator"
      accentColor="accent"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – 0/1 Knapsack Problem"
      code={`#include <stdio.h>

int max(int a, int b) {
    return (a > b) ? a : b;
}

int knapsack(int W, int wt[], int val[], int n) {
    int K[n + 1][W + 1];

    for (int i = 0; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (i == 0 || w == 0)
                K[i][w] = 0;
            else if (wt[i - 1] <= w)
                K[i][w] = max(val[i - 1] + K[i - 1][w - wt[i - 1]], K[i - 1][w]);
            else
                K[i][w] = K[i - 1][w];
        }
    }

    // Backtrack to find selected items
    int res = K[n][W];
    int w = W;
    printf("Selected items: ");
    for (int i = n; i > 0 && res > 0; i--) {
        if (res != K[i - 1][w]) {
            printf("Item %d (w=%d, v=%d) ", i, wt[i - 1], val[i - 1]);
            res -= val[i - 1];
            w -= wt[i - 1];
        }
    }
    printf("\\n");

    return K[n][W];
}

int main() {
    int val[] = {60, 100, 120};
    int wt[] = {10, 20, 30};
    int W = 50;
    int n = 3;
    printf("Maximum value: %d\\n", knapsack(W, wt, val, n));
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="0/1 Knapsack Problem"
      description="Maximize value with weight constraint using DP"
      categoryName="Dynamic Programming"
      categoryPath="/dynamic-programming"
      categoryColor="accent"
      theoryContent={theoryContent}
      algorithmContent={algorithmContent}
      simulatorContent={simulatorContent}
      quizContent={quizContent}
      onTabChange={handleTabChange}
    />
  );
};

export default Knapsack;
