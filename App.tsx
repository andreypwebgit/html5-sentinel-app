
import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Footer } from './components/Footer';
import { reviewCodeStream, type ChatContent } from './services/geminiService';
import type { Language, CodeFile } from './types';
import { UI_TEXT } from './constants';

// This helper function constructs the initial prompt. It's duplicated from the
// backend to allow the client to build the initial chat history.
const getInitialUserPrompt = (files: CodeFile[], language: Language): string => {
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


export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [review, setReview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatContent[]>([]);
  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  
  const reviewRef = useRef('');

  const text = UI_TEXT[language];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleReview = useCallback(async () => {
    if (files.length === 0 || isLoading) return;
    
    reviewRef.current = '';
    setIsLoading(true);
    setError(null);
    setReview('');
    setHistory([]);
    setIsTruncated(false);

    await reviewCodeStream({ 
        files, 
        language,
        callbacks: {
            onChunk: (chunk) => {
                reviewRef.current += chunk;
                setReview(reviewRef.current);
            },
            onError: (err) => {
                setError(err.message);
            },
            onFinish: (truncated) => {
                setIsLoading(false);
                setIsTruncated(truncated);
                const userPrompt = getInitialUserPrompt(files, language);
                setHistory([
                    { role: 'user', parts: [{ text: userPrompt }] },
                    { role: 'model', parts: [{ text: reviewRef.current }] },
                ]);
            },
        }
    });
  }, [files, language, isLoading]);

  const handleContinue = useCallback(async () => {
    if (!isTruncated || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsTruncated(false);

    const continueHistory = [
        ...history,
        { role: 'user', parts: [{ text: 'Please continue generating the response from exactly where you left off. Do not repeat anything or add conversational filler.' }] }
    ] as ChatContent[];

    reviewRef.current = ''; // Reset for the new chunk

    await reviewCodeStream({
        history: continueHistory,
        callbacks: {
            onChunk: (chunk) => {
                reviewRef.current += chunk;
                setReview(prev => prev + chunk);
            },
            onError: (err) => {
                setError(err.message);
            },
            onFinish: (truncated) => {
                setIsLoading(false);
                setIsTruncated(truncated);

                // Append the new text to the last model message in history
                const newHistory = [...continueHistory];
                const lastModelMessage = newHistory.find(m => m.role === 'model');
                if (lastModelMessage) {
                    lastModelMessage.parts[0].text += reviewRef.current;
                }
                setHistory(newHistory);
            }
        }
    });
  }, [history, isLoading, isTruncated]);
  
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-900 text-gray-100">
      <Header 
        language={language}
        onLanguageChange={handleLanguageChange}
        title={text.title}
        subtitle={text.subtitle}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-[50vh]">
          <CodeInput
            files={files}
            onFilesChange={(newFiles) => {
                setFiles(newFiles);
                setReview('');
                setError(null);
                setIsTruncated(false);
            }}
            onReview={handleReview}
            isLoading={isLoading}
            text={text}
          />
          <ReviewOutput
            review={review}
            isLoading={isLoading}
            error={error}
            text={text}
            isTruncated={isTruncated}
            onContinue={handleContinue}
          />
        </div>
      </main>
      <Footer text={text.footerText} />
    </div>
  );
}
