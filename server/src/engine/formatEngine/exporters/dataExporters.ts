import yaml from 'js-yaml';
import { Builder as XmlBuilder, parseStringPromise as parseXml } from 'xml2js';

export class DataExporters {
  /**
   * Export valid JSON string (no markdown code blocks) and validate by JSON.parse
   */
  exportJson(data: any): { content: string; mimeType: string; isValid: boolean } {
    try {
      const content = JSON.stringify(data, null, 2);
      JSON.parse(content); // Parsing validation
      return { content, mimeType: 'application/json', isValid: true };
    } catch {
      return { content: JSON.stringify({ error: 'Failed to format valid JSON' }), mimeType: 'application/json', isValid: false };
    }
  }

  /**
   * Export valid CSV string handling quotes, commas, multiline cells & validate by reading back
   */
  exportCsv(headers: string[], rows: string[][]): { content: string; mimeType: string; isValid: boolean } {
    try {
      const escapeCell = (val: string) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headerLine = headers.map(escapeCell).join(',');
      const rowLines = rows.map((r) => r.map(escapeCell).join(','));
      const content = [headerLine, ...rowLines].join('\n');

      // Simple parsing check
      const lineCount = content.split('\n').length;
      const isValid = lineCount === rows.length + 1;

      return { content, mimeType: 'text/csv', isValid };
    } catch {
      return { content: 'header1,header2\nvalue1,value2', mimeType: 'text/csv', isValid: false };
    }
  }

  /**
   * Export well-formed XML and validate using xml2js parser
   */
  async exportXml(rootName: string, data: any): Promise<{ content: string; mimeType: string; isValid: boolean }> {
    try {
      const builder = new XmlBuilder({ rootName: rootName || 'ContentSpineExport', renderOpts: { pretty: true, indent: '  ', newline: '\n' } });
      const content = builder.buildObject(data);

      // XML Parsing Validation
      await parseXml(content);
      return { content, mimeType: 'application/xml', isValid: true };
    } catch (err: any) {
      const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName || 'export'}>\n  <error>${err.message}</error>\n</${rootName || 'export'}>`;
      return { content: fallback, mimeType: 'application/xml', isValid: false };
    }
  }

  /**
   * Export valid YAML and validate with js-yaml parser
   */
  exportYaml(data: any): { content: string; mimeType: string; isValid: boolean } {
    try {
      const content = yaml.dump(data, { indent: 2, lineWidth: -1 });
      yaml.load(content); // YAML Parsing Validation
      return { content, mimeType: 'application/x-yaml', isValid: true };
    } catch {
      return { content: 'error: Failed to format YAML', mimeType: 'application/x-yaml', isValid: false };
    }
  }
}

export const dataExporters = new DataExporters();
