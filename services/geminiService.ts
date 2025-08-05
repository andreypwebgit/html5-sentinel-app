import type { Language } from '../types';

export const reviewCode = async (code: string, language: Language): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/reviewCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data.review;
  } catch (error) {
    console.error("Error calling review function:", error);
    if (error instanceof Error) {
        // The error message from the server is already user-friendly.
        return `Error during analysis: ${error.message}`;
    }
    return "An unknown error occurred during analysis.";
  }
};
