
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

const renderWithBold = (text: string, key: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <React.Fragment key={key}>
            {parts.map((part, i) => 
                part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                    part
                )
            )}
        </React.Fragment>
    );
};

const FormattedReview: React.FC<{ content: string }> = ({ content }) => {
    const blocks = content.split(/(```[\s\S]*?```|####\s.*|###\s.*)/g).filter(Boolean);

    return (
        <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 space-y-4">
            {blocks.map((block, index) => {
                const blockKey = `block-${index}`;
                
                if (block.startsWith('```')) {
                    const code = block.replace(/```/g, '').trim();
                    return (
                        <pre key={blockKey} className="bg-gray-900/70 border border-gray-700 rounded-md p-4 text-sm overflow-x-auto">
                            <code>{code}</code>
                        </pre>
                    );
                }

                if (block.startsWith('### ')) {
                    return <h3 key={blockKey} className="text-xl font-semibold text-white mt-6 mb-2 border-b border-gray-600 pb-1">{renderWithBold(block.substring(4),'h3')}</h3>;
                }

                if (block.startsWith('#### ')) {
                    return <h4 key={blockKey} className="text-lg font-semibold text-indigo-400 mt-4 mb-1">{renderWithBold(block.substring(5), 'h4')}</h4>;
                }

                const lines = block.trim().split('\n').filter(line => line.trim() !== '');
                if (lines.some(line => line.trim().startsWith('* ') || line.trim().startsWith('- '))) {
                     return (
                        <ul key={blockKey} className="list-disc space-y-1 pl-5">
                            {lines.map((line, lineIndex) => (
                                <li key={lineIndex}>{renderWithBold(line.trim().substring(2), `li-${lineIndex}`)}</li>
                            ))}
                        </ul>
                    );
                }
                
                return (
                    <div key={blockKey}>
                        {lines.map((line, pIndex) => (
                             <p key={pIndex}>{renderWithBold(line, `p-${pIndex}`)}</p>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ review, isLoading, error, text }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4">{text.reviewTitle}</h2>
      <div className="flex-grow bg-gray-900 border border-gray-700 rounded-md p-4 overflow-y-auto">
        {isLoading && !review && !error && <LoadingSkeleton />}
        {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
        {review && <FormattedReview content={review} />}
        {!isLoading && !error && !review && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Your analysis report will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
