
import React from 'react';
import type { Language } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  title: string;
  subtitle: string;
}

const CodeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, title, subtitle }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-md border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
             <CodeIcon />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>
          <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
        </div>
      </div>
    </header>
  );
};
