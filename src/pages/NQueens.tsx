import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, StepForward, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";

interface Step {
  board: (number | null)[];
  description: string;
  isBacktrack: boolean;
  row: number;
  col: number;
}

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What type of algorithm is used to solve the N-Queens problem?", options: ["Dynamic Programming", "Greedy", "Backtracking", "Divide and Conquer"], correctAnswer: 2, explanation: "N-Queens is solved using backtracking." },
    { question: "What constraint must be satisfied?", options: ["Queens in adjacent cells", "No two queens can attack each other", "Queens must form a diagonal", "All queens in same row"], correctAnswer: 1, explanation: "No two queens can share the same row, column, or diagonal." },
    { question: "How many queens are placed in each row?", options: ["Zero", "Exactly one", "At most N", "Variable"], correctAnswer: 1, explanation: "Exactly one queen per row ensures no row conflicts." },
    { question: "What is the N-Queens problem classified as?", options: ["Optimization problem", "Constraint Satisfaction Problem (CSP)", "Sorting problem", "Search problem"], correctAnswer: 1, explanation: "N-Queens is a classic CSP." },
    { question: "In backtracking, when do we backtrack?", options: ["Reach last row", "No valid position in current row", "All queens placed", "Find a solution"], correctAnswer: 1, explanation: "We backtrack when no valid position exists in the current row." },
  ],
  advanced: [
    { question: "What is the time complexity of N-Queens backtracking?", options: ["O(N²)", "O(N!)", "O(2^N)", "O(N log N)"], correctAnswer: 1, explanation: "O(N!) in worst case: N choices first row, N-1 second, etc." },
    { question: "What is the space complexity?", options: ["O(1)", "O(N)", "O(N²)", "O(N!)"], correctAnswer: 1, explanation: "O(N) for board state plus recursion stack." },
    { question: "What defines a diagonal conflict?", options: ["Same row index", "Same column index", "|row1-row2| = |col1-col2|", "row1+col1 = row2+col2 only"], correctAnswer: 2, explanation: "Two queens share a diagonal if the absolute row difference equals the absolute column difference." },
    { question: "How many solutions exist for 8-Queens?", options: ["1", "12", "92", "724"], correctAnswer: 2, explanation: "The 8-Queens problem has exactly 92 distinct solutions." },
    { question: "For N=4, how many solutions exist?", options: ["0", "1", "2", "4"], correctAnswer: 2, explanation: "The 4-Queens problem has exactly 2 distinct solutions." },
  ],
  mastery: [
    { question: "[GATE] The N-Queens problem is solved using backtracking. What is the upper bound on the number of nodes in the state-space tree for an N×N board?", options: ["N!", "N^N", "2^N", "N × N!"], correctAnswer: 1, explanation: "Each of the N rows can have a queen in any of N columns, giving N^N nodes in the complete state-space tree before pruning." },
    { question: "[GATE] For the 8-Queens problem, approximately how many solutions exist (including reflections and rotations)?", options: ["12", "46", "92", "724"], correctAnswer: 2, explanation: "The 8-Queens problem has exactly 92 distinct solutions. Only 12 are fundamental (unique under symmetry)." },
    { question: "[GATE] In a backtracking solution for N-Queens, if we place queens row by row and check column + diagonal conflicts, what is the time complexity of the safety check for placing a queen in row r?", options: ["O(1)", "O(r)", "O(N)", "O(N²)"], correctAnswer: 1, explanation: "We check against queens in rows 0 to r-1, so the check is O(r), which is O(N) in the worst case." },
    { type: "input" as const, question: "[GATE PYQ] Find the number of distinct solutions to the 5-Queens problem.", correctAnswer: "10", explanation: "The 5-Queens problem has exactly 10 distinct solutions.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] In a 4-Queens solution using backtracking (row-by-row, left-to-right), what is the column of the queen placed in the first row of the first solution found? (0-indexed)", correctAnswer: "1", explanation: "The first solution found by backtracking (trying columns left to right) places queens at columns [1,3,0,2].", placeholder: "Enter column number (0-indexed)" },
  ],
};

