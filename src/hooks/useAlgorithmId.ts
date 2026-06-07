import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

interface Algorithm {
  id: number;
  name: string;
  type: string;
}

// Module-level cache so we only fetch once across all hook instances
let cachedAlgorithms: Algorithm[] | null = null;
let fetchPromise: Promise<Algorithm[]> | null = null;

const fetchAlgorithms = async (): Promise<Algorithm[]> => {
  if (cachedAlgorithms) return cachedAlgorithms;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetchApi("/algorithms");
      if (res.ok) {
        const data = await res.json();
        cachedAlgorithms = data;
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch algorithms:", error);
    }
    return [];
  })();

  return fetchPromise;
};

/**
 * Returns the database ID for a given algorithm name.
 * Fetches the algorithms list once and caches it.
 */
export const useAlgorithmId = (algorithmName: string): number | null => {
  const [algorithmId, setAlgorithmId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchAlgorithms().then((algorithms) => {
      const match = algorithms.find(
        (a) => a.name.toLowerCase() === algorithmName.toLowerCase()
      );
      if (match) {
        setAlgorithmId(match.id);
      }
    });
  }, [algorithmName]);

  return algorithmId;
};
