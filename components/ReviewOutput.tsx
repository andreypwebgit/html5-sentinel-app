
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
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const code = part.replace(/```/g, '').trim();
                    return (
                        <pre key={index} className="bg-gray-900/70 border border-gray-700 rounded-md p-4 text-sm overflow-x-auto">
                            <code>{code}</code>
                        </pre>
                    );
                }

                const lines = part.trim().split('\n');
                let isList = false;
                const elements: React.ReactNode[] = [];

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('### ')) {
                        elements.push(<h3 key={`${index}-${i}`} className="text-xl font-semibold text-white mt-6 mb-2 border-b border-gray-600 pb-1">{line.substring(4)}</h3>);
                        isList = false;
                    } else if (line.startsWith('#### ')) {
                        elements.push(<h4 key={`${index}-${i}`} className="text-lg font-semibold text-indigo-400 mt-4 mb-1">{line.substring(5)}</h4>);
                        isList = false;
                    } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        if (!isList) {
                            elements.push(<ul key={`${index}-${i}-ul`} className="list-disc pl-5 space-y-1"></ul>);
                            isList = true;
                        }
                        const listContainer = elements[elements.length - 1] as React.ReactElement;
                        const newChildren = [...React.Children.toArray(listContainer.props.children), <li key={`${index}-${i}`}>{line.substring(2)}</li>];
                        elements[elements.length - 1] = React.cloneElement(listContainer, {}, newChildren);
                    } else if (line) {
                        elements.push(<p key={`${index}-${i}`}>{line}</p>);
                        isList = false;
                    }
                }
                return <React.Fragment key={index}>{elements}</React.Fragment>;
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
