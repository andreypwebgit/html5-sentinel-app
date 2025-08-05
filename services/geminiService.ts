
import type { Language, CodeFile } from '../types';

// The Chat history content structure expected by the Gemini API
export interface ChatContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface StreamCallbacks {
    onChunk: (chunk: string) => void;
    onError: (error: Error) => void;
    onFinish: (isTruncated: boolean) => void;
}

interface ReviewStreamOptions {
    files?: CodeFile[];
    language?: Language;
    history?: ChatContent[];
    callbacks: StreamCallbacks;
}

export const reviewCodeStream = async (options: ReviewStreamOptions): Promise<void> => {
    const { files, language, history, callbacks } = options;
    const { onChunk, onError, onFinish } = callbacks;

    try {
        const body = history && history.length > 0 ? { history } : { files, language };

        const response = await fetch('/.netlify/functions/reviewCode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorText = `Request failed with status ${response.status}`;
            try {
                const errorJson = await response.json();
                errorText = errorJson.error || errorText;
            } catch (e) {
                // Ignore if response is not JSON
                errorText = response.statusText || errorText;
            }
            throw new Error(errorText);
        }

        if (!response.body) {
            throw new Error("Response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponseText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk); // Stream to UI immediately for a live experience
            fullResponseText += chunk; // Accumulate the full response in the background
        }

        const truncationMarker = '__STREAM_TRUNCATED__';
        const isTruncated = fullResponseText.includes(truncationMarker);
        
        // Let the App component handle cleaning the marker from its state.
        // We just report whether the marker was found or not.
        onFinish(isTruncated);

    } catch (error) {
        console.error("Error calling review function:", error);
        if (error instanceof Error) {
            onError(new Error(`Error during analysis: ${error.message}`));
        } else {
            onError(new Error("An unknown error occurred during analysis."));
        }
        // Ensure onFinish is always called to reset loading state etc.
        onFinish(false);
    }
};
