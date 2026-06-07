const API_BASE_URL = "http://localhost:5000/api";

/**
 * Wrapper for the native fetch API that automatically injects the JWT token
 * from localStorage into the Authorization header for authenticated backend requests.
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  
  // Set json content type by default unless it's explicitly set or it's a FormData request
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Bearer token
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized/expired token globally
  if (response.status === 401 || response.status === 403) {
    // Optionally trigger a logout event here if needed
    console.warn("Unauthorized API call. Token might be expired.");
  }

  return response;
};

/**
 * Update progress for a specific algorithm section.
 * @param algorithmId - The ID of the algorithm in the database
 * @param section - One of: 'theory_completed', 'simulation_completed', 'quiz_completed', 'quiz_score'
 * @param value - The value to set (true/false for completed, number for quiz_score)
 */
export const updateProgress = async (
  algorithmId: number,
  section: string,
  value: boolean | number
): Promise<void> => {
  try {
    await fetchApi("/progress/update", {
      method: "POST",
      body: JSON.stringify({ algorithmId, section, value }),
    });
  } catch (error) {
    console.error("Failed to update progress:", error);
  }
};
