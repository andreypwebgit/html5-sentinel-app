
import type { Language, CodeFile } from '../types';

interface StreamCallbacks {
    onChunk: (chunk: string) => void;
    onError: (error: Error) => void;
    onFinish: () => void;
}

export const reviewCodeStream = async (files: CodeFile[], language: Language, callbacks: StreamCallbacks): Promise<void> => {
    const { onChunk, onError, onFinish } = callbacks;
    try {
        const response = await fetch('/.netlify/functions/reviewCode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files, language }),
        });

        if (!response.ok) {
            let errorText = `Request failed with status ${response.status}`;
            try {
                 const errorJson = await response.json();
                 errorText = errorJson.error || errorText;
            } catch(e) {
                // Not a json error, use the status text
                errorText = response.statusText || errorText;
            }
            throw new Error(errorText);
        }

        if (!response.body) {
            throw new Error("Response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            if (chunk.startsWith('STREAM_ERROR:')) {
                const errorMessage = chunk.substring('STREAM_ERROR:'.length);
                throw new Error(errorMessage);
            }
            onChunk(chunk);
        }
    } catch (error) {
        console.error("Error calling review function:", error);
        if (error instanceof Error) {
            onError(new Error(`Error during analysis: ${error.message}`));
        } else {
            onError(new Error("An unknown error occurred during analysis."));
        }
    } finally {
        onFinish();
    }
};
