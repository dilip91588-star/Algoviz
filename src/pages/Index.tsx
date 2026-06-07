import { GitGraph, Undo2, Search, Table2 } from "lucide-react";
import CategoryCard from "@/components/home/CategoryCard";
import Layout from "@/components/layout/Layout";

const Index = () => {
  const categories = [
    {
      title: "Greedy Algorithms",
      description:
        "Explore minimum spanning tree algorithms with interactive graph visualization and step-by-step execution.",
      icon: GitGraph,
      path: "/greedy-algorithms",
      algorithms: ["Prim's", "Kruskal's"],
      accentColor: "primary" as const,
    },
    {
      title: "Backtracking",
      description:
        "Visualize constraint satisfaction problems and recursive backtracking on classic puzzles.",
      icon: Undo2,
      path: "/backtracking",
      algorithms: ["N-Queens", "Sum of Subsets"],
      accentColor: "accent" as const,
    },
    {
      title: "String Matching",
      description:
        "Understand pattern matching algorithms with animated text sliding and hash comparisons.",
      icon: Search,
      path: "/string-matching",
      algorithms: ["Rabin-Karp", "Naive String Matching"],
      accentColor: "primary" as const,
    },
    {
      title: "Dynamic Programming",
      description:
        "Master DP techniques through animated table construction and optimal substructure visualization.",
      icon: Table2,
      path: "/dynamic-programming",
      algorithms: ["LCS", "0/1 Knapsack"],
      accentColor: "accent" as const,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Virtual Algorithm Laboratory
          </div>
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-up opacity-0"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <span className="text-gradient-primary">ALGOVIZ</span>
        </h1>

        <p
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 animate-fade-up opacity-0"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          Visualize. Understand. Master Algorithms.
        </p>

        <p
          className="text-muted-foreground max-w-xl mx-auto animate-fade-up opacity-0"
          style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
        >
          Step-by-step algorithm visualization with theory, interactive simulations,
          and quizzes. Built for students to truly understand how algorithms work.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="pb-16">
        <h2
          className="text-2xl font-semibold text-center mb-10 animate-fade-up opacity-0"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          Choose a Module
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.path}
              {...category}
              delay={500 + index * 100}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: "Interactive Visualization",
              description: "Watch algorithms execute step-by-step with smooth animations",
            },
            {
              title: "Theory & Examples",
              description: "Learn the concepts with clear explanations and diagrams",
            },
            {
              title: "Quiz Mode",
              description: "Test your understanding with MCQ quizzes for each algorithm",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="text-center animate-fade-up opacity-0"
              style={{
                animationDelay: `${900 + index * 100}ms`,
                animationFillMode: "forwards",
              }}
            >
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
