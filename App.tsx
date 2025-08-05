import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Footer } from './components/Footer';
import { reviewCodeStream } from './services/geminiService';
import type { Language, CodeFile } from './types';
import { UI_TEXT } from './constants';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [review, setReview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const text = UI_TEXT[language];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleReview = useCallback(async () => {
    if (files.length === 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    setReview('');

    await reviewCodeStream(files, language, {
        onChunk: (chunk) => {
            setReview(prev => prev + chunk);
        },
        onError: (err) => {
            setError(err.message);
        },
        onFinish: () => {
            setIsLoading(false);
        },
    });
  }, [files, language, isLoading]);
  
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
            onFilesChange={setFiles}
            onReview={handleReview}
            isLoading={isLoading}
            text={text}
          />
          <ReviewOutput
            review={review}
            isLoading={isLoading}
            error={error}
            text={text}
          />
        </div>
      </main>
      <Footer text={text.footerText} />
    </div>
  );
}
