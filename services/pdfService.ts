import { ExtractedContent } from '../types';

// We assume pdfjsLib is loaded globally via CDN in index.html to avoid build complexities with workers
declare const pdfjsLib: any;

export const extractTextFromPDF = async (file: File): Promise<ExtractedContent> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
            reject(new Error("Empty file"));
            return;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Simple extraction: join items with space. 
          // PDF.js often splits words or lines strangely. 
          // We rely on Gemini later to fix this structure.
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
            
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        resolve({
          rawText: fullText,
          pageCount: totalPages
        });

      } catch (error) {
        console.error("PDF Extraction Error:", error);
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};