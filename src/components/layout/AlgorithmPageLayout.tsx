import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "./Layout";

interface AlgorithmPageLayoutProps {
  title: string;
  description: string;
  categoryName: string;
  categoryPath: string;
  categoryColor?: "primary" | "accent";
  theoryContent: ReactNode;
  algorithmContent?: ReactNode;
  simulatorContent: ReactNode;
  quizContent?: ReactNode;
  defaultTab?: "theory" | "algorithm" | "simulator" | "quiz";
  onTabChange?: (tab: string) => void;
}

const AlgorithmPageLayout = ({
  title,
  description,
  categoryName,
  categoryPath,
  categoryColor = "primary",
  theoryContent,
  algorithmContent,
  simulatorContent,
  quizContent,
  defaultTab = "simulator",
  onTabChange,
}: AlgorithmPageLayoutProps) => {
  const linkHoverClass = categoryColor === "primary" ? "hover:text-primary" : "hover:text-accent";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to={categoryPath} className={linkHoverClass}>
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-foreground">{title}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue={defaultTab}
          className="animate-fade-up"
          style={{ animationDelay: "100ms" }}
          onValueChange={(value) => {
            if (onTabChange) onTabChange(value);
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="theory">Theory</TabsTrigger>
            {algorithmContent && <TabsTrigger value="algorithm">Algorithm</TabsTrigger>}
            <TabsTrigger value="simulator">Simulator</TabsTrigger>
            {quizContent && <TabsTrigger value="quiz">Quiz</TabsTrigger>}
          </TabsList>

          <TabsContent value="theory" className="space-y-6">
            {theoryContent}
          </TabsContent>

          {algorithmContent && (
            <TabsContent value="algorithm" className="space-y-6">
              {algorithmContent}
            </TabsContent>
          )}

          <TabsContent value="simulator">
            {simulatorContent}
          </TabsContent>

          {quizContent && (
            <TabsContent value="quiz">
              {quizContent}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AlgorithmPageLayout;

