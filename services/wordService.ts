import * as docx from 'docx';
import { saveAs } from 'file-saver';

/**
 * Converts Markdown-like text (returned from Gemini) into a proper DOCX file.
 */
export const createAndDownloadDocx = async (formattedText: string, filename: string) => {
  const lines = formattedText.split('\n');
  const children: docx.Paragraph[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      // Heading 1
      children.push(new docx.Paragraph({
        text: line.replace('# ', ''),
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { after: 200, before: 200 },
        bidirectional: true, // Important for Arabic
      }));
    } else if (line.startsWith('## ')) {
      // Heading 2
      children.push(new docx.Paragraph({
        text: line.replace('## ', ''),
        heading: docx.HeadingLevel.HEADING_2,
        spacing: { after: 150, before: 150 },
        bidirectional: true,
      }));
    } else if (line.startsWith('### ')) {
      // Heading 3
      children.push(new docx.Paragraph({
        text: line.replace('### ', ''),
        heading: docx.HeadingLevel.HEADING_3,
        spacing: { after: 120, before: 120 },
        bidirectional: true,
      }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet point
      children.push(new docx.Paragraph({
        text: line.replace(/^[-*] /, ''),
        bullet: { level: 0 },
        bidirectional: true,
      }));
    } else {
      // Normal Paragraph
      children.push(new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: line,
            size: 24, // 12pt
            font: "Times New Roman", // Good standard font
          })
        ],
        spacing: { after: 120 },
        alignment: docx.AlignmentType.BOTH, // Justified
        bidirectional: true,
      }));
    }
  }

  const doc = new docx.Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await docx.Packer.toBlob(doc);
  saveAs(blob, filename.replace('.pdf', '.docx'));
};