
import React from 'react';

interface ReviewOutputProps {
  review: string;
  isLoading: boolean;
  error: string | null;
  text: {
    reviewTitle: string;
  };
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="h-6 bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="h-5 bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
        </div>
    </div>
);

const FormattedReview: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    return (
        <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300">
          {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-semibold text-white mt-6 mb-2 border-b border-gray-600 pb-1">{trimmedLine.substring(4)}</h3>;
            }
            if (trimmedLine.startsWith('#### ')) {
              return <h4 key={index} className="text-lg font-semibold text-indigo-400 mt-4 mb-1">{trimmedLine.substring(5)}</h4>;
            }
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
              return <li key={index} className="ml-5 list-disc">{trimmedLine.substring(2)}</li>;
            }
            if (trimmedLine === '') {
              return null;
            }
            return <p key={index}>{trimmedLine}</p>;
          })}
        </div>
    );
};


export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, text }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4">{text.reviewTitle}</h2>
      <div className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-4 overflow-y-auto">
        {isLoading && <LoadingSkeleton />}
        {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
        {!isLoading && !error && review && <FormattedReview content={review} />}
        {!isLoading && !error && !review && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Your analysis report will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
