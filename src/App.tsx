import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import GreedyAlgorithms from "./pages/GreedyAlgorithms";
import PrimsAlgorithm from "./pages/PrimsAlgorithm";
import KruskalsAlgorithm from "./pages/KruskalsAlgorithm";
import Backtracking from "./pages/Backtracking";
import NQueens from "./pages/NQueens";
import SumOfSubsets from "./pages/SumOfSubsets";
import StringMatching from "./pages/StringMatching";
import RabinKarp from "./pages/RabinKarp";
import NaiveStringMatching from "./pages/NaiveStringMatching";
import DynamicProgramming from "./pages/DynamicProgramming";
import LCS from "./pages/LCS";
import Knapsack from "./pages/Knapsack";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/greedy-algorithms" element={<GreedyAlgorithms />} />
          <Route path="/greedy-algorithms/prims" element={<PrimsAlgorithm />} />
          <Route path="/greedy-algorithms/kruskals" element={<KruskalsAlgorithm />} />
          <Route path="/backtracking" element={<Backtracking />} />
          <Route path="/backtracking/n-queens" element={<NQueens />} />
          <Route path="/backtracking/sum-of-subsets" element={<SumOfSubsets />} />
          <Route path="/string-matching" element={<StringMatching />} />
          <Route path="/string-matching/naive" element={<NaiveStringMatching />} />
          <Route path="/string-matching/rabin-karp" element={<RabinKarp />} />
          <Route path="/dynamic-programming" element={<DynamicProgramming />} />
          <Route path="/dynamic-programming/lcs" element={<LCS />} />
          <Route path="/dynamic-programming/knapsack" element={<Knapsack />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
