import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, SkipForward, ArrowUpLeft, ArrowUp, ArrowLeftIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";

interface Step {
  i: number;
  j: number;
  value: number;
  phase: "filling" | "backtracking" | "complete";
  message: string;
  direction?: "diagonal" | "up" | "left";
  lcsChar?: string;
}

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What is the difference between a substring and a subsequence?", options: ["Same thing", "Substring must be contiguous, subsequence doesn't", "Subsequence must be contiguous", "Substring is always longer"], correctAnswer: 1, explanation: "A substring is contiguous; a subsequence maintains order but need not be adjacent." },
    { question: "What is the base case in LCS DP?", options: ["dp[0][j]=j, dp[i][0]=i", "dp[0][j]=0, dp[i][0]=0", "dp[0][j]=1, dp[i][0]=1", "dp[m][n]=0"], correctAnswer: 1, explanation: "First row and column are 0 — LCS of any string with empty string is 0." },
    { question: "When X[i]=Y[j], what is dp[i][j]?", options: ["dp[i-1][j-1]", "dp[i-1][j-1]+1", "max(dp[i-1][j], dp[i][j-1])", "dp[i-1][j]+dp[i][j-1]"], correctAnswer: 1, explanation: "When characters match, extend LCS by 1 from the diagonal." },
    { question: "Which application uses LCS?", options: ["Sorting numbers", "Finding shortest path", "Version control diff tools", "Image compression"], correctAnswer: 2, explanation: "LCS is used in diff tools to find common lines between file versions." },
    { question: "What is the LCS length of two identical strings of length n?", options: ["0", "1", "n/2", "n"], correctAnswer: 3, explanation: "If strings are identical, LCS is the entire string with length n." },
  ],
  advanced: [
    { question: "What is the time complexity of LCS DP?", options: ["O(n)", "O(n log n)", "O(m×n)", "O(2^n)"], correctAnswer: 2, explanation: "Fills an m×n table, giving O(m×n) time." },
    { question: "What is the space complexity?", options: ["O(1)", "O(n)", "O(m+n)", "O(m×n)"], correctAnswer: 3, explanation: "Standard implementation uses a 2D table of size m×n." },
    { question: "When X[i]≠Y[j], what is dp[i][j]?", options: ["0", "dp[i-1][j-1]", "max(dp[i-1][j], dp[i][j-1])", "min(dp[i-1][j], dp[i][j-1])"], correctAnswer: 2, explanation: "Take the max of excluding either character." },
    { question: "How to reconstruct the actual LCS?", options: ["Read last row", "Read diagonal", "Backtrack from dp[m][n]", "Sum all values"], correctAnswer: 2, explanation: "Backtrack from dp[m][n], moving diagonally on matches." },
    { question: "What is the LCS of 'ABCD' and 'AEBD'?", options: ["AB", "ABD", "ACD", "ABCD"], correctAnswer: 1, explanation: "LCS is 'ABD' with length 3." },
  ],
  mastery: [
    { question: "[GATE] The LCS problem can be space-optimized from O(m×n) to:", options: ["O(1)", "O(min(m,n))", "O(max(m,n))", "O(m+n)"], correctAnswer: 1, explanation: "Since each row only depends on the previous row, we can use two 1D arrays of size min(m,n)+1." },
    { question: "[GATE] What is the relationship between LCS length and minimum edit distance (insertions + deletions only)?", options: ["Edit distance = LCS", "Edit distance = m + n - 2×LCS(X,Y)", "LCS = Edit Distance / 2", "No relationship"], correctAnswer: 1, explanation: "The minimum edit distance using only insertions and deletions equals m + n - 2 × LCS(X,Y)." },
    { question: "[GATE] For two strings of lengths m and n, the number of distinct subsequences that can be formed from a string of length m is:", options: ["m", "m²", "2^m", "m!"], correctAnswer: 2, explanation: "Each character can be included or excluded from a subsequence, giving 2^m possible subsequences." },
    { type: "input" as const, question: "[GATE PYQ] What is the LCS length of 'ABCBDAB' and 'BDCABA'?", correctAnswer: "4", explanation: "LCS is 'BCBA' or 'BDAB' with length 4.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] For strings 'ABC' and 'AC', how many cells are in the complete DP table (including base case row and column)?", correctAnswer: "12", explanation: "Table dimensions: (3+1)×(2+1) = 4×3 = 12 cells.", placeholder: "Enter a number" },
  ],
};

