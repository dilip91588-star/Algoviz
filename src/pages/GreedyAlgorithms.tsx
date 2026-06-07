import { GitGraph } from "lucide-react";
import CategoryPageLayout from "@/components/layout/CategoryPageLayout";

// GreedyAlgorithms: Category page for Greedy Algorithm module (Prim's and Kruskal's)
const GreedyAlgorithms = () => {
  const algorithms = [
    {
      name: "Prim's Algorithm",
      path: "/greedy-algorithms/prims",
      description: "Greedy algorithm to find minimum spanning tree starting from any vertex",
      timeComplexity: "O(E log V)",
      spaceComplexity: "O(V)",
    },
    {
      name: "Kruskal's Algorithm",
      path: "/greedy-algorithms/kruskals",
      description: "Edge-based greedy algorithm using Union-Find for MST construction",
      timeComplexity: "O(E log E)",
      spaceComplexity: "O(V)",
    },
  ];

  const introduction = (
    <>
      <p>
        A <strong className="text-foreground">Minimum Spanning Tree (MST)</strong> is a subset of edges 
        in a weighted, undirected, connected graph that connects all vertices with the minimum possible 
        total edge weight, without forming any cycles.
      </p>
      <p className="mt-3">
        MST algorithms are fundamental in network design, including telecommunications, electrical grids, 
        and road networks. They guarantee the minimum cost to connect all nodes while maintaining connectivity.
      </p>
    </>
  );

  return (
    <CategoryPageLayout
      title="Greedy Algorithms"
      subtitle="Minimum Spanning Tree Algorithms"
      icon={GitGraph}
      iconColor="primary"
      introduction={introduction}
      algorithms={algorithms}
      ctaText="Start with Prim's Algorithm"
      ctaPath="/greedy-algorithms/prims"
    />
  );
};

export default GreedyAlgorithms;
