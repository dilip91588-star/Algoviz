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
import { Play, Pause, RotateCcw, SkipForward, Hash, CheckCircle2, XCircle } from "lucide-react";
import ExecutionTracePanel from "@/components/algorithm/ExecutionTracePanel";

interface Step {
  windowStart: number;
  textHash: number;
  patternHash: number;
  isMatch: boolean;
  isHashMatch: boolean;
  matchPositions: number[];
  phase: "hashing" | "comparing" | "match" | "mismatch" | "complete";
  message: string;
}

const PRIME = 101;
const BASE = 256;

const quizLevels: LeveledQuestions = {
  foundation: [
    { question: "What is the main advantage of Rabin-Karp over naive matching?", options: ["Uses less memory", "Uses hashing to reduce comparisons", "Always O(n)", "Works with any alphabet"], correctAnswer: 1, explanation: "Rabin-Karp uses hash values to quickly eliminate non-matching positions." },
    { question: "What is a 'spurious hit'?", options: ["Algorithm fails to find match", "Hash values match but strings don't", "Pattern longer than text", "Multiple matches found"], correctAnswer: 1, explanation: "A spurious hit is a hash collision requiring character-by-character verification." },
    { question: "What is the space complexity of Rabin-Karp?", options: ["O(n)", "O(m)", "O(1)", "O(n+m)"], correctAnswer: 2, explanation: "Rabin-Karp uses constant extra space." },
    { question: "When hashes match, what happens next?", options: ["Match confirmed", "Algorithm terminates", "Character-by-character comparison", "Window moves"], correctAnswer: 2, explanation: "Character-by-character comparison verifies it's a true match." },
    { question: "Which base value is commonly used for ASCII?", options: ["2", "10", "128", "256"], correctAnswer: 3, explanation: "256 covers all ASCII character values (0-255)." },
  ],
  advanced: [
    { question: "What is a 'rolling hash'?", options: ["Hash that changes with each char", "Recalculate hash in O(1) when sliding window", "Hash that rolls back on mismatch", "Circular hash table"], correctAnswer: 1, explanation: "Rolling hash updates in constant time by removing leftmost and adding rightmost character contribution." },
    { question: "What is the average time complexity?", options: ["O(n²)", "O(nm)", "O(n+m)", "O(n log n)"], correctAnswer: 2, explanation: "On average O(n+m) assuming few spurious hits." },
    { question: "What is the worst-case time complexity?", options: ["O(n+m)", "O(n×m)", "O(n²)", "O(m²)"], correctAnswer: 1, explanation: "Worst case O(nm) when every position needs character verification." },
    { question: "Why use a prime number as modulus?", options: ["Faster calculations", "Reduces hash collisions", "Handle negatives", "Support Unicode"], correctAnswer: 1, explanation: "A prime modulus distributes hash values more uniformly." },
    { question: "When is Rabin-Karp particularly useful?", options: ["Single pattern only", "Multiple pattern matching", "Sorting strings", "Finding longest substring"], correctAnswer: 1, explanation: "Rabin-Karp excels at multiple pattern matching in a single pass." },
  ],
  mastery: [
    { question: "[GATE] In Rabin-Karp, the rolling hash formula to slide the window right by 1 is: h(s+1) = (d × (h(s) − T[s] × d^(m-1)) + T[s+m]) mod q. What is the purpose of d^(m-1)?", options: ["It is the hash of the pattern", "It removes the contribution of the leftmost character", "It adds the new rightmost character", "It prevents overflow"], correctAnswer: 1, explanation: "d^(m-1) represents the positional weight of the leftmost character; subtracting T[s]×d^(m-1) removes its contribution from the hash." },
    { question: "[GATE] If d=256, q=101, and pattern='AB' (A=65, B=66), the pattern hash value is:", options: ["131", "46", "66", "65"], correctAnswer: 1, explanation: "Hash = (65 × 256 + 66) mod 101 = 16706 mod 101 = 46." },
    { question: "[GATE] What is the primary cause of worst-case O(nm) behavior in Rabin-Karp?", options: ["Using too large a prime q", "All windows produce the same hash as the pattern (maximum spurious hits)", "Pattern is too short", "Base d is incorrect"], correctAnswer: 1, explanation: "When every window's hash matches the pattern hash (all spurious hits), every position requires full O(m) character comparison." },
    { type: "input" as const, question: "[GATE PYQ] For text 'AAAA' and pattern 'AA', how many valid matches does Rabin-Karp find?", correctAnswer: "3", explanation: "Matches at positions 0,1,2: 'AA'AA, A'AA'A, AA'AA'.", placeholder: "Enter a number" },
    { type: "input" as const, question: "[GATE] If d=10, q=13, current hash=7, new char=3. What is (7×10 + 3) mod 13?", correctAnswer: "8", explanation: "(7×10 + 3) = 73. 73 mod 13 = 8.", placeholder: "Enter the result" },
  ],
};

