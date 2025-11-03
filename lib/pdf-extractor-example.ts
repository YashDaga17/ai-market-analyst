/**
 * Example usage of the PDF text extractor
 * 
 * This file demonstrates how to use the pdf.js-based text extraction
 * for both small and large PDF files.
 */

import { extractTextFromPDF, extractTextFromLargePDF } from './pdf-extractor';

// Example 1: Extract text from a small PDF with progress tracking
export async function extractSmallPDF(file: File) {
  try {
    const result = await extractTextFromPDF(file, (progress) => {
      console.log(`Processing page ${progress.currentPage} of ${progress.totalPages} (${progress.percentage}%)`);
    });

    console.log('Extraction complete!');
    console.log('Total pages:', result.pageCount);
    console.log('Text length:', result.text.length);
    console.log('Metadata:', result.metadata);

    return result.text;
  } catch (error) {
    console.error('Failed to extract PDF:', error);
    throw error;
  }
}

// Example 2: Extract text from a large PDF (processes in chunks)
export async function extractLargePDF(file: File) {
  try {
    // Process 10 pages at a time to manage memory
    const result = await extractTextFromLargePDF(file, 10, (progress) => {
      console.log(`Processing: ${progress.percentage}% complete`);
    });

    console.log('Large PDF extraction complete!');
    console.log('Total pages:', result.pageCount);
    console.log('Text length:', result.text.length);

    return result.text;
  } catch (error) {
    console.error('Failed to extract large PDF:', error);
    throw error;
  }
}

// Example 3: Extract from URL (useful for remote PDFs)
export async function extractFromURL(pdfUrl: string) {
  try {
    const result = await extractTextFromPDF(pdfUrl, (progress) => {
      console.log(`Downloading and processing: ${progress.percentage}%`);
    });

    return result.text;
  } catch (error) {
    console.error('Failed to extract PDF from URL:', error);
    throw error;
  }
}

// Example 4: Use in a React component
/*
import { useState } from 'react';
import { extractTextFromLargePDF } from '@/lib/pdf-extractor';

function MyComponent() {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');

  const handleFileUpload = async (file: File) => {
    const result = await extractTextFromLargePDF(
      file,
      10,
      (progressInfo) => {
        setProgress(progressInfo.percentage);
      }
    );
    
    setText(result.text);
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }} />
      {progress > 0 && <progress value={progress} max={100} />}
      {text && <pre>{text}</pre>}
    </div>
  );
}
*/
