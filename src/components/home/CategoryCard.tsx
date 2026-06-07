import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  algorithms: string[];
  delay?: number;
  accentColor?: "primary" | "accent";
}

const CategoryCard = ({
  title,
  description,
  icon: Icon,
  path,
  algorithms,
  delay = 0,
  accentColor = "primary",
}: CategoryCardProps) => {
  return (
    <Link
      to={path}
      className={cn(
        "group relative block p-6 rounded-2xl border border-border bg-card transition-all duration-300",
        "hover:border-primary/50 hover:shadow-lg hover:-translate-y-1",
        "card-glow animate-fade-up opacity-0"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          accentColor === "primary"
            ? "bg-gradient-to-br from-primary/5 to-transparent"
            : "bg-gradient-to-br from-accent/5 to-transparent"
        )}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
            "group-hover:scale-110",
            accentColor === "primary"
              ? "bg-primary/10 text-primary group-hover:bg-primary/20"
              : "bg-accent/10 text-accent group-hover:bg-accent/20"
          )}
        >
          <Icon className="h-7 w-7" />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {description}
        </p>

        {/* Algorithm Tags */}
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo) => (
            <span
              key={algo}
              className="px-3 py-1 text-xs font-mono bg-secondary rounded-full text-muted-foreground"
            >
              {algo}
            </span>
          ))}
        </div>

        {/* Arrow indicator */}
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <svg
            className={cn(
              "w-5 h-5",
              accentColor === "primary" ? "text-primary" : "text-accent"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
