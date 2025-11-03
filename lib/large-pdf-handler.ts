/**
 * Specialized handler for very large company market data PDFs
 * 
 * This module provides optimized extraction for large market reports,
 * financial documents, and company data that may be 100+ pages.
 */

import { extractTextFromLargePDF } from './pdf-extractor';

export interface LargePDFConfig {
  chunkSize?: number; // Pages to process at once (default: 10)
  maxFileSize?: number; // Max file size in MB (default: 50)
  onProgress?: (progress: { percentage: number; currentPage: number; totalPages: number }) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

/**
 * Extract text from very large market data PDFs with optimized settings
 */
export async function extractLargeMarketDataPDF(
  file: File,
  config: LargePDFConfig = {}
): Promise<{
  text: string;
  pageCount: number;
  metadata?: any;
  processingTime: number;
}> {
  const startTime = Date.now();
  
  // Validate file size
  const maxSize = (config.maxFileSize || 50) * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${config.maxFileSize || 50}MB)`);
  }

  // Determine optimal chunk size based on file size
  let chunkSize = config.chunkSize || 10;
  if (file.size > 20 * 1024 * 1024) { // > 20MB
    chunkSize = 5; // Smaller chunks for very large files
  }

  console.log(`Processing large PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`Using chunk size: ${chunkSize} pages`);

  // Extract with progress tracking
  const result = await extractTextFromLargePDF(
    file,
    chunkSize,
    (progress) => {
      config.onProgress?.(progress);
      
      // Log every 10% progress
      if (progress.percentage % 10 === 0) {
        console.log(`Extraction progress: ${progress.percentage}%`);
      }
    }
  );

  const processingTime = Date.now() - startTime;
  console.log(`Extraction complete in ${(processingTime / 1000).toFixed(2)}s`);
  console.log(`Extracted ${result.text.length} characters from ${result.pageCount} pages`);

  return {
    ...result,
    processingTime
  };
}

/**
 * Extract and split text into manageable sections for processing
 * Useful when the extracted text is too large for a single API call
 */
export function splitTextIntoSections(
  text: string,
  maxSectionLength: number = 10000,
  overlap: number = 500
): string[] {
  const sections: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxSectionLength, text.length);
    sections.push(text.slice(start, end));
    start = end - overlap; // Add overlap to maintain context
  }

  return sections;
}

/**
 * Extract key statistics from market data text
 * Useful for quick insights before full AI analysis
 */
export function extractQuickStats(text: string): {
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number; // in minutes
  hasNumbers: boolean;
  hasCurrency: boolean;
  hasPercentages: boolean;
} {
  const wordCount = text.split(/\s+/).length;
  const characterCount = text.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed

  return {
    wordCount,
    characterCount,
    estimatedReadingTime,
    hasNumbers: /\d+/.test(text),
    hasCurrency: /\$|€|£|¥/.test(text),
    hasPercentages: /%/.test(text)
  };
}

/**
 * Clean and normalize extracted text
 * Removes excessive whitespace, fixes common PDF extraction issues
 */
export function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers (common pattern: "Page 1 of 100")
    .replace(/Page \d+ of \d+/gi, '')
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

/**
 * Example usage for processing a large market report
 */
export async function processLargeMarketReport(
  file: File,
  onProgress?: (status: string, percentage: number) => void
): Promise<{
  cleanedText: string;
  sections: string[];
  stats: ReturnType<typeof extractQuickStats>;
  metadata: any;
}> {
  try {
    // Step 1: Extract text
    onProgress?.('Extracting text from PDF...', 0);
    const result = await extractLargeMarketDataPDF(file, {
      chunkSize: 10,
      maxFileSize: 100, // Allow up to 100MB
      onProgress: (progress) => {
        onProgress?.(`Extracting page ${progress.currentPage} of ${progress.totalPages}`, progress.percentage);
      }
    });

    // Step 2: Clean text
    onProgress?.('Cleaning extracted text...', 90);
    const cleanedText = cleanExtractedText(result.text);

    // Step 3: Split into sections
    onProgress?.('Preparing text sections...', 95);
    const sections = splitTextIntoSections(cleanedText, 8000, 400);

    // Step 4: Extract stats
    const stats = extractQuickStats(cleanedText);

    onProgress?.('Complete!', 100);

    return {
      cleanedText,
      sections,
      stats,
      metadata: {
        ...result.metadata,
        pageCount: result.pageCount,
        processingTime: result.processingTime,
        sectionCount: sections.length
      }
    };
  } catch (error: any) {
    console.error('Failed to process large market report:', error);
    throw new Error(`Processing failed: ${error.message}`);
  }
}

/**
 * Estimate processing time based on file size
 */
export function estimateProcessingTime(fileSizeInBytes: number): {
  estimatedSeconds: number;
  estimatedMinutes: number;
  message: string;
} {
  // Rough estimate: 1MB = 2 seconds
  const estimatedSeconds = Math.ceil((fileSizeInBytes / 1024 / 1024) * 2);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  let message = '';
  if (estimatedSeconds < 10) {
    message = 'This should only take a few seconds';
  } else if (estimatedSeconds < 60) {
    message = `This should take about ${estimatedSeconds} seconds`;
  } else {
    message = `This may take ${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
  }

  return {
    estimatedSeconds,
    estimatedMinutes,
    message
  };
}
