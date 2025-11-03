'use client';

import { Loader2, Upload } from 'lucide-react';
import { useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { extractTextFromLargePDF, PDFExtractionProgress } from '@/lib/pdf-extractor';

interface PDFUploadProps {
  onTextExtracted: (text: string, metadata?: any) => void;
  onError?: (error: string) => void;
}

export function PDFUpload({ onTextExtracted, onError }: PDFUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PDFExtractionProgress | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError?.('Please select a PDF file');
      return;
    }

    console.log(`Starting PDF extraction for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(null);

    try {
      const result = await extractTextFromLargePDF(
        file,
        10, // Process 10 pages at a time
        (progressInfo) => {
          console.log(`Extraction progress: ${progressInfo.percentage}% (page ${progressInfo.currentPage}/${progressInfo.totalPages})`);
          setProgress(progressInfo);
        }
      );

      console.log(`PDF extraction complete: ${result.pageCount} pages, ${result.text.length} characters`);
      
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. The PDF might be image-based or empty.');
      }

      onTextExtracted(result.text, {
        fileName: file.name,
        pageCount: result.pageCount,
        ...result.metadata
      });
    } catch (error: any) {
      console.error('PDF extraction failed:', error);
      onError?.(error.message || 'Failed to extract text from PDF');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isProcessing ? (
              <>
                <Loader2 className="size-10 mb-3 text-gray-400 animate-spin" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Processing PDF...</span>
                </p>
                {progress && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Page {progress.currentPage} of {progress.totalPages}
                  </p>
                )}
              </>
            ) : (
              <>
                <Upload className="size-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF files (Market reports, financial documents)
                </p>
              </>
            )}
          </div>
          <input
            id="pdf-upload"
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>
      </div>

      {isProcessing && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{fileName}</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="w-full" />
        </div>
      )}
    </div>
  );
}
