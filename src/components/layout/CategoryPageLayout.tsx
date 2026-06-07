import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, ArrowRight, Clock, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "./Layout";

interface Algorithm {
  name: string;
  path: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
}

interface CategoryPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: "primary" | "accent";
  introduction: ReactNode;
  algorithms: Algorithm[];
  ctaText: string;
  ctaPath: string;
}

const CategoryPageLayout = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "primary",
  introduction,
  algorithms,
  ctaText,
  ctaPath,
}: CategoryPageLayoutProps) => {
  const colorClasses = iconColor === "primary" 
    ? "bg-primary/10 text-primary" 
    : "bg-accent/10 text-accent";
  
  const hoverClasses = iconColor === "primary"
    ? "hover:border-primary/50 group-hover:text-primary"
    : "hover:border-accent/50 group-hover:text-accent";

  return (
    <Layout>
      {/* Header */}
      <div className="mb-12 animate-fade-up">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses}`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section 
        className="bg-card border border-border rounded-2xl p-6 mb-8 animate-fade-up" 
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="text-xl font-semibold mb-4">Introduction</h2>
        <div className="text-muted-foreground leading-relaxed">
          {introduction}
        </div>
      </section>

      {/* Algorithms List */}
      <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <h2 className="text-xl font-semibold mb-6">Algorithms</h2>
        <div className="grid gap-4">
          {algorithms.map((algo, index) => (
            <Link
              key={algo.path}
              to={algo.path}
              className={`group block bg-card border border-border rounded-xl p-6 ${hoverClasses} transition-all duration-300 hover:-translate-y-1`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${hoverClasses} transition-colors`}>
                    {algo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {algo.description}
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{algo.timeComplexity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Box className="h-3 w-3" />
                      <span className="font-mono">{algo.spaceComplexity}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className={`h-5 w-5 text-muted-foreground ${hoverClasses} group-hover:translate-x-1 transition-all`} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 flex gap-4 animate-fade-up" style={{ animationDelay: "500ms" }}>
        <Button variant={iconColor === "primary" ? "glow" : "accent"} asChild>
          <Link to={ctaPath}>
            {ctaText}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </section>
    </Layout>
  );
};

export default CategoryPageLayout;
