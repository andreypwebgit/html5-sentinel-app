import React, { useState, useCallback, useRef } from 'react';
import type { CodeFile } from '../types';

interface CodeInputProps {
  files: CodeFile[];
  onFilesChange: (files: CodeFile[]) => void;
  onReview: () => void;
  isLoading: boolean;
  text: {
    buttonText: string;
    buttonLoadingText: string;
    uploadAreaTitle: string;
    uploadAreaSubtitle: string;
    filesToReview: string;
    clearAll: string;
  };
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const UploadIcon: React.FC = () => (
    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const FileItem: React.FC<{ file: CodeFile; onRemove: (name: string) => void }> = ({ file, onRemove }) => (
    <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md text-sm">
        <span className="font-mono text-gray-300 truncate pr-2">{file.name}</span>
        <button onClick={() => onRemove(file.name)} className="text-gray-400 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);

export const CodeInput: React.FC<CodeInputProps> = ({ files, onFilesChange, onReview, isLoading, text }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((fileList: FileList) => {
        const filePromises: Promise<CodeFile>[] = [];
        const newFiles: CodeFile[] = [...files];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!newFiles.some(f => f.name === file.name)) {
                filePromises.push(
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve({ name: file.name, content: e.target?.result as string });
                        reader.onerror = (e) => reject(e);
                        reader.readAsText(file);
                    })
                );
            }
        }
        
        Promise.all(filePromises).then(results => {
            onFilesChange([...newFiles, ...results]);
        }).catch(err => console.error("Error reading files:", err));

    }, [files, onFilesChange]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        // Reset input to allow selecting the same file again
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveFile = (name: string) => {
        onFilesChange(files.filter(f => f.name !== name));
    };

    const handleClearAll = () => {
        onFilesChange([]);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
            {files.length === 0 ? (
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`flex flex-col justify-center items-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                >
                    <div className="text-center">
                        <UploadIcon />
                        <p className="mt-2 text-lg font-semibold text-gray-300">{text.uploadAreaTitle}</p>
                        <p className="mt-1 text-sm text-gray-500">{text.uploadAreaSubtitle}</p>
                    </div>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-300">{text.filesToReview} ({files.length})</h3>
                        <button onClick={handleClearAll} className="text-sm text-indigo-400 hover:text-indigo-300">{text.clearAll}</button>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 p-3 bg-gray-900 border border-gray-700 rounded-md">
                        {files.map(file => <FileItem key={file.name} file={file} onRemove={handleRemoveFile} />)}
                    </div>
                </div>
            )}
            <button
                onClick={onReview}
                disabled={isLoading || files.length === 0}
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
