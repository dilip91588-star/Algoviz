import { Table2 } from "lucide-react";
import CategoryPageLayout from "@/components/layout/CategoryPageLayout";

const DynamicProgramming = () => {
  const algorithms = [
    {
      name: "Longest Common Subsequence (LCS)",
      path: "/dynamic-programming/lcs",
      description: "Find the longest sequence present in both strings in order",
      timeComplexity: "O(m×n)",
      spaceComplexity: "O(m×n)",
    },
    {
      name: "0/1 Knapsack",
      path: "/dynamic-programming/knapsack",
      description: "Maximize value of items in a knapsack with weight constraint",
      timeComplexity: "O(n×W)",
      spaceComplexity: "O(n×W)",
    },
  ];

  const introduction = (
    <p>
      <strong className="text-foreground">Dynamic Programming (DP)</strong> is an optimization technique 
      that solves complex problems by breaking them into overlapping subproblems. It stores solutions 
      to subproblems to avoid redundant computation, using either top-down memoization or bottom-up tabulation.
    </p>
  );

  return (
    <CategoryPageLayout
      title="Dynamic Programming"
      subtitle="Optimization through Subproblems"
      icon={Table2}
      iconColor="accent"
      introduction={introduction}
      algorithms={algorithms}
      ctaText="Start with LCS"
      ctaPath="/dynamic-programming/lcs"
    />
  );
};

export default DynamicProgramming;
