/**
 * Client-side PDF raw syntax detector and sanitizer to guarantee zero PDF object leakage in UI
 */

const PDF_SYNTAX_PATTERNS = [
  /\/MediaBox/i,
  /\/Resources/i,
  /\/ProcSet/i,
  /\/Font\b/i,
  /\bendobj\b/i,
  /\bendstream\b/i,
  /\bxref\b/i,
  /\btrailer\b/i,
  /\/Type\s*\/Page/i,
  /\/Length\s+\d+/i,
  /\bstream\r?\n/i,
];

export function isRawPdfSyntax(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  let matches = 0;
  for (const pattern of PDF_SYNTAX_PATTERNS) {
    if (pattern.test(text)) matches++;
  }
  return matches >= 2;
}

export function cleanPdfText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\/MediaBox\s*\[[^\]]*\]/gi, '')
    .replace(/\/Resources\s*<<[^>]*>>/gi, '')
    .replace(/\/ProcSet\s*\[[^\]]*\]/gi, '')
    .replace(/\/Font\s*<<[^>]*>>/gi, '')
    .replace(/\/Type\s*\/[A-Za-z0-9]+/gi, '')
    .replace(/\/Length\s+\d+/gi, '')
    .replace(/\/Filter\s*\/[A-Za-z0-9]+/gi, '')
    .replace(/\bstream[\s\S]*?endstream\b/gi, '')
    .replace(/\b\d+\s+\d+\s+obj[\s\S]*?endobj\b/gi, '')
    .replace(/\bxref[\s\S]*?trailer\b/gi, '')
    .replace(/\bstartxref[\s\S]*?%%EOF\b/gi, '')
    .replace(/<<\s*\/[A-Za-z0-9]+\s+[^>]*>>/gi, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