const NQueens = () => {
  const algorithmId = useAlgorithmId("N-Queens");

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
  const [boardSize, setBoardSize] = useState(4);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isSafe = (board: (number | null)[], row: number, col: number, n: number): boolean => {
    for (let i = 0; i < row; i++) {
      if (board[i] === col) return false;
    }
    for (let i = 0; i < row; i++) {
      const diff = row - i;
      if (board[i] === col - diff || board[i] === col + diff) return false;
    }
    return true;
  };

  const solveNQueens = useCallback(() => {
    const allSteps: Step[] = [];
    const board: (number | null)[] = new Array(boardSize).fill(null);

    const solve = (row: number): boolean => {
      if (row === boardSize) {
        allSteps.push({
          board: [...board],
          description: "Solution found! All queens placed successfully.",
          isBacktrack: false,
          row: -1,
          col: -1,
        });
        return true;
      }

      for (let col = 0; col < boardSize; col++) {
        allSteps.push({
          board: [...board],
          description: `Trying to place queen at row ${row}, column ${col}`,
          isBacktrack: false,
          row,
          col,
        });

        if (isSafe(board, row, col, boardSize)) {
          board[row] = col;
          allSteps.push({
            board: [...board],
            description: `Placed queen at row ${row}, column ${col}`,
            isBacktrack: false,
            row,
            col,
          });

          if (solve(row + 1)) return true;

          board[row] = null;
          allSteps.push({
            board: [...board],
            description: `Backtracking: Removed queen from row ${row}, column ${col}`,
            isBacktrack: true,
            row,
            col,
          });
        }
      }
      return false;
    };

    allSteps.push({
      board: [...board],
      description: `Starting N-Queens for ${boardSize}×${boardSize} board`,
      isBacktrack: false,
      row: -1,
      col: -1,
    });

    solve(0);
    setSteps(allSteps);
    setCurrentStepIndex(0);
  }, [boardSize]);

  const reset = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSteps([]);
    setCurrentStepIndex(-1);
  };

  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const togglePlay = () => {
    if (steps.length === 0) {
      solveNQueens();
      setIsPlaying(true);
    } else if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length, currentStepIndex]);

  const currentStep = steps[currentStepIndex];

  const formattedTraceSteps = steps.map((step, idx) => {
    if (step.description.startsWith("Starting")) {
      return `Initialize a ${boardSize}×${boardSize} chessboard`;
    }
    if (step.description.startsWith("Trying")) {
      // Check if next step is "Placed" for the same row & col
      const nextStep = steps[idx + 1];
      const isSuccess = nextStep && nextStep.description.startsWith("Placed") && nextStep.row === step.row && nextStep.col === step.col;
      if (isSuccess) {
        return `Try placing Queen at Row ${step.row} Column ${step.col}`;
      } else {
        return `Column ${step.col} unsafe`;
      }
    }
    if (step.description.startsWith("Placed")) {
      return `Place Queen at Row ${step.row} Column ${step.col}. Move to Row ${step.row + 1}`;
    }
    if (step.description.startsWith("Backtracking")) {
      return `No valid position found. Backtracking from Row ${step.row} Column ${step.col}`;
    }
    if (step.description.startsWith("Solution")) {
      return `Solution found! All ${boardSize} queens placed successfully.`;
    }
    return step.description;
  });

  const renderBoard = () => {
    const board = currentStep?.board || new Array(boardSize).fill(null);
    const cells = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isLight = (row + col) % 2 === 0;
        const hasQueen = board[row] === col;
        const isConsidering = currentStep?.row === row && currentStep?.col === col && !hasQueen;

        cells.push(
          <div
            key={`${row}-${col}`}
            className={cn(
              "chessboard-cell transition-all duration-200",
              isLight ? "chessboard-light" : "chessboard-dark",
              isConsidering && "ring-2 ring-accent ring-inset"
            )}
          >
            {hasQueen && (
              <Crown
                className={cn(
                  "h-8 w-8 transition-all duration-300",
                  currentStep?.isBacktrack && currentStep.row === row
                    ? "queen-conflict"
                    : "queen-placed"
                )}
              />
            )}
          </div>
        );
      }
    }

    return (
      <div
        className="grid gap-0 border border-border rounded-lg overflow-hidden mx-auto"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 48px)`,
          width: "fit-content",
        }}
      >
        {cells}
      </div>
    );
  };

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          The <strong className="text-foreground">N-Queens Problem</strong> is a classic puzzle that asks:
          How can you place N chess queens on an N×N chessboard so that no two queens threaten each other?
          Queens can attack horizontally, vertically, and diagonally.
        </p>
      }
      steps={[
        "Start from the first row",
        "Try placing a queen in each column of the current row",
        "Check if the placement is safe (no conflicts with existing queens)",
        "If safe, move to the next row recursively",
        "If no valid position exists in current row, backtrack to previous row",
        "Continue until all queens are placed or all possibilities exhausted",
      ]}
      stepsTitle="Backtracking Approach"
      timeComplexity="O(N!)"
      timeComplexityNote="In worst case, we try N positions in first row, N-1 in second, etc."
      spaceComplexity="O(N)"
      spaceComplexityNote="For storing board state plus recursion stack"
      applications={[
        "Constraint satisfaction problems",
        "Resource allocation and scheduling",
        "VLSI chip design and testing",
        "Parallel memory storage schemes",
      ]}
    />
  );

  const simulatorContent = (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Board Size</h3>
          <div className="flex gap-2">
            {[4, 5, 6, 8].map((size) => (
              <Button
                key={size}
                variant={boardSize === size ? "accent" : "outline"}
                size="sm"
                onClick={() => {
                  reset();
                  setBoardSize(size);
                }}
              >
                {size}×{size}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Controls</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant={isPlaying ? "secondary" : "accent"} onClick={togglePlay}>
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {steps.length === 0 ? "Solve" : "Play"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={stepForward}
              disabled={isPlaying || currentStepIndex >= steps.length - 1}
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
            <label className="text-sm text-muted-foreground">Speed: {speed <= 300 ? "Fast" : speed <= 600 ? "Normal" : "Slow"}</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="100"
              value={1100 - speed}
              onChange={(e) => setSpeed(1100 - parseInt(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        {currentStep && (
          <div
            className={cn(
              "bg-card border rounded-xl p-6 transition-colors",
              currentStep.isBacktrack ? "border-destructive/50" : "border-border"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Step {currentStepIndex + 1} of {steps.length}
              </h3>
              {currentStep.isBacktrack && (
                <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded">
                  Backtrack
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{currentStep.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-6 text-center">
            {boardSize}×{boardSize} Chessboard
          </h3>
          {renderBoard()}
          <div className="mt-6 flex gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Queen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 ring-2 ring-accent rounded-sm" />
              <span className="text-muted-foreground">Considering</span>
            </div>
          </div>
        </div>

        <ExecutionTracePanel
          steps={formattedTraceSteps}
          currentStepIndex={currentStepIndex}
          categoryColor="accent"
        />
      </div>
    </div>
  );

  const quizContent = (
    <QuizContainer
      title="N-Queens Quiz"
      levels={quizLevels}
      backPath="/backtracking/n-queens"
      backLabel="Back to Simulator"
      accentColor="accent"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – N-Queens Problem"
      code={`#include <stdio.h>
#include <stdbool.h>

#define N 8

int board[N][N];

bool isSafe(int row, int col) {
    for (int i = 0; i < col; i++)
        if (board[row][i]) return false;

    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--)
        if (board[i][j]) return false;

    for (int i = row, j = col; i < N && j >= 0; i++, j--)
        if (board[i][j]) return false;

    return true;
}

bool solveNQueens(int col) {
    if (col >= N) return true;

    for (int i = 0; i < N; i++) {
        if (isSafe(i, col)) {
            board[i][col] = 1;
            if (solveNQueens(col + 1)) return true;
            board[i][col] = 0; // Backtrack
        }
    }
    return false;
}

void printBoard() {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++)
            printf("%s ", board[i][j] ? "Q" : ".");
        printf("\\n");
    }
}

int main() {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            board[i][j] = 0;

    if (solveNQueens(0))
        printBoard();
    else
        printf("No solution exists\\n");
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="N-Queens Problem"
      description="Place N queens on a chessboard with backtracking"
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

export default NQueens;
