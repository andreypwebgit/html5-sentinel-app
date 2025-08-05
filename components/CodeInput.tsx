
import React from 'react';

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  onReview: () => void;
  isLoading: boolean;
  text: {
    inputLabel: string;
    buttonText: string;
    buttonLoadingText: string;
    placeholder: string;
  };
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const CodeInput: React.FC<CodeInputProps> = ({ code, onCodeChange, onReview, isLoading, text }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <label htmlFor="codeInput" className="block text-sm font-medium text-gray-300 mb-2">
        {text.inputLabel}
      </label>
      <textarea
        id="codeInput"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        placeholder={text.placeholder}
        className="flex-grow w-full p-4 bg-gray-900 border border-gray-700 rounded-md text-gray-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
        spellCheck="false"
      />
      <button
        onClick={onReview}
        disabled={isLoading || !code.trim()}
        className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            {text.buttonLoadingText}
          </>
        ) : (
          text.buttonText
        )}
      </button>
    </div>
  );
};
