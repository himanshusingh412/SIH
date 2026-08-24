import { PdfAdapter, containsPdfRawSyntax, cleanPdfRawSyntax } from '../processors/adapters/pdfAdapter';
import { DocumentProcessor } from '../processors/documentProcessor';
import PDFDocument from 'pdfkit';

async function generateTestPdfBuffer(title: string, bodyContent: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, compress: false });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(bodyContent);
    doc.moveDown();
    doc.text('Target milestone release date: 2026-08-24. Total systems affected: 11 systems.');

    doc.addPage();
    doc.fontSize(16).text('Page 2: Executive Security Debrief', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text('Verification metric target: 99.9% consistency across all generated artifacts.');

    doc.end();
  });
}

async function runPdfExtractionTestSuite() {
  console.log('🧪 Starting PDF Raw-Data Corruption & Extraction Pipeline Test Suite...\n');

  // 1. Test PDF Syntax Detector
  console.log('  Testing PDF Syntax Detector (containsPdfRawSyntax)...');
  const fakeRawPdfSyntax = `/MediaBox [0 0 612 792]\n/Resources << /Font << /F1 5 0 R >> >>\n/ProcSet [/PDF /Text]\nstream\nxRef 0 12\nendstream\nendobj`;
  if (!containsPdfRawSyntax(fakeRawPdfSyntax)) {
    throw new Error('❌ Failed: containsPdfRawSyntax did not detect raw PDF internal tokens');
  }
  console.log('  ✅ PASS: containsPdfRawSyntax correctly detected PDF object syntax');

  // 2. Test PDF Syntax Cleaning Filter
  console.log('  Testing PDF Syntax Cleaning Filter (cleanPdfRawSyntax)...');
  const cleaned = cleanPdfRawSyntax(fakeRawPdfSyntax);
  if (containsPdfRawSyntax(cleaned)) {
    throw new Error('❌ Failed: cleanPdfRawSyntax did not remove PDF object syntax');
  }
  console.log('  ✅ PASS: cleanPdfRawSyntax successfully stripped PDF internal tokens');

  // 3. Test Real PDF Document Text Extraction (PdfAdapter)
  console.log('  Testing Real PDF Document Generation & Extraction (PdfAdapter)...');
  const pdfBuffer = await generateTestPdfBuffer(
    'SIH 2026 Cyber Threat Intelligence & AI Platform Report',
    'Executive Summary: In Q3 2026, Smart India Hackathon introduced the AI Content Transformation Engine.'
  );

  const adapter = new PdfAdapter();
  const extracted = await adapter.extract(pdfBuffer, 'reportlab_test_document.pdf');

  console.log(`     Page Count: ${extracted.pageCount} | Text Length: ${extracted.text.length}`);

  if (containsPdfRawSyntax(extracted.text)) {
    throw new Error('❌ Failed: Extracted PDF text contains raw PDF object syntax');
  }
  if (!extracted.text.includes('Smart India Hackathon') || !extracted.text.includes('11 systems')) {
    throw new Error(`❌ Failed: Extracted text missing expected document content. Got:\n"${extracted.text}"`);
  }
  console.log('  ✅ PASS: PdfAdapter extracted clean, human-readable document text without PDF internals');

  // 4. Test DocumentProcessor Page Chunking & Traceability
  console.log('  Testing DocumentProcessor Page-by-Page Source Paragraph Chunks...');
  const processor = new DocumentProcessor();
  const processed = await processor.processBuffer(pdfBuffer, 'reportlab_test_document.pdf', 'PDF');

  if (!processed.chunks || processed.chunks.length === 0) {
    throw new Error('❌ Failed: DocumentProcessor returned empty chunks');
  }

  const page1Chunk = processed.chunks.find((c) => c.pageNumber === 1);
  const page2Chunk = processed.chunks.find((c) => c.pageNumber === 2);

  if (!page1Chunk || !page2Chunk) {
    console.log('     Chunks found:', processed.chunks.map(c => `Page ${c.pageNumber}: ${c.text.slice(0,30)}`));
    throw new Error('❌ Failed: Chunks missing page-by-page mapping for Page 1 & Page 2');
  }

  console.log(`  ✅ PASS: Source traceability chunks mapped cleanly (Page 1: "${page1Chunk.text.slice(0, 35)}...", Page 2: "${page2Chunk.text.slice(0, 35)}...")`);

  console.log('\n🎉 ALL PDF EXTRACTION & PIPELINE TESTS PASSED SUCCESSFULLY!\n');
}

runPdfExtractionTestSuite().catch((err) => {
  console.error('❌ PDF Test Suite Failed:', err);
  process.exit(1);
});
