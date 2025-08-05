
import { GoogleGenAI, type Content, type GenerateContentResponse } from "@google/genai";
import type { Context } from "@netlify/functions";

type Language = 'en' | 'es';
interface CodeFile {
  name: string;
  content: string;
}

const MAX_PROMPT_SIZE_BYTES = 500 * 1024; // 500 KB

const getPrompt = (files: CodeFile[], language: Language): string => {
  const lang_prompt = language === 'es' ? 'español' : 'inglés';
  const codeBlocks = files.map(file => `
---
**File: \`${file.name}\`**
\`\`\`
${file.content}
\`\`\`
---
`).join('\n\n');
  return `
You are an expert code reviewer named 'HTML5 Sentinel'. Your sole purpose is to enforce the principles of zero-dependency, high-performance, secure, and SEO-optimized pure HTML5 development. You are bilingual in English and Spanish. Your feedback is direct, actionable, and structured.

Review the following files as a cohesive project. Provide your analysis in structured Markdown format. The entire response MUST be in ${lang_prompt}.

**Files to Review:**
${codeBlocks}

**Review Guidelines (analyze files holistically):**
1.  **Zero-Dependency Rule:** Identify any external CSS or JS frameworks/libraries.
2.  **Performance Rule (Target: PageSpeed ≥95):** Analyze for performance bottlenecks.
3.  **SEO Rule:** Evaluate semantic HTML, metadata, and accessibility.
4.  **Security Rule:** Check for common vulnerabilities.
5.  **AI Compliance (EU AI Act):** Mention transparency obligations.

**Output Format:**
Structure your response with the following Markdown headings: ### Overall Score (out of 100), ### ✅ What's Done Well, ### ⚠️ Areas for Improvement (with sub-categories #### 🚀 Performance, #### 🔍 SEO & Accessibility, #### 🛡️ Security, #### 📄 Code Quality & Semantics), ### 💡 Strategic AI Suggestions (Optional). Use bullet points and fenced code blocks.
`;
};

export default async (request: Request, context: Context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set in Netlify.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { files, language, history } = await request.json();

    const isContinuation = history && Array.isArray(history) && history.length > 0;
    let message: string;
    let chatHistory: Content[] = [];

    if (isContinuation) {
        chatHistory = history;
        message = 'Please continue generating the response from exactly where you left off. Do not repeat anything or add conversational filler.';
    } else {
        if (!files || !Array.isArray(files) || files.length === 0 || !language) {
            return new Response(JSON.stringify({ error: 'Missing files or language for new review.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const totalSize = files.reduce((acc: number, file: CodeFile) => acc + (file.content?.length || 0), 0);
        if (totalSize > MAX_PROMPT_SIZE_BYTES) {
            return new Response(JSON.stringify({ error: `Total file size exceeds ${MAX_PROMPT_SIZE_BYTES / 1024}KB.` }), { status: 413, headers: { 'Content-Type': 'application/json' } });
        }
        message = getPrompt(files, language);
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const chat = ai.chats.create({ model: 'gemini-2.5-flash', history: chatHistory });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                const streamingResponse = await chat.sendMessageStream({ message });
                
                let lastChunk: GenerateContentResponse | undefined;
                for await (const chunk of streamingResponse) {
                    if (chunk.text) {
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                    lastChunk = chunk;
                }
                
                const finishReason = lastChunk?.candidates?.[0]?.finishReason;

                if (finishReason === 'MAX_TOKENS') {
                    controller.enqueue(encoder.encode('__STREAM_TRUNCATED__'));
                }

                controller.close();
            } catch (error) {
                 console.error("Error in stream generation:", error);
                 const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                 const errorChunk = encoder.encode(`STREAM_ERROR: ${errorMessage}`);
                 controller.enqueue(errorChunk);
                 controller.close();
            }
        },
    });
    
    return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: `An internal error occurred: ${errorMessage}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};