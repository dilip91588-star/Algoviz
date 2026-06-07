import { Undo2 } from "lucide-react";
import CategoryPageLayout from "@/components/layout/CategoryPageLayout";

const Backtracking = () => {
  const algorithms = [
    {
      name: "N-Queens Problem",
      path: "/backtracking/n-queens",
      description: "Place N queens on an N×N chessboard so that no two queens threaten each other",
      timeComplexity: "O(N!)",
      spaceComplexity: "O(N)",
    },
    {
      name: "Sum of Subsets",
      path: "/backtracking/sum-of-subsets",
      description: "Find all subsets of a set that add up to a given target sum using backtracking",
      timeComplexity: "O(2ᴺ)",
      spaceComplexity: "O(N)",
    },
  ];

  const introduction = (
    <p>
      <strong className="text-foreground">Backtracking</strong> is a general algorithm for finding 
      solutions to constraint satisfaction problems by incrementally building candidates and abandoning 
      a candidate ("backtracking") as soon as it determines the candidate cannot lead to a valid solution.
    </p>
  );

  return (
    <CategoryPageLayout
      title="Backtracking"
      subtitle="Constraint Satisfaction Problems"
      icon={Undo2}
      iconColor="accent"
      introduction={introduction}
      algorithms={algorithms}
      ctaText="Explore N-Queens"
      ctaPath="/backtracking/n-queens"
    />
  );
};

export default Backtracking;
