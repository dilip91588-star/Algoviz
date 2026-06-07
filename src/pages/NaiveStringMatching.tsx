import { useState, useEffect, useCallback } from "react";
import AlgorithmPageLayout from "@/components/layout/AlgorithmPageLayout";
import { useAlgorithmId } from "@/hooks/useAlgorithmId";
import { updateProgress } from "@/lib/api";
import TheorySection from "@/components/algorithm/TheorySection";
import CCodeDisplay from "@/components/algorithm/CCodeDisplay";
import QuizContainer, { LeveledQuestions } from "@/components/quiz/QuizContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, SkipForward, CheckCircle2, XCircle, Eye } from "lucide-react";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";

interface Step {
  windowStart: number;
  charIndex: number; // which character within the window is being compared (-1 if not comparing)
  isMatch: boolean;
  matchPositions: number[];
  phase: "comparing" | "char-match" | "char-mismatch" | "full-match" | "slide" | "complete";
  message: string;
  totalComparisons: number;
}

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What is the basic idea behind naive string matching?", options: ["Use hashing to compare", "Slide pattern one by one and compare all characters", "Sort both strings first", "Use dynamic programming"], correctAnswer: 1, explanation: "Naive matching slides the pattern over the text one position at a time and compares character by character." },
    { question: "What is the best-case time complexity of naive string matching?", options: ["O(n)", "O(m)", "O(n+m)", "O(nm)"], correctAnswer: 0, explanation: "Best case is O(n) when the first character of the pattern never matches any character in the text." },
    { question: "What is the worst-case time complexity?", options: ["O(n)", "O(n+m)", "O(n×m)", "O(n²)"], correctAnswer: 2, explanation: "Worst case O(n×m) occurs when every window requires comparing all m characters before finding a mismatch at the last position." },
    { question: "What is the space complexity of naive string matching?", options: ["O(n)", "O(m)", "O(n+m)", "O(1)"], correctAnswer: 3, explanation: "Naive matching uses only a few index variables, so space complexity is O(1)." },
    { question: "When does the worst case occur?", options: ["Pattern is at the end", "All characters are same, e.g., text='AAAA', pattern='AAA'", "Pattern is longer than text", "Text has no repeating characters"], correctAnswer: 1, explanation: "When all characters are the same, every position requires full comparison of all pattern characters." },
  ],
  advanced: [
    { question: "How many positions does the pattern slide over in the text?", options: ["n", "m", "n - m + 1", "n - m"], correctAnswer: 2, explanation: "The pattern slides from position 0 to n-m, giving n-m+1 positions total." },
    { question: "Why is naive matching called 'brute force'?", options: ["It uses hashing", "It tries every possible position without optimization", "It sorts first", "It uses recursion"], correctAnswer: 1, explanation: "It exhaustively checks every position without any skipping or pruning strategy." },
    { question: "Which improvement does Rabin-Karp add over naive matching?", options: ["Binary search", "Rolling hash to skip positions", "Sorting characters", "Divide and conquer"], correctAnswer: 1, explanation: "Rabin-Karp uses hash comparison to avoid character-by-character comparison at every position." },
    { question: "For text 'ABCABD' and pattern 'ABD', at which position is the match found?", options: ["0", "1", "2", "3"], correctAnswer: 3, explanation: "Position 3: text[3..5] = 'ABD' matches the pattern." },
    { question: "If text has length 10 and pattern has length 3, what is the maximum number of comparisons in the worst case?", options: ["10", "24", "30", "8"], correctAnswer: 1, explanation: "Maximum comparisons = (10 - 3 + 1) × 3 = 8 × 3 = 24." },
  ],
  mastery: [
    { question: "[GATE] For text T of length n and pattern P of length m, the total number of character comparisons in the worst case of naive string matching is:", options: ["n", "n+m", "(n-m+1)×m", "n×m"], correctAnswer: 2, explanation: "At each of the (n-m+1) positions, up to m comparisons are made, giving (n-m+1)×m worst-case comparisons." },
    { question: "[GATE] Which of the following is NOT an advantage of naive string matching?", options: ["Simple implementation", "No preprocessing needed", "Efficient for large texts with repetitive patterns", "Works with any character set"], correctAnswer: 2, explanation: "Naive matching is O(nm) in the worst case and is NOT efficient for large texts with repetitive patterns." },
    { question: "[GATE] In naive matching, after a mismatch at position j within the pattern, the window shifts by how many positions?", options: ["j positions", "1 position", "m positions", "j+1 positions"], correctAnswer: 1, explanation: "Naive matching always shifts by exactly 1 position regardless of where the mismatch occurred. This is its key inefficiency." },
    { type: "input" as const, question: "[GATE PYQ] For text 'AAAAAB' and pattern 'AAB', how many total character comparisons does naive matching perform?", correctAnswer: "12", explanation: "Positions 0-3: each compares 3 chars (match A,A then mismatch at B). That's 4×3 = 12.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] For text 'ABABAB' and pattern 'ABA', how many matches are found?", correctAnswer: "2", explanation: "Matches at positions 0 ('ABA'BAB) and 2 (AB'ABA'B).", placeholder: "Enter a number" },
  ],
};