const RabinKarp = () => {
  const algorithmId = useAlgorithmId("Rabin-Karp");

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
  const [text, setText] = useState("ABABDABACDABABCABAB");
  const [pattern, setPattern] = useState("ABAB");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [matchPositions, setMatchPositions] = useState<number[]>([]);

  const calculateHash = (str: string, length: number): number => {
    let hash = 0;
    for (let i = 0; i < length; i++) {
      hash = (hash * BASE + str.charCodeAt(i)) % PRIME;
    }
    return hash;
  };

  const recalculateHash = (oldHash: number, oldChar: string, newChar: string, patternLength: number, h: number): number => {
    let newHash = (oldHash - oldChar.charCodeAt(0) * h) % PRIME;
    newHash = (newHash * BASE + newChar.charCodeAt(0)) % PRIME;
    if (newHash < 0) newHash += PRIME;
    return newHash;
  };

  const generateSteps = useCallback(() => {
    if (pattern.length === 0 || pattern.length > text.length) {
      setSteps([]);
      return;
    }

    const newSteps: Step[] = [];
    const m = pattern.length;
    const n = text.length;
    const matches: number[] = [];

    let h = 1;
    for (let i = 0; i < m - 1; i++) {
      h = (h * BASE) % PRIME;
    }

    const patternHash = calculateHash(pattern, m);
    let textHash = calculateHash(text, m);

    newSteps.push({
      windowStart: 0, textHash, patternHash, isMatch: false, isHashMatch: textHash === patternHash,
      matchPositions: [], phase: "hashing",
      message: `Initial hash calculated. Pattern hash: ${patternHash}, Text window hash: ${textHash}`,
    });

    for (let i = 0; i <= n - m; i++) {
      if (i > 0) {
        textHash = recalculateHash(textHash, text[i - 1], text[i + m - 1], m, h);
        newSteps.push({
          windowStart: i, textHash, patternHash, isMatch: false, isHashMatch: textHash === patternHash,
          matchPositions: [...matches], phase: "hashing",
          message: `Rolling hash: Removed '${text[i - 1]}', added '${text[i + m - 1]}'. New hash: ${textHash}`,
        });
      }

      if (textHash === patternHash) {
        newSteps.push({
          windowStart: i, textHash, patternHash, isMatch: false, isHashMatch: true,
          matchPositions: [...matches], phase: "comparing",
          message: `Hash match! Comparing characters one by one...`,
        });

        let match = true;
        for (let j = 0; j < m; j++) {
          if (text[i + j] !== pattern[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          matches.push(i);
          newSteps.push({
            windowStart: i, textHash, patternHash, isMatch: true, isHashMatch: true,
            matchPositions: [...matches], phase: "match",
            message: `Pattern found at index ${i}!`,
          });
        } else {
          newSteps.push({
            windowStart: i, textHash, patternHash, isMatch: false, isHashMatch: true,
            matchPositions: [...matches], phase: "mismatch",
            message: `Spurious hit! Hash matched but characters don't match.`,
          });
        }
      } else {
        newSteps.push({
          windowStart: i, textHash, patternHash, isMatch: false, isHashMatch: false,
          matchPositions: [...matches], phase: "mismatch",
          message: `Hash mismatch (${textHash} ≠ ${patternHash}). Sliding window...`,
        });
      }
    }

    newSteps.push({
      windowStart: n - m, textHash, patternHash, isMatch: false, isHashMatch: false,
      matchPositions: [...matches], phase: "complete",
      message: `Algorithm complete! Found ${matches.length} match${matches.length !== 1 ? "es" : ""}.`,
    });

    setSteps(newSteps);
    setMatchPositions([]);
    setCurrentStep(-1);
  }, [text, pattern]);

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
      setMatchPositions(steps[currentStep].matchPositions);
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
    setMatchPositions([]);
  };

  const handleStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;

  const formattedTraceSteps = steps.map((step) => {
    if (step.phase === "hashing" && step.windowStart === 0) {
      return `Calculate hash of pattern (${step.patternHash}) and first text window (${step.textHash}). Modulo Q = ${PRIME}.`;
    }
    if (step.phase === "hashing" && step.windowStart > 0) {
      return `Compute rolling hash for window index ${step.windowStart}: remove '${text[step.windowStart - 1]}', add '${text[step.windowStart + pattern.length - 1]}'. New window hash: ${step.textHash}`;
    }
    if (step.phase === "comparing") {
      return `Compare pattern hash (${step.patternHash}) with window hash (${step.textHash}): Hashes match. Verify characters one by one.`;
    }
    if (step.phase === "match") {
      return `Character verification succeeded. Pattern found at index ${step.windowStart}!`;
    }
    if (step.phase === "mismatch") {
      if (step.isHashMatch) {
        return `Spurious hit! Hashes match (${step.patternHash} == ${step.textHash}) but characters do not. Continue searching.`;
      } else {
        return `Compare pattern hash (${step.patternHash}) with window hash (${step.textHash}): Hashes do not match. Skip character verification. Move to next window.`;
      }
    }
    if (step.phase === "complete") {
      return `Search complete. Found ${step.matchPositions.length} matches.`;
    }
    return step.message;
  });

  const getCharacterClass = (index: number) => {
    if (!currentStepData) return "bg-secondary text-foreground";
    
    const windowStart = currentStepData.windowStart;
    const windowEnd = windowStart + pattern.length;
    
    if (matchPositions.some(pos => index >= pos && index < pos + pattern.length)) {
      return "bg-success/30 text-success border-success";
    }
    
    if (index >= windowStart && index < windowEnd) {
      if (currentStepData.phase === "match") return "bg-success/30 text-success border-success animate-pulse";
      if (currentStepData.phase === "comparing") return "bg-primary/30 text-primary border-primary animate-pulse";
      if (currentStepData.isHashMatch) return "bg-warning/30 text-warning border-warning";
      return "bg-primary/20 text-primary border-primary/50";
    }
    
    return "bg-secondary text-foreground border-border";
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "match": case "complete": return "text-success";
      case "comparing": return "text-primary";
      case "mismatch": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const theoryContent = (
    <TheorySection
      introduction={
        <p>
          The <strong className="text-foreground">Rabin-Karp algorithm</strong> uses hashing to find pattern matches.
          Instead of comparing every character, it computes hash values and only does character-by-character
          comparison when hashes match.
        </p>
      }
      steps={[
        "Calculate the hash value of the pattern",
        "Calculate the hash value of the first window in the text",
        "Compare hash values; if they match, verify with character comparison",
        "Slide the window using rolling hash (O(1) update)",
        "Repeat until the end of the text",
      ]}
      stepsTitle="Algorithm Steps"
      timeComplexity="O(n+m) avg, O(nm) worst"
      timeComplexityNote="Average case assumes few hash collisions"
      spaceComplexity="O(1)"
      spaceComplexityNote="Only stores hash values and a few variables"
      applications={[
        "Plagiarism detection systems",
        "Multiple pattern matching",
        "DNA sequence matching in bioinformatics",
        "Searching in large documents",
      ]}
      diagram={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Rolling Hash</h4>
            <p className="text-sm text-muted-foreground">
              Efficiently recalculates hash by removing the leftmost character and adding the new rightmost character.
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Hash Formula</h4>
            <p className="text-sm text-muted-foreground font-mono">hash = (d × hash + char) mod q</p>
            <p className="text-xs text-muted-foreground mt-1">d=256, q=101</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Spurious Hits</h4>
            <p className="text-sm text-muted-foreground">
              When hashes match but strings don't—requires character verification.
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

      {/* Visualization Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Visualization</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Speed:</label>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-secondary border border-border rounded px-2 py-1 text-sm">
              <option value={2000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
            </select>
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

        {/* Pattern Display */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Pattern</h4>
          <div className="flex gap-1">
            {pattern.split("").map((char, index) => (
              <div key={index} className="w-10 h-10 flex items-center justify-center font-mono font-bold text-lg border-2 rounded bg-primary/20 text-primary border-primary/50">
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* Hash Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pattern Hash</span>
            </div>
            <div className="font-mono text-2xl text-primary">
              {currentStepData ? currentStepData.patternHash : calculateHash(pattern, pattern.length)}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Window Hash</span>
            </div>
            <div className={`font-mono text-2xl ${currentStepData?.isHashMatch ? "text-success" : "text-accent"}`}>
              {currentStepData ? currentStepData.textHash : "—"}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {currentStepData && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${
            currentStepData.phase === "match" || currentStepData.phase === "complete" ? "bg-success/10 border-success/30" :
            currentStepData.phase === "mismatch" ? "bg-destructive/10 border-destructive/30" :
            "bg-primary/10 border-primary/30"
          }`}>
            {currentStepData.phase === "match" || currentStepData.phase === "complete" ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : currentStepData.phase === "mismatch" ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Hash className="h-5 w-5 text-primary" />
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
      title="Rabin-Karp Quiz"
      levels={quizLevels}
      backPath="/string-matching/rabin-karp"
      backLabel="Back to Simulator"
      accentColor="primary"
      onQuizComplete={handleQuizComplete}
    />
  );

  const algorithmContent = (
    <CCodeDisplay
      title="C Implementation – Rabin-Karp Algorithm"
      code={`#include <stdio.h>
#include <string.h>

#define d 256
#define q 101

void rabinKarp(char pat[], char txt[]) {
    int M = strlen(pat);
    int N = strlen(txt);
    int i, j;
    int p = 0; // hash for pattern
    int t = 0; // hash for text
    int h = 1;

    for (i = 0; i < M - 1; i++)
        h = (h * d) % q;

    for (i = 0; i < M; i++) {
        p = (d * p + pat[i]) % q;
        t = (d * t + txt[i]) % q;
    }

    for (i = 0; i <= N - M; i++) {
        if (p == t) {
            for (j = 0; j < M; j++) {
                if (txt[i + j] != pat[j])
                    break;
            }
            if (j == M)
                printf("Pattern found at index %d\\n", i);
        }

        if (i < N - M) {
            t = (d * (t - txt[i] * h) + txt[i + M]) % q;
            if (t < 0)
                t += q;
        }
    }
}

int main() {
    char txt[] = "AABAACAADAABAABA";
    char pat[] = "AABA";
    rabinKarp(pat, txt);
    return 0;
}`}
    />
  );

  return (
    <AlgorithmPageLayout
      title="Rabin-Karp Algorithm"
      description="Rolling Hash String Matching"
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

export default RabinKarp;
