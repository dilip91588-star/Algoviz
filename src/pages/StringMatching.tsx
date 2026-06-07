import { Search } from "lucide-react";
import CategoryPageLayout from "@/components/layout/CategoryPageLayout";

const StringMatching = () => {
  const algorithms = [
    {
      name: "Naive String Matching",
      path: "/string-matching/naive",
      description: "Brute-force approach that slides the pattern one position at a time",
      timeComplexity: "O(n×m) worst",
      spaceComplexity: "O(1)",
    },
    {
      name: "Rabin-Karp Algorithm",
      path: "/string-matching/rabin-karp",
      description: "Uses hashing to find pattern matches with rolling hash for efficiency",
      timeComplexity: "O(n+m) avg",
      spaceComplexity: "O(1)",
    },
  ];

  const introduction = (
    <p>
      <strong className="text-foreground">String Matching</strong> algorithms find occurrences of a 
      pattern string within a larger text string. These algorithms are fundamental in text editors, 
      search engines, DNA sequence analysis, and data mining.
    </p>
  );

  return (
    <CategoryPageLayout
      title="String Matching"
      subtitle="Pattern Matching Algorithms"
      icon={Search}
      iconColor="primary"
      introduction={introduction}
      algorithms={algorithms}
      ctaText="Explore Naive Matching"
      ctaPath="/string-matching/naive"
    />
  );
};

export default StringMatching;
