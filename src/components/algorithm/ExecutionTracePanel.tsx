import { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo } from "lucide-react";

interface ExecutionTracePanelProps {
  steps: string[];
  currentStepIndex: number;
  title?: string;
  categoryColor?: "primary" | "accent";
}

const ExecutionTracePanel = ({
  steps,
  currentStepIndex,
  title = "Step-by-Step Trace",
  categoryColor = "primary",
}: ExecutionTracePanelProps) => {
  const activeStepRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStepRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeStepRef.current;
      
      const containerHeight = container.clientHeight;
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.clientHeight;

      container.scrollTo({
        top: elementTop - containerHeight / 2 + elementHeight / 2,
        behavior: "smooth",
      });
    }
  }, [currentStepIndex]);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center gap-2 space-y-0">
        <ListTodo className={cn("h-5 w-5", categoryColor === "primary" ? "text-primary" : "text-accent")} />
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative overflow-y-auto max-h-[260px] pr-2 space-y-2 scrollbar-thin"
        >
          {steps.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Start the simulation to generate steps.
            </p>
          ) : (
            steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeStepRef : null}
                  className={cn(
                    "p-3 rounded-lg border text-sm transition-all duration-300 flex items-start gap-3",
                    isActive
                      ? categoryColor === "primary"
                        ? "bg-primary/10 border-primary text-foreground font-medium shadow-sm ring-1 ring-primary/20"
                        : "bg-accent/10 border-accent text-foreground font-medium shadow-sm ring-1 ring-accent/20"
                      : isPast
                      ? "bg-secondary/40 border-border/70 text-muted-foreground opacity-70"
                      : "bg-transparent border-dashed border-border text-muted-foreground/40"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5",
                      isActive
                        ? categoryColor === "primary"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-accent text-accent-foreground font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    Step {idx + 1}
                  </span>
                  <div className="leading-relaxed break-words">{step}</div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionTracePanel;
