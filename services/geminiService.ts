
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

    let isTruncated = false;

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
                errorText = response.statusText || errorText;
            }
            throw new Error(errorText);
        }

        if (!response.body) {
            throw new Error("Response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            // Check for the truncation marker
            const truncationMarker = '__STREAM_TRUNCATED__';
            if (buffer.includes(truncationMarker)) {
                isTruncated = true;
                buffer = buffer.replace(truncationMarker, '');
            }
            
            onChunk(buffer);
            buffer = ''; // Clear buffer after processing
        }
        
        // Final check for any remaining content in buffer
        if (buffer) {
           if (buffer.includes('__STREAM_TRUNCATED__')) {
                isTruncated = true;
                buffer = buffer.replace('__STREAM_TRUNCATED__', '');
            }
            onChunk(buffer);
        }


    } catch (error) {
        console.error("Error calling review function:", error);
        if (error instanceof Error) {
            onError(new Error(`Error during analysis: ${error.message}`));
        } else {
            onError(new Error("An unknown error occurred during analysis."));
        }
    } finally {
        onFinish(isTruncated);
    }
};
