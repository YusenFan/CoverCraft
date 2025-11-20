import { CoverLetterState, GeneratedResult } from "../types";

export const generateCoverLetter = async (state: CoverLetterState): Promise<GeneratedResult> => {
  try {
    // Call the Vercel serverless API route instead of OpenAI directly
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("OpenAI generation error:", error);
    throw error;
  }
};
