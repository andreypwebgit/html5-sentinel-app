
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
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
            throw new Error(errorData.error || 'Unknown server error');
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to get stream reader.');
        }

        const decoder = new TextDecoder();
        let isTruncated = false;
        const truncationMarker = '__STREAM_TRUNCATED__';
        const errorMarker = 'STREAM_ERROR: ';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            let chunkText = decoder.decode(value, { stream: true });

            // Handle in-stream errors sent from the serverless function
            if (chunkText.startsWith(errorMarker)) {
                const errorMessage = chunkText.substring(errorMarker.length);
                onError(new Error(errorMessage));
                reader.cancel(); // Stop reading from the stream
                return; // Exit the function
            }

            // Check for the truncation marker. It's sent at the very end.
            if (chunkText.includes(truncationMarker)) {
                isTruncated = true;
                // Remove the marker so it's not displayed
                chunkText = chunkText.replace(truncationMarker, '');
            }

            if (chunkText) {
                onChunk(chunkText);
            }
        }

        onFinish(isTruncated);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        onError(new Error(errorMessage));
        onFinish(false); // Ensure onFinish is always called
    }
};
