import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw,
  Trophy, Play, GraduationCap, Brain, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MCQQuestion {
  type?: "mcq";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface InputQuestion {
  type: "input";
  question: string;
  correctAnswer: string;
  explanation: string;
  placeholder?: string;
  caseSensitive?: boolean;
}

export type QuizQuestion = MCQQuestion | InputQuestion;

export interface LeveledQuestions {
  foundation: MCQQuestion[];
  advanced: MCQQuestion[];
  mastery: QuizQuestion[];
}

interface QuizContainerProps {
  title: string;
  questions?: MCQQuestion[];  // legacy support
  levels?: LeveledQuestions;
  backPath: string;
  backLabel: string;
  accentColor?: "primary" | "accent";
  onQuizComplete?: (score: number, total: number) => void;
}

type Level = "foundation" | "advanced" | "mastery";

const LEVEL_META: Record<Level, { label: string; icon: typeof GraduationCap; description: string; color: string }> = {
  foundation: { label: "Foundation", icon: GraduationCap, description: "Basic concepts & definitions", color: "text-emerald-400" },
  advanced: { label: "Advanced", icon: Brain, description: "Conceptual & logical depth", color: "text-blue-400" },
  mastery: { label: "Mastery", icon: Flame, description: "Tracing, problem solving & analysis", color: "text-amber-400" },
};

const QuizContainer = ({
  title,
  questions: legacyQuestions,
  levels,
  backPath,
  backLabel,
  accentColor = "primary",
  onQuizComplete,
}: QuizContainerProps) => {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [submitted, setSubmitted] = useState(false);

  const buttonVariant = accentColor === "primary" ? "glow" : "accent";

  // Build level data from legacy or new format
  const levelData: LeveledQuestions | null = levels ?? (legacyQuestions ? {
    foundation: legacyQuestions.slice(0, 5),
    advanced: legacyQuestions.slice(5, 10),
    mastery: legacyQuestions.slice(10, 15),
  } : null);

  const currentQuestions: QuizQuestion[] = selectedLevel && levelData
    ? levelData[selectedLevel]
    : [];

  const totalQuestions = currentQuestions.length;

  const getCorrectAnswer = (q: QuizQuestion) => {
    if (q.type === "input") return q.correctAnswer;
    return (q as MCQQuestion).correctAnswer;
  };

  const isCorrect = (idx: number) => {
    const q = currentQuestions[idx];
    const a = answers[idx];
    if (a === undefined) return false;
    if (q.type === "input") {
      const correct = q.correctAnswer.trim();
      const given = String(a).trim();
      return q.caseSensitive ? given === correct : given.toLowerCase() === correct.toLowerCase();
    }
    return a === (q as MCQQuestion).correctAnswer;
  };

  const score = currentQuestions.reduce((s, _, i) => s + (isCorrect(i) ? 1 : 0), 0);
  const allAnswered = currentQuestions.every((_, i) => answers[i] !== undefined && answers[i] !== "");

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
    setStarted(false);
  };

  const switchLevel = (level: Level) => {
    setSelectedLevel(level);
    resetQuiz();
  };

  // Level selection screen
  if (!selectedLevel) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-8">Choose a difficulty level to begin.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["foundation", "advanced", "mastery"] as Level[]).map((level) => {
              const meta = LEVEL_META[level];
              const Icon = meta.icon;
              return (
                <button
                  key={level}
                  onClick={() => switchLevel(level)}
                  className="group bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 rounded-xl p-6 text-left transition-all duration-200 hover:scale-[1.02]"
                >
                  <Icon className={cn("h-8 w-8 mb-3", meta.color)} />
                  <h3 className="font-semibold text-foreground mb-1">{meta.label}</h3>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">5 Questions</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const meta = LEVEL_META[selectedLevel];

  // Start screen for selected level
  if (!started) {
    const Icon = meta.icon;
    return (
      <div className="max-w-2xl mx-auto">
        <LevelTabs selected={selectedLevel} onSelect={switchLevel} />
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-up">
          <Icon className={cn("h-12 w-12 mx-auto mb-4", meta.color)} />
          <h2 className="text-2xl font-bold mb-2">{meta.label} Level</h2>
          <p className="text-muted-foreground mb-6">{meta.description} — {totalQuestions} questions</p>
          {selectedLevel === "mastery" && (
            <p className="text-xs text-muted-foreground mb-4">Includes 3 MCQs and 2 input-based questions</p>
          )}
          <Button variant={buttonVariant} size="lg" onClick={() => setStarted(true)}>
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Results screen
  if (submitted) {
    const pct = (score / totalQuestions) * 100;

    const getQuizFeedback = (percentage: number): { message: string; color: string; bgColor: string; borderColor: string } => {
      if (percentage === 100) return { message: "🏆 Excellent! You have mastered this algorithm.", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
      if (percentage >= 80) return { message: "🌟 Very Good! You have strong understanding.", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
      if (percentage >= 60) return { message: "👍 Good! Keep practicing to improve further.", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
      if (percentage >= 40) return { message: "📖 Average. You need more practice.", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
      if (percentage >= 20) return { message: "⚠️ Needs Improvement. Revise the concepts.", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
      return { message: "❌ Poor performance. Please revisit the theory.", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" };
    };

    const feedback = getQuizFeedback(pct);

    return (
      <div className="max-w-2xl mx-auto">
        <LevelTabs selected={selectedLevel} onSelect={switchLevel} disabled />
        <div className="bg-card border border-border rounded-2xl p-8 animate-scale-in">
          <div className="text-center mb-6">
            <div className={cn(
              "w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center",
              pct >= 70 ? "bg-emerald-100" : pct >= 40 ? "bg-amber-100" : "bg-red-100"
            )}>
              <Trophy className={cn("h-12 w-12", pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500")} />
            </div>
            <h2 className="text-2xl font-bold mb-1">Quiz Complete!</h2>
            <p className="text-muted-foreground">
              You scored <span className="text-primary font-bold text-xl">{score}/{totalQuestions}</span> in {meta.label} Level
            </p>
          </div>

          {/* Score-based feedback comment */}
          <div className={cn(
            "rounded-xl border p-4 mb-6 text-center",
            feedback.bgColor,
            feedback.borderColor
          )}>
            <p className={cn("text-base font-semibold", feedback.color)}>
              {feedback.message}
            </p>
          </div>

          {/* Review answers */}
          <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
            {currentQuestions.map((q, i) => {
              const correct = isCorrect(i);
              return (
                <div key={i} className={cn(
                  "p-4 rounded-xl border",
                  correct ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    {correct ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  {q.type === "input" ? (
                    <div className="text-xs text-muted-foreground ml-7">
                      <p>Your answer: <span className="text-foreground">{String(answers[i] ?? "")}</span></p>
                      <p>Correct answer: <span className="text-emerald-600">{q.correctAnswer}</span></p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground ml-7">
                      <p>Your answer: <span className="text-foreground">{(q as MCQQuestion).options[answers[i] as number]}</span></p>
                      <p>Correct answer: <span className="text-emerald-600">{(q as MCQQuestion).options[(q as MCQQuestion).correctAnswer]}</span></p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 ml-7">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={resetQuiz}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restart
            </Button>
            <Button variant="outline" onClick={() => { resetQuiz(); setSelectedLevel(null); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> All Levels
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  const q = currentQuestions[currentQuestion];
  const isMCQ = q.type !== "input";

  return (
    <div className="max-w-2xl mx-auto">
      <LevelTabs selected={selectedLevel} onSelect={switchLevel} disabled />

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQuestion + 1} of {totalQuestions}</span>
          <span className={meta.color}>{meta.label}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", accentColor === "primary" ? "bg-primary" : "bg-accent")}
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-card border border-border rounded-2xl p-8 animate-fade-up" key={currentQuestion}>
        <h2 className="text-lg font-semibold mb-6">{q.question}</h2>

        {isMCQ ? (
          <div className="space-y-3">
            {(q as MCQQuestion).options.map((opt, idx) => {
              const selected = answers[currentQuestion] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion]: idx }))}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                    selected && "border-primary bg-primary/10"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            placeholder={(q as InputQuestion).placeholder ?? "Type your answer..."}
            value={String(answers[currentQuestion] ?? "")}
            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
            className="text-base"
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(p => p - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>

          {currentQuestion < totalQuestions - 1 ? (
            <Button
              variant={buttonVariant}
              onClick={() => setCurrentQuestion(p => p + 1)}
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant={buttonVariant}
              disabled={!allAnswered}
              onClick={() => {
                setSubmitted(true);
                if (onQuizComplete) {
                  const finalScore = currentQuestions.reduce((s, _, i) => s + (isCorrect(i) ? 1 : 0), 0);
                  onQuizComplete(finalScore, totalQuestions);
                }
              }}
            >
              Submit
            </Button>
          )}
        </div>

        {!allAnswered && currentQuestion === totalQuestions - 1 && (
          <p className="text-xs text-muted-foreground text-center mt-3">Answer all questions to submit</p>
        )}
      </div>
    </div>
  );
};

// Level tab buttons
const LevelTabs = ({
  selected,
  onSelect,
  disabled,
}: {
  selected: Level;
  onSelect: (l: Level) => void;
  disabled?: boolean;
}) => (
  <div className="flex gap-2 mb-6 justify-center">
    {(["foundation", "advanced", "mastery"] as Level[]).map((level) => {
      const meta = LEVEL_META[level];
      const Icon = meta.icon;
      const active = selected === level;
      return (
        <button
          key={level}
          disabled={disabled}
          onClick={() => onSelect(level)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            active
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground",
            disabled && !active && "opacity-40 cursor-not-allowed"
          )}
        >
          <Icon className={cn("h-4 w-4", active ? meta.color : "")} />
          {meta.label}
        </button>
      );
    })}
  </div>
);

export default QuizContainer;
