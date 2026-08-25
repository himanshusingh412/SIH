import React from 'react';
import ReactMarkdown from 'react-markdown';
import { tableCells } from '../utils/deliverableParsers';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type Block = { kind: 'markdown'; text: string } | { kind: 'table'; rows: string[][]; hasHeader: boolean };

const isPipeRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line: string) => /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

/**
 * react-markdown ships CommonMark only, which has no table support — GFM pipe
 * tables collapse into a single run-on paragraph ("| Metric | Value | |:--|:--|").
 * Rather than pulling in remark-gfm, pipe-table blocks are lifted out here and
 * rendered as real tables; everything else still goes through react-markdown.
 */
function splitBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flushMarkdown = () => {
    if (!buffer.length) return;
    const text = buffer.join('\n');
    if (text.trim()) blocks.push({ kind: 'markdown', text });
    buffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];

    // A table is a pipe row immediately followed by a divider row.
    if (isPipeRow(line) && next !== undefined && isDivider(next)) {
      flushMarkdown();
      const rows: string[][] = [tableCells(line)];
      i += 2;
      while (i < lines.length && isPipeRow(lines[i]) && !isDivider(lines[i])) {
        rows.push(tableCells(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', rows, hasHeader: true });
      continue;
    }

    buffer.push(line);
    i++;
  }

  flushMarkdown();
  return blocks;
}

const cellStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderBottom: '1px solid var(--border-color)',
  fontSize: 'var(--font-sm)',
  color: 'var(--text-primary)',
  textAlign: 'left',
  verticalAlign: 'top',
};

const DataTable: React.FC<{ rows: string[][]; hasHeader: boolean }> = ({ rows, hasHeader }) => {
  if (!rows.length) return null;
  const header = hasHeader ? rows[0] : null;
  const body = hasHeader ? rows.slice(1) : rows;
  const columns = Math.max(...rows.map((r) => r.length));

  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
        }}
      >
        {header && (
          <thead>
            <tr style={{ background: 'var(--pink-50, rgba(110,27,56,0.06))' }}>
              {Array.from({ length: columns }).map((_, c) => (
                <th
                  key={c}
                  scope="col"
                  style={{ ...cellStyle, fontWeight: 800, color: 'var(--burgundy-900)', whiteSpace: 'nowrap' }}
                >
                  {header[c] || ''}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} style={cellStyle}>
                  {row[c] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Hook must run before any early return (rules of hooks).
  const blocks = React.useMemo(() => (content ? splitBlocks(content) : []), [content]);

  if (!content) return null;

  return (
    <div className={`markdown-body ${className}`}>
      {blocks.map((block, i) =>
        block.kind === 'table' ? (
          <DataTable key={i} rows={block.rows} hasHeader={block.hasHeader} />
        ) : (
          <ReactMarkdown key={i}>{block.text}</ReactMarkdown>
        )
      )}
    </div>
  );
};
