import type { Language, CodeFile } from '../types';

export const reviewCode = async (files: CodeFile[], language: Language): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/reviewCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data.review;
  } catch (error) {
    console.error("Error calling review function:", error);
    if (error instanceof Error) {
        return `Error during analysis: ${error.message}`;
    }
    return "An unknown error occurred during analysis.";
  }
};
