
import React from 'react';

interface FooterProps {
  text: string;
}

export const Footer: React.FC<FooterProps> = ({ text }) => {
  return (
    <footer className="bg-gray-800/50 border-t border-gray-700 mt-auto">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
        <p>{text}</p>
      </div>
    </footer>
  );
};
