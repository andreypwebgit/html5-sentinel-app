
import React from 'react';
import type { Language } from '../types';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ language, onLanguageChange }) => {
  const activeClasses = 'bg-indigo-600 text-white';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  return (
    <div className="flex rounded-md shadow-sm">
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors duration-200 ${language === 'en' ? activeClasses : inactiveClasses}`}
      >
        EN
      </button>
      <button
        onClick={() => onLanguageChange('es')}
        className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors duration-200 ${language === 'es' ? activeClasses : inactiveClasses}`}
      >
        ES
      </button>
    </div>
  );
};
