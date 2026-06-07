import Layout from "@/components/layout/Layout";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AlgorithmProgress {
  algorithm_id: number;
  algorithm_name: string;
  algorithm_type: string;
  theory_completed: boolean;
  simulation_completed: boolean;
  quiz_completed: boolean;
}

const ProgressPage = () => {
  const { isAuthenticated } = useAuth();
  const [progressData, setProgressData] = useState<AlgorithmProgress[]>([]);
  const [overall, setOverall] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProgress = async () => {
      try {
        setLoading(true);
        // Fetch specific user progress for algorithms
        const progressRes = await fetchApi("/progress");
        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgressData(data);
        }

        // Fetch overall completion percentage
        const overallRes = await fetchApi("/progress/overall");
        if (overallRes.ok) {
          const data = await overallRes.json();
          setOverall(data.percentage || 0);
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [isAuthenticated]);

  // Helper to calculate the completion percentage of a single algorithm
  const calculateAlgoCompletion = (item: AlgorithmProgress) => {
    let completed = 0;
    if (item.theory_completed) completed++;
    if (item.simulation_completed) completed++;
    if (item.quiz_completed) completed++;
    return Math.round((completed / 3) * 100);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <section className="max-w-3xl mx-auto py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">You Must Be Logged In</h1>
          <p className="text-muted-foreground mb-8">Please login to track your ALGOVIZ progress.</p>
          <Button asChild variant="glow"><Link to="/login">Login Now</Link></Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="max-w-3xl mx-auto py-8 px-4">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2 animate-fade-up opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          Your <span className="text-gradient-primary">Progress</span>
        </h1>
        <p
          className="text-muted-foreground mb-8 animate-fade-up opacity-0"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          Track your learning journey across all algorithm modules.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Overall */}
            <div
              className="rounded-xl border border-border bg-card p-6 mb-8 animate-fade-up opacity-0"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Overall Completion</span>
                <span className="text-sm font-mono text-primary">{overall}%</span>
              </div>
              <Progress value={overall} className="h-3" />
            </div>

            {/* Per-algorithm cards */}
            {progressData.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">You haven't started any algorithms yet.</p>
                <p className="text-sm mt-2">Complete a theory, simulation, or quiz to start tracking!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {progressData.map((item, index) => {
                  const completionPercentage = calculateAlgoCompletion(item);
                  return (
                    <div
                      key={item.algorithm_id}
                      className="rounded-xl border border-border bg-card p-5 animate-fade-up opacity-0"
                      style={{
                        animationDelay: `${300 + index * 80}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.algorithm_name}</span>
                        <span className="text-sm font-mono text-primary">{completionPercentage}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{item.algorithm_type}</p>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
};

export default ProgressPage;