const NaiveStringMatching = () => {
  const algorithmId = useAlgorithmId("Naive String Matching");

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
  const [text, setText] = useState("AABAACAADAABAABA");
  const [pattern, setPattern] = useState("AABA");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [matchPositions, setMatchPositions] = useState<number[]>([]);

  const generateSteps = useCallback(() => {
    if (pattern.length === 0 || pattern.length > text.length) {
      setSteps([]);
      return;
    }

    const newSteps: Step[] = [];
    const m = pattern.length;
    const n = text.length;
    const matches: number[] = [];
    let totalComparisons = 0;

    for (let i = 0; i <= n - m; i++) {
      let j = 0;
      let matched = true;

      for (j = 0; j < m; j++) {
        totalComparisons++;

        if (text[i + j] === pattern[j]) {
          newSteps.push({
            windowStart: i, charIndex: j, isMatch: false,
            matchPositions: [...matches], phase: "char-match",
            message: `Position ${i}, comparing text[${i + j}]='${text[i + j]}' with pattern[${j}]='${pattern[j]}' — Match!`,
            totalComparisons,
          });

          if (j === m - 1) {
            matches.push(i);
            newSteps.push({
              windowStart: i, charIndex: j, isMatch: true,
              matchPositions: [...matches], phase: "full-match",
              message: `Pattern found at index ${i}!`,
              totalComparisons,
            });
          }
        } else {
          matched = false;
          newSteps.push({
            windowStart: i, charIndex: j, isMatch: false,
            matchPositions: [...matches], phase: "char-mismatch",
            message: `Position ${i}, comparing text[${i + j}]='${text[i + j]}' with pattern[${j}]='${pattern[j]}' — Mismatch! Slide window.`,
            totalComparisons,
          });
          break;
        }
      }

      if (i < n - m) {
        newSteps.push({
          windowStart: i + 1, charIndex: -1, isMatch: false,
          matchPositions: [...matches], phase: "slide",
          message: `Sliding window to position ${i + 1}...`,
          totalComparisons,
        });
      }
    }

    newSteps.push({
      windowStart: n - m, charIndex: -1, isMatch: false,
      matchPositions: [...matches], phase: "complete",
      message: `Algorithm complete! Found ${matches.length} match${matches.length !== 1 ? "es" : ""}. Total comparisons: ${totalComparisons}.`,
      totalComparisons,
    });

    setSteps(newSteps);
    setMatchPositions([]);
    setCurrentStep(-1);
  }, [text, pattern]);

  useEffect(() => { generateSteps(); }, [generateSteps]);

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
      setMatchPositions(steps[currentStep].matchPositions);
    }
  }, [currentStep, steps]);

  const handleStart = () => {
    if (currentStep === -1) setCurrentStep(0);
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => { setIsPlaying(false); setCurrentStep(-1); setMatchPositions([]); };
  const handleStep = () => { if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1); };

  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;

  const formattedTraceSteps = steps.map((step) => {
    if (step.phase === "char-match" || step.phase === "char-mismatch") {
      const isMatch = step.phase === "char-match";
      const tIdx = step.windowStart + step.charIndex;
      const pIdx = step.charIndex;
      const tChar = text[tIdx];
      const pChar = pattern[pIdx];
      return `Compare T[${tIdx}] ('${tChar}') with P[${pIdx}] ('${pChar}') — ${isMatch ? "Characters match" : "Mismatch"}`;
    }
    if (step.phase === "full-match") {
      return `Pattern found at index ${step.windowStart}`;
    }
    if (step.phase === "slide") {
      return `Slide window to position ${step.windowStart}`;
    }
    if (step.phase === "complete") {
      return `Search complete. Found ${step.matchPositions.length} matches.`;
    }
    return step.message;
  });

  const getCharacterClass = (index: number) => {
    if (!currentStepData) return "bg-secondary text-foreground border-border";

    const ws = currentStepData.windowStart;
    const we = ws + pattern.length;

    // Previously matched positions
    if (matchPositions.some(pos => index >= pos && index < pos + pattern.length)) {
      return "bg-success/30 text-success border-success";
    }

    if (index >= ws && index < we) {
      const ci = currentStepData.charIndex;
      const relIdx = index - ws;

      if (currentStepData.phase === "full-match") return "bg-success/30 text-success border-success animate-pulse";

      if (ci >= 0) {
        if (relIdx < ci) return "bg-primary/20 text-primary border-primary/50"; // already matched chars
        if (relIdx === ci) {
          if (currentStepData.phase === "char-match") return "bg-primary/40 text-primary border-primary animate-pulse";
          if (currentStepData.phase === "char-mismatch") return "bg-destructive/30 text-destructive border-destructive animate-pulse";
        }
      }

      return "bg-primary/10 text-foreground border-primary/30";
    }

    return "bg-secondary text-foreground border-border";
  };

  const getPatternCharClass = (index: number) => {
    if (!currentStepData || currentStepData.charIndex < 0) return "bg-primary/20 text-primary border-primary/50";

    if (currentStepData.phase === "full-match") return "bg-success/30 text-success border-success animate-pulse";

    if (index < currentStepData.charIndex) return "bg-primary/30 text-primary border-primary";
    if (index === currentStepData.charIndex) {
      if (currentStepData.phase === "char-match") return "bg-primary/40 text-primary border-primary animate-pulse";
      if (currentStepData.phase === "char-mismatch") return "bg-destructive/30 text-destructive border-destructive animate-pulse";
    }
    return "bg-primary/20 text-primary border-primary/50";
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "full-match": case "complete": return "text-success";
      case "char-match": return "text-primary";
      case "char-mismatch": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const speedLabel = speed <= 300 ? "Fast" : speed <= 600 ? "Normal" : speed <= 1200 ? "Slow" : "Very Slow";

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          The <strong className="text-foreground">Naive String Matching</strong> algorithm is the simplest
          approach to pattern matching. It slides the pattern over the text one position at a time and compares
          characters one by one at each position. While not the most efficient, it serves as the foundation
          for understanding more advanced algorithms like KMP and Rabin-Karp.
        </p>
      }
      steps={[
        "Start with the pattern aligned at position 0 of the text",
        "Compare each character of the pattern with the corresponding character in the text",
        "If all characters match, report the current position as a match",
        "If a mismatch is found, stop comparing and slide the pattern one position to the right",
        "Repeat until the pattern has been checked at all valid positions (0 to n-m)",
      ]}
      stepsTitle="Algorithm Steps"
      timeComplexity="O(n×m) worst, O(n) best"
      timeComplexityNote="Best case when first character of pattern never matches. Worst case when all characters are the same."
      spaceComplexity="O(1)"
      spaceComplexityNote="Uses only a constant number of variables"
      applications={[
        "Simple text search in small documents",
        "Baseline for comparing advanced algorithms",
        "Educational foundation for pattern matching",
        "Embedded systems with limited resources",
      ]}
      diagram={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Sliding Window</h4>
            <p className="text-sm text-muted-foreground">
              The pattern slides one position at a time across the text, checking for a match at each position.
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">No Preprocessing</h4>
            <p className="text-sm text-muted-foreground">
              Unlike KMP or Rabin-Karp, naive matching requires no preprocessing of the pattern or text.
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Brute Force</h4>
            <p className="text-sm text-muted-foreground">
              Every possible alignment is checked, making it simple but potentially slow for large inputs.
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
        <h3 className="font-semibold mb-4">Input</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Text String</label>
            <Input value={text} onChange={(e) => setText(e.target.value.toUpperCase())} placeholder="Enter text..." className="font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pattern</label>
            <Input value={pattern} onChange={(e) => setPattern(e.target.value.toUpperCase())} placeholder="Enter pattern..." className="font-mono" />
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Visualization</h3>
          <div className="flex items-center gap-3 min-w-[200px]">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Speed: {speedLabel}</label>
            <Slider
              value={[2000 - speed]}
              onValueChange={(val) => setSpeed(2000 - val[0])}
              min={0}
              max={1800}
              step={100}
              className="w-28"
            />
          </div>
        </div>

        {/* Text Display */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Text String</h4>
          <div className="flex flex-wrap gap-1">
            {text.split("").map((char, index) => (
              <div key={index} className={`w-10 h-10 flex items-center justify-center font-mono font-bold text-lg border-2 rounded transition-all duration-300 ${getCharacterClass(index)}`}>
                {char}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {text.split("").map((_, index) => (
              <div key={index} className="w-10 text-center text-xs text-muted-foreground font-mono">{index}</div>
            ))}
          </div>
        </div>

        {/* Pattern Display with offset */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Pattern (at position {currentStepData ? currentStepData.windowStart : 0})</h4>
          <div className="flex gap-1" style={{ marginLeft: currentStepData ? `${currentStepData.windowStart * 44}px` : "0px", transition: "margin-left 0.3s ease" }}>
            {pattern.split("").map((char, index) => (
              <div key={index} className={`w-10 h-10 flex items-center justify-center font-mono font-bold text-lg border-2 rounded transition-all duration-300 ${getPatternCharClass(index)}`}>
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Comparisons</span>
            </div>
            <div className="font-mono text-2xl text-primary">
              {currentStepData ? currentStepData.totalComparisons : 0}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Matches Found</span>
            </div>
            <div className="font-mono text-2xl text-success">
              {matchPositions.length}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Current Window</span>
            </div>
            <div className="font-mono text-2xl text-accent">
              {currentStepData ? currentStepData.windowStart : "—"}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {currentStepData && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${
            currentStepData.phase === "full-match" || currentStepData.phase === "complete" ? "bg-success/10 border-success/30" :
            currentStepData.phase === "char-mismatch" ? "bg-destructive/10 border-destructive/30" :
            "bg-primary/10 border-primary/30"
          }`}>
            {currentStepData.phase === "full-match" || currentStepData.phase === "complete" ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : currentStepData.phase === "char-mismatch" ? (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Eye className="h-5 w-5 text-primary shrink-0" />
            )}
            <span className={getPhaseColor(currentStepData.phase)}>{currentStepData.message}</span>
          </div>
        )}

        {/* Match Positions */}
        {matchPositions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-sm text-muted-foreground">Matches found at:</span>
            {matchPositions.map((pos) => (
              <Badge key={pos} className="bg-success/20 text-success border-success/30">Index {pos}</Badge>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {!isPlaying ? (
            <Button onClick={handleStart} variant="glow">
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
        categoryColor="primary"
      />
    </div>
  );

  const quizContent = (
    <QuizContainer
      title="Naive String Matching Quiz"
      levels={quizLevels}
      backPath="/string-matching/naive"
      backLabel="Back to Simulator"
      accentColor="primary"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Naive String Matching"
      code={`#include <stdio.h>
#include <string.h>

void naiveSearch(char pat[], char txt[]) {
    int M = strlen(pat);
    int N = strlen(txt);

    for (int i = 0; i <= N - M; i++) {
        int j;
        for (j = 0; j < M; j++) {
            if (txt[i + j] != pat[j])
                break;
        }
        if (j == M)
            printf("Pattern found at index %d\\n", i);
    }
}

int main() {
    char txt[] = "AABAACAADAABAABA";
    char pat[] = "AABA";
    naiveSearch(pat, txt);
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Naive String Matching"
      description="Brute-Force Pattern Matching"
      categoryName="String Matching"
      categoryPath="/string-matching"
      categoryColor="primary"
      theoryContent={theoryContent}
      algorithmContent={algorithmContent}
      simulatorContent={simulatorContent}
      quizContent={quizContent}
      onTabChange={handleTabChange}
    />
  );
};

export default NaiveStringMatching;
