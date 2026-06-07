import { ReactNode } from "react";
import { Clock, Box, LucideIcon } from "lucide-react";

interface TheorySectionProps {
  introduction: ReactNode;
  steps: string[];
  stepsTitle?: string;
  timeComplexity: string;
  timeComplexityNote?: string;
  spaceComplexity: string;
  spaceComplexityNote?: string;
  applications: string[];
  diagram?: ReactNode;
  additionalSections?: ReactNode;
}

const TheorySection = ({
  introduction,
  steps,
  stepsTitle = "Algorithm Steps",
  timeComplexity,
  timeComplexityNote,
  spaceComplexity,
  spaceComplexityNote,
  applications,
  diagram,
  additionalSections,
}: TheorySectionProps) => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Introduction</h2>
        <div className="text-muted-foreground leading-relaxed">
          {introduction}
        </div>
      </div>

      {/* Algorithm Steps */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">{stepsTitle}</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Diagram/Illustration (optional) */}
      {diagram && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Illustration</h2>
          {diagram}
        </div>
      )}

      {/* Complexity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Time Complexity</h3>
          </div>
          <p className="font-mono text-primary text-lg">{timeComplexity}</p>
          {timeComplexityNote && (
            <p className="text-sm text-muted-foreground mt-2">{timeComplexityNote}</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Space Complexity</h3>
          </div>
          <p className="font-mono text-accent text-lg">{spaceComplexity}</p>
          {spaceComplexityNote && (
            <p className="text-sm text-muted-foreground mt-2">{spaceComplexityNote}</p>
          )}
        </div>
      </div>

      {/* Applications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Applications</h2>
        <ul className="grid md:grid-cols-2 gap-3 text-muted-foreground">
          {applications.map((app, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {app}
            </li>
          ))}
        </ul>
      </div>

      {/* Additional Content */}
      {additionalSections}
    </div>
  );
};

export default TheorySection;
