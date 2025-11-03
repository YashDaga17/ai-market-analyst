// Dynamically import pdfjs-dist to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configure worker - use local worker file from public folder
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }
  return pdfjsLib;
}

export interface PDFExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  metadata?: any;
}

/**
 * Extract text from a PDF file with progress tracking
 * @param file - PDF file or URL
 * @param onProgress - Optional callback for progress updates
 * @returns Extracted text and metadata
 */
export async function extractTextFromPDF(
  file: File | string,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  try {
    const pdfjs = await getPdfJs();
    
    // Load the PDF document
    const loadingTask = typeof file === 'string' 
      ? pdfjs.getDocument(file)
      : pdfjs.getDocument(await file.arrayBuffer());
    
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    
    // Extract text from all pages
    const textPromises: Promise<string>[] = [];
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pagePromise = pdf.getPage(pageNum).then(async (page) => {
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Report progress
        if (onProgress) {
          onProgress({
            currentPage: pageNum,
            totalPages,
            percentage: Math.round((pageNum / totalPages) * 100)
          });
        }
        
        return pageText;
      });
      
      textPromises.push(pagePromise);
    }
    
    // Wait for all pages to be processed
    const pageTexts = await Promise.all(textPromises);
    const fullText = pageTexts.join('\n\n');
    
    // Get metadata
    const metadata = await pdf.getMetadata();
    
    return {
      text: fullText,
      pageCount: totalPages,
      metadata: metadata.info
    };
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from PDF in chunks for better memory management with large files
 * @param file - PDF file
 * @param chunkSize - Number of pages to process at once
 * @param onProgress - Optional callback for progress updates
 * @returns Extracted text and metadata
 */
export async function extractTextFromLargePDF(
  file: File,
  chunkSize: number = 10,
  onProgress?: (progress: PDFExtractionProgress) => void
): Promise<PDFExtractionResult> {
  try {
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument(await file.arrayBuffer());
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    
    let fullText = '';
    
    // Process pages in chunks
    for (let startPage = 1; startPage <= totalPages; startPage += chunkSize) {
      const endPage = Math.min(startPage + chunkSize - 1, totalPages);
      const chunkPromises: Promise<string>[] = [];
      
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const pagePromise = pdf.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          // Report progress
          if (onProgress) {
            onProgress({
              currentPage: pageNum,
              totalPages,
              percentage: Math.round((pageNum / totalPages) * 100)
            });
          }
          
          return pageText;
        });
        
        chunkPromises.push(pagePromise);
      }
      
      const chunkTexts = await Promise.all(chunkPromises);
      fullText += chunkTexts.join('\n\n') + '\n\n';
    }
    
    const metadata = await pdf.getMetadata();
    
    return {
      text: fullText.trim(),
      pageCount: totalPages,
      metadata: metadata.info
    };
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
