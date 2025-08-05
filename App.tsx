
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { Footer } from './components/Footer';
import { reviewCode } from './services/geminiService';
import type { Language } from './types';
import { UI_TEXT } from './constants';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [code, setCode] = useState<string>(UI_TEXT.en.placeholder);
  const [review, setReview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const text = UI_TEXT[language];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if(code === UI_TEXT.en.placeholder) setCode(UI_TEXT.es.placeholder);
    if(code === UI_TEXT.es.placeholder) setCode(UI_TEXT.en.placeholder);
  };

  const handleReview = useCallback(async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setReview('');

    try {
      const result = await reviewCode(code, language);
      setReview(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(`${text.errorTitle}: ${e.message}`);
      } else {
        setError(text.errorTitle);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language, isLoading, text.errorTitle]);
  
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-900 text-gray-100">
      <Header 
        language={language}
        onLanguageChange={handleLanguageChange}
        title={text.title}
        subtitle={text.subtitle}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
          <CodeInput
            code={code}
            onCodeChange={setCode}
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