const LCS = () => {
  const algorithmId = useAlgorithmId("LCS");

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
  const [str1, setStr1] = useState("AGGTAB");
  const [str2, setStr2] = useState("GXTXAYB");
  const [dpTable, setDpTable] = useState<number[][]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [backtrackPath, setBacktrackPath] = useState<Set<string>>(new Set());
  const [lcsResult, setLcsResult] = useState("");
  const [currentCell, setCurrentCell] = useState<{ i: number; j: number } | null>(null);

  const generateSteps = useCallback(() => {
    if (str1.length === 0 || str2.length === 0) {
      setSteps([]);
      setDpTable([]);
      return;
    }

    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const newSteps: Step[] = [];

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          newSteps.push({
            i, j, value: dp[i][j], phase: "filling",
            message: `'${str1[i - 1]}' = '${str2[j - 1]}' → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}`,
            direction: "diagonal",
          });
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          const fromUp = dp[i - 1][j] >= dp[i][j - 1];
          newSteps.push({
            i, j, value: dp[i][j], phase: "filling",
            message: `'${str1[i - 1]}' ≠ '${str2[j - 1]}' → dp[${i}][${j}] = max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}`,
            direction: fromUp ? "up" : "left",
          });
        }
      }
    }

    let i = m, j = n;
    let lcs = "";
    
    while (i > 0 && j > 0) {
      if (str1[i - 1] === str2[j - 1]) {
        lcs = str1[i - 1] + lcs;
        newSteps.push({
          i, j, value: dp[i][j], phase: "backtracking",
          message: `Match! Adding '${str1[i - 1]}' to LCS. Move diagonally.`,
          direction: "diagonal", lcsChar: str1[i - 1],
        });
        i--; j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        newSteps.push({
          i, j, value: dp[i][j], phase: "backtracking",
          message: `dp[${i - 1}][${j}] > dp[${i}][${j - 1}]. Move up.`,
          direction: "up",
        });
        i--;
      } else {
        newSteps.push({
          i, j, value: dp[i][j], phase: "backtracking",
          message: `dp[${i}][${j - 1}] ≥ dp[${i - 1}][${j}]. Move left.`,
          direction: "left",
        });
        j--;
      }
    }

    newSteps.push({
      i: 0, j: 0, value: dp[m][n], phase: "complete",
      message: `Complete! LCS = "${lcs}" with length ${dp[m][n]}`,
    });

    setDpTable(dp);
    setSteps(newSteps);
    setHighlightedCells(new Set());
    setBacktrackPath(new Set());
    setLcsResult("");
    setCurrentStep(-1);
    setCurrentCell(null);
  }, [str1, str2]);

  useEffect(() => {
    generateSteps();
  }, [generateSteps]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => setCurrentStep((prev) => prev + 1), speed);
      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, steps.length, speed]);

  useEffect(() => {
    if (currentStep >= 0 && steps[currentStep]) {
      const step = steps[currentStep];
      setCurrentCell({ i: step.i, j: step.j });

      if (step.phase === "filling") {
        setHighlightedCells((prev) => new Set([...prev, `${step.i}-${step.j}`]));
      } else if (step.phase === "backtracking") {
        setBacktrackPath((prev) => new Set([...prev, `${step.i}-${step.j}`]));
        if (step.lcsChar) {
          setLcsResult((prev) => step.lcsChar + prev);
        }
      } else if (step.phase === "complete") {
        setCurrentCell(null);
      }
    }
  }, [currentStep, steps]);

  const handleStart = () => {
    if (currentStep === -1) setCurrentStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
    setHighlightedCells(new Set());
    setBacktrackPath(new Set());
    setLcsResult("");
    setCurrentCell(null);
  };

  const handleStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;

  const formattedTraceSteps = steps.map((step) => {
    if (step.phase === "filling") {
      const char1 = str1[step.i - 1];
      const char2 = str2[step.j - 1];
      const match = char1 === char2;
      if (match) {
        return `Calculate dp[${step.i}][${step.j}] since X[${step.i - 1}] ('${char1}') == Y[${step.j - 1}] ('${char2}'). Use formula dp[${step.i - 1}][${step.j - 1}] + 1. Store value ${step.value}`;
      } else {
        return `Calculate dp[${step.i}][${step.j}] since X[${step.i - 1}] ('${char1}') != Y[${step.j - 1}] ('${char2}'). Use formula max(dp[${step.i - 1}][${step.j}], dp[${step.i}][${step.j - 1}]). Store value ${step.value}`;
      }
    }
    if (step.phase === "backtracking") {
      const char1 = str1[step.i - 1];
      const char2 = str2[step.j - 1];
      const match = char1 === char2;
      if (match) {
        return `Backtrack at dp[${step.i}][${step.j}]: match ('${char1}'). Add '${char1}' to LCS. Move diagonally to dp[${step.i - 1}][${step.j - 1}]`;
      } else {
        const nextCell = step.direction === "up" ? `dp[${step.i - 1}][${step.j}]` : `dp[${step.i}][${step.j - 1}]`;
        return `Backtrack at dp[${step.i}][${step.j}]: mismatch. Move to max neighbor ${nextCell}`;
      }
    }
    if (step.phase === "complete") {
      return `Reconstruction complete! LCS = "${lcsResult}" (length: ${step.value})`;
    }
    return step.message;
  });

  const getCellClass = (i: number, j: number) => {
    const key = `${i}-${j}`;
    const isCurrent = currentCell?.i === i && currentCell?.j === j;
    const isBacktrack = backtrackPath.has(key);
    const isFilled = highlightedCells.has(key);

    if (isCurrent && currentStepData?.phase === "backtracking") {
      return "bg-accent text-accent-foreground ring-2 ring-accent animate-pulse";
    }
    if (isCurrent) {
      return "bg-primary text-primary-foreground ring-2 ring-primary animate-pulse";
    }
    if (isBacktrack) {
      return "bg-success/30 text-success border-success";
    }
    if (isFilled) {
      return "bg-primary/20 text-primary";
    }
    if (i === 0 || j === 0) {
      return "bg-muted text-muted-foreground";
    }
    return "bg-secondary text-foreground";
  };

  const getDirectionIcon = () => {
    if (!currentStepData?.direction) return null;
    switch (currentStepData.direction) {
      case "diagonal": return <ArrowUpLeft className="h-4 w-4" />;
      case "up": return <ArrowUp className="h-4 w-4" />;
      case "left": return <ArrowLeftIcon className="h-4 w-4" />;
    }
  };

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          The <strong className="text-foreground">Longest Common Subsequence (LCS)</strong> problem finds the longest 
          subsequence present in both strings. A subsequence maintains relative order but doesn't need to be contiguous.
        </p>
      }
      steps={[
        "Create a DP table of size (m+1) × (n+1) initialized to 0",
        "For each cell dp[i][j], if characters match: dp[i][j] = dp[i-1][j-1] + 1",
        "If characters don't match: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
        "The value at dp[m][n] gives the LCS length",
        "Backtrack from dp[m][n] to reconstruct the actual LCS",
      ]}
      stepsTitle="Algorithm Steps"
      timeComplexity="O(m × n)"
      timeComplexityNote="Where m and n are the lengths of the two strings"
      spaceComplexity="O(m × n)"
      spaceComplexityNote="For storing the DP table"
      applications={[
        "Version control diff tools (git diff)",
        "DNA sequence alignment in bioinformatics",
        "Spell checkers and autocorrect",
        "Plagiarism detection systems",
      ]}
      diagram={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-accent mb-2">Recurrence (Match)</h4>
            <p className="text-sm text-muted-foreground font-mono">
              If X[i] = Y[j]:<br />dp[i][j] = dp[i-1][j-1] + 1
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-accent mb-2">Recurrence (No Match)</h4>
            <p className="text-sm text-muted-foreground font-mono">
              dp[i][j] = max(dp[i-1][j], dp[i][j-1])
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-accent mb-2">Backtracking</h4>
            <p className="text-sm text-muted-foreground">
              Follow diagonal moves on matches to reconstruct the LCS.
            </p>
          </div>
        </div>
      }
    />
  );

  const simulatorContent = (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Input Strings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">String X</label>
            <Input
              value={str1}
              onChange={(e) => setStr1(e.target.value.toUpperCase())}
              placeholder="Enter first string..."
              className="font-mono"
              maxLength={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">String Y</label>
            <Input
              value={str2}
              onChange={(e) => setStr2(e.target.value.toUpperCase())}
              placeholder="Enter second string..."
              className="font-mono"
              maxLength={12}
            />
          </div>
        </div>
      </div>

      {/* Visualization Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">DP Table Visualization</h3>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Speed:</label>
            <Slider
              value={[1200 - speed]}
              onValueChange={(val) => setSpeed(1200 - val[0])}
              min={200}
              max={1000}
              step={50}
              className="w-28"
            />
            <span className="text-xs text-muted-foreground w-10">{speed <= 300 ? "Fast" : speed <= 700 ? "Normal" : "Slow"}</span>
          </div>
        </div>

        {/* DP Table */}
        <div className="overflow-x-auto mb-6">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-10 text-center text-xs text-muted-foreground"></th>
                <th className={`w-10 h-10 text-center text-xs font-mono transition-all duration-200 ${currentCell && currentCell.j === 0 ? "text-primary font-bold scale-110" : "text-muted-foreground"}`}>ε</th>
                 {str2.split("").map((char, j) => (
                   <th key={j} className={`w-10 h-10 text-center text-xs font-mono transition-all duration-200 ${currentCell && currentCell.j === j + 1 ? "text-primary font-bold scale-110 bg-primary/10 rounded" : "text-accent"}`}>{char}</th>
                 ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`w-10 h-10 text-center text-xs font-mono transition-all duration-200 ${currentCell && currentCell.i === 0 ? "text-primary font-bold scale-110 bg-primary/10 rounded" : "text-muted-foreground"}`}>ε</td>
                {dpTable[0]?.map((val, j) => (
                  <td key={j} className={`w-10 h-10 text-center text-sm font-mono border border-border transition-all duration-200 ${getCellClass(0, j)}`}>
                    {highlightedCells.has(`0-${j}`) || j === 0 ? val : ""}
                  </td>
                ))}
              </tr>
              {str1.split("").map((char, i) => (
                <tr key={i}>
                  <td className={`w-10 h-10 text-center text-xs font-mono transition-all duration-200 ${currentCell && currentCell.i === i + 1 ? "text-primary font-bold scale-110 bg-primary/10 rounded" : "text-primary"}`}>{char}</td>
                  {dpTable[i + 1]?.map((val, j) => (
                    <td key={j} className={`w-10 h-10 text-center text-sm font-mono border border-border transition-all duration-200 ${getCellClass(i + 1, j)}`}>
                      {highlightedCells.has(`${i + 1}-${j}`) || backtrackPath.has(`${i + 1}-${j}`) || j === 0 ? val : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20 border border-primary/50"></div>
            <span className="text-muted-foreground">Filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary border border-primary"></div>
            <span className="text-muted-foreground">Current (Filling)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent border border-accent"></div>
            <span className="text-muted-foreground">Current (Backtracking)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/30 border border-success"></div>
            <span className="text-muted-foreground">LCS Path</span>
          </div>
        </div>

        {/* Status Message */}
        {currentStepData && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${
            currentStepData.phase === "complete" ? "bg-success/10 border-success/30" :
            currentStepData.phase === "backtracking" ? "bg-accent/10 border-accent/30" :
            "bg-primary/10 border-primary/30"
          }`}>
            {getDirectionIcon()}
            <span className={
              currentStepData.phase === "complete" ? "text-success" :
              currentStepData.phase === "backtracking" ? "text-accent" : "text-primary"
            }>
              {currentStepData.message}
            </span>
          </div>
        )}

        {/* LCS Result */}
        {lcsResult && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">LCS Found:</span>
            <div className="flex gap-1">
              {lcsResult.split("").map((char, i) => (
                <span key={i} className="w-8 h-8 flex items-center justify-center font-mono font-bold bg-success/20 text-success border border-success/50 rounded">
                  {char}
                </span>
              ))}
            </div>
            <Badge className="bg-success/20 text-success border-success/30">Length: {lcsResult.length}</Badge>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {!isPlaying ? (
            <Button onClick={handleStart} variant="accent">
              <Play className="h-4 w-4 mr-2" />
              {currentStep === -1 ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary">
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
          <div className="ml-auto text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
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
      title="LCS Quiz"
      levels={quizLevels}
      backPath="/dynamic-programming/lcs"
      backLabel="Back to Simulator"
      accentColor="accent"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Longest Common Subsequence"
      code={`#include <stdio.h>
#include <string.h>

int max(int a, int b) {
    return (a > b) ? a : b;
}

void lcs(char *X, char *Y) {
    int m = strlen(X);
    int n = strlen(Y);
    int L[m + 1][n + 1];

    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0)
                L[i][j] = 0;
            else if (X[i - 1] == Y[j - 1])
                L[i][j] = L[i - 1][j - 1] + 1;
            else
                L[i][j] = max(L[i - 1][j], L[i][j - 1]);
        }
    }

    // Backtrack to find LCS string
    int index = L[m][n];
    char result[index + 1];
    result[index] = '\\0';

    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (X[i - 1] == Y[j - 1]) {
            result[index - 1] = X[i - 1];
            i--; j--; index--;
        } else if (L[i - 1][j] > L[i][j - 1])
            i--;
        else
            j--;
    }

    printf("LCS Length: %d\\n", L[m][n]);
    printf("LCS: %s\\n", result);
}

int main() {
    char X[] = "AGGTAB";
    char Y[] = "GXTXAYB";
    lcs(X, Y);
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Longest Common Subsequence"
      description="Dynamic Programming Approach for finding LCS"
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

export default LCS;
