/**
 * Deliverable content parsers for Server FormatEngine.
 */

export interface Slide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes?: string;
  visualPrompt?: string;
}

export interface InfographicMetric {
  label: string;
  value: string;
}

export interface InfographicCallout {
  title: string;
  text: string;
}

export interface InfographicLayout {
  header: { title: string; subtitle?: string };
  heroMetrics: InfographicMetric[];
  sectionCallouts: InfographicCallout[];
  footerNotes?: string;
}

export interface VideoScene {
  sceneNumber: number;
  title?: string;
  timecode?: string;
  visual?: string;
  voiceover?: string;
  onScreenText?: string;
}

export interface VideoPackage {
  title: string;
  targetDurationSeconds?: number;
  storyboard: VideoScene[];
  callToAction?: string;
}

const MAX_BULLETS_PER_SLIDE = 6;

export function safeJson(raw: string | null | undefined): any | null {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw.replace(/```(?:json)?/gi, '').trim();
  if (!stripped.startsWith('{') && !stripped.startsWith('[')) return null;
  try {
    return JSON.parse(stripped);
  } catch {
    try {
      return JSON.parse(stripped.replace(/,\s*([\]}])/g, '$1'));
    } catch {
      return null;
    }
  }
}

export function stripInline(text: string): string {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const isBullet = (line: string) => /^\s*(?:[-*•‣]|\d+[.)])\s+/.test(line);
const stripBullet = (line: string) => line.replace(/^\s*(?:[-*•‣]|\d+[.)])\s+/, '').trim();
const isHeading = (line: string) => /^\s{0,3}#{1,6}\s+/.test(line);
const headingLevel = (line: string) => (line.match(/^\s{0,3}(#{1,6})\s+/)?.[1].length ?? 0);
const headingText = (line: string) => line.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/#+\s*$/, '').trim();
const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line: string) => /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

export function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => stripInline(c));
}

interface Section {
  title: string;
  level: number;
  lines: string[];
}

function splitSections(markdown: string): { docTitle?: string; sections: Section[] } {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const headings = lines
    .map((line, index) => ({ index, line }))
    .filter((entry) => isHeading(entry.line))
    .map((entry) => ({ ...entry, level: headingLevel(entry.line) }));

  let docTitle: string | undefined;
  let candidates = headings;

  const topLevel = headings.length ? Math.min(...headings.map((h) => h.level)) : 0;
  const topLevelCount = headings.filter((h) => h.level === topLevel).length;
  if (topLevelCount === 1 && headings.length > 1) {
    docTitle = headingText(headings.find((h) => h.level === topLevel)!.line);
    const nextLevel = Math.min(...headings.filter((h) => h.level > topLevel).map((h) => h.level));
    candidates = headings.filter((h) => h.level === nextLevel);
  } else if (headings.length) {
    candidates = headings.filter((h) => h.level === topLevel);
  }

  if (!candidates.length) {
    const byRule = String(markdown || '')
      .split(/\n\s*(?:---|\*\*\*|___)\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
    const chunks = byRule.length > 1 ? byRule : String(markdown || '').split(/\n{2,}/).filter((c) => c.trim());
    return {
      docTitle,
      sections: chunks.map((chunk, i) => {
        const chunkLines = chunk.split('\n');
        const first = stripInline(chunkLines[0] || '');
        const hasTitle =
          chunkLines.length > 1 && first.length > 0 && first.length <= 80 && !isBullet(chunkLines[0]);
        return {
          title: hasTitle ? first : `Section ${i + 1}`,
          level: 2,
          lines: hasTitle ? chunkLines.slice(1) : chunkLines,
        };
      }),
    };
  }

  const sections: Section[] = [];
  candidates.forEach((heading, idx) => {
    const nextHeading = candidates[idx + 1];
    const sectionLines = lines.slice(heading.index + 1, nextHeading ? nextHeading.index : lines.length);
    sections.push({
      title: headingText(heading.line),
      level: heading.level,
      lines: sectionLines,
    });
  });

  return { docTitle, sections };
}

function linesToBullets(lines: string[]): { bullets: string[]; notes: string[] } {
  const bullets: string[] = [];
  const notes: string[] = [];
  let inNotes = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (/^\s*(?:speaker\s*notes?|notes?)\s*:/i.test(trimmed)) {
      inNotes = true;
      const content = trimmed.replace(/^\s*(?:speaker\s*notes?|notes?)\s*:/i, '').trim();
      if (content) notes.push(stripInline(content));
      return;
    }

    if (inNotes) {
      notes.push(stripInline(trimmed));
      return;
    }

    if (isBullet(line)) {
      bullets.push(stripInline(stripBullet(line)));
    } else if (!isHeading(line) && !isTableDivider(line) && !isTableRow(line)) {
      bullets.push(stripInline(trimmed));
    }
  });

  return { bullets, notes };
}

function normalizeSlide(raw: any, index: number): Slide {
  const rawBullets = Array.isArray(raw?.bulletPoints)
    ? raw.bulletPoints
    : Array.isArray(raw?.bullets)
    ? raw.bullets
    : [];

  return {
    slideNumber: Number(raw?.slideNumber) || index + 1,
    title: stripInline(raw?.title || `Slide ${index + 1}`),
    bulletPoints: rawBullets
      .filter((b: any) => b !== null && b !== undefined && String(b).trim())
      .map((b: any) => stripInline(String(b))),
    speakerNotes: raw?.speakerNotes ? stripInline(String(raw.speakerNotes)) : undefined,
    visualPrompt: raw?.visualPrompt ? stripInline(String(raw.visualPrompt)) : undefined,
  };
}

export function parseSlides(content: string | null | undefined): Slide[] {
  if (!content) return [];

  const json = safeJson(content);
  const jsonSlides = Array.isArray(json) ? json : Array.isArray(json?.slides) ? json.slides : null;
  if (jsonSlides && jsonSlides.length) {
    return jsonSlides.map((slide: any, i: number) => normalizeSlide(slide, i));
  }

  const { docTitle, sections } = splitSections(content);
  const slides: Slide[] = [];

  sections.forEach((section) => {
    const { bullets, notes } = linesToBullets(section.lines);
    if (!bullets.length && !notes.length) return;

    for (let offset = 0; offset < Math.max(bullets.length, 1); offset += MAX_BULLETS_PER_SLIDE) {
      const chunk = bullets.slice(offset, offset + MAX_BULLETS_PER_SLIDE);
      slides.push({
        slideNumber: slides.length + 1,
        title: offset === 0 ? stripInline(section.title) : `${stripInline(section.title)} (cont.)`,
        bulletPoints: chunk,
        speakerNotes: offset === 0 && notes.length ? notes.join(' ') : undefined,
      });
    }
  });

  if (!slides.length) return [];

  if (docTitle) {
    slides.unshift({
      slideNumber: 1,
      title: docTitle,
      bulletPoints: slides.slice(0, 3).map((s) => s.title),
      speakerNotes: undefined,
    });
  }

  return slides.map((slide, i) => ({ ...slide, slideNumber: i + 1 }));
}

export function parseInfographic(content: string | null | undefined): InfographicLayout | null {
  if (!content) return null;

  const json = safeJson(content);
  if (json && json.header) {
    return {
      header: {
        title: stripInline(json.header.title || 'Infographic'),
        subtitle: json.header.subtitle ? stripInline(json.header.subtitle) : undefined,
      },
      heroMetrics: (json.heroMetrics || [])
        .filter((m: any) => m && (m.label || m.value))
        .map((m: any) => ({ label: stripInline(m.label || ''), value: stripInline(String(m.value ?? '')) })),
      sectionCallouts: (json.sectionCallouts || [])
        .filter((c: any) => c && (c.title || c.text))
        .map((c: any) => ({ title: stripInline(c.title || ''), text: stripInline(c.text || '') })),
      footerNotes: json.footerNotes ? stripInline(json.footerNotes) : undefined,
    };
  }

  const { docTitle, sections } = splitSections(content);
  const metrics: InfographicMetric[] = [];
  const callouts: InfographicCallout[] = [];
  const seen = new Set<string>();

  const pushMetric = (label: string, value: string) => {
    const cleanLabel = stripInline(label);
    const cleanValue = stripInline(value);
    if (!cleanLabel || !cleanValue) return;
    if (cleanLabel.length > 46 || cleanValue.length > 34) return;
    if (/^(metric|value|item|field|key)$/i.test(cleanLabel)) return;
    const key = `${cleanLabel}|${cleanValue}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    metrics.push({ label: cleanLabel, value: cleanValue });
  };

  sections.forEach((section) => {
    const prose: string[] = [];

    section.lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (isTableDivider(line)) return;

      if (isTableRow(line)) {
        const cells = tableCells(line).filter(Boolean);
        if (cells.length >= 2) pushMetric(cells[0], cells.slice(1).join(' · '));
        return;
      }

      const labelled = trimmed.match(/^\**\s*([^:*]{2,46})\s*:?\**\s*:\s*(.+)$/);
      if (labelled) {
        pushMetric(labelled[1], labelled[2]);
        if (stripInline(labelled[2]).length > 34) {
          prose.push(`${stripInline(labelled[1])}: ${stripInline(labelled[2])}`);
        }
        return;
      }

      const text = stripInline(isBullet(line) ? stripBullet(line) : trimmed);
      if (text) prose.push(text);
    });

    if (prose.length) {
      callouts.push({ title: stripInline(section.title), text: prose.join(' ') });
    }
  });

  if (!metrics.length && !callouts.length) return null;

  return {
    header: {
      title: stripInline(docTitle || sections[0]?.title || 'Infographic Layout'),
      subtitle: metrics.length ? `${metrics.length} fact-locked metrics` : undefined,
    },
    heroMetrics: metrics.slice(0, 8),
    sectionCallouts: callouts,
  };
}

function normalizeScene(raw: any, index: number): VideoScene {
  return {
    sceneNumber: Number(raw?.sceneNumber) || index + 1,
    title: raw?.title ? stripInline(raw.title) : undefined,
    timecode: raw?.timecode ? stripInline(String(raw.timecode)) : undefined,
    visual: raw?.visual ? stripInline(String(raw.visual)) : undefined,
    voiceover: raw?.voiceover ? stripInline(String(raw.voiceover)) : undefined,
    onScreenText: raw?.onScreenText ? stripInline(String(raw.onScreenText)) : undefined,
  };
}

export function parseVideoPackage(content: string | null | undefined): VideoPackage | null {
  if (!content) return null;

  const json = safeJson(content);
  if (json && Array.isArray(json.storyboard) && json.storyboard.length) {
    return {
      title: stripInline(json.title || 'Video Package'),
      targetDurationSeconds: Number(json.targetDurationSeconds) || undefined,
      storyboard: json.storyboard.map((scene: any, i: number) => normalizeScene(scene, i)),
      callToAction: json.callToAction ? stripInline(json.callToAction) : undefined,
    };
  }

  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  const sceneStart = /^\s*(?:#{1,6}\s*)?\**\s*scene\s*#?\s*(\d+)\s*\**\s*(?:\(([^)]*)\))?\s*:?\s*\**\s*(.*)$/i;

  const blocks: Array<{ number: number; timecode?: string; title?: string; lines: string[] }> = [];
  lines.forEach((line) => {
    const match = line.match(sceneStart);
    if (match) {
      blocks.push({
        number: parseInt(match[1], 10),
        timecode: match[2] ? stripInline(match[2]) : undefined,
        title: match[3] ? stripInline(match[3].replace(/^[-–:]\s*/, '')) : undefined,
        lines: [],
      });
    } else if (blocks.length) {
      blocks[blocks.length - 1].lines.push(line);
    }
  });

  if (!blocks.length) return null;

  const field = (body: string[], names: string[]): string | undefined => {
    const pattern = new RegExp(`^\\s*(?:[-*•]\\s*)?\\**\\s*(?:${names.join('|')})\\s*\\**\\s*:\\s*(.+)$`, 'i');
    for (const line of body) {
      const match = line.match(pattern);
      if (match) return stripInline(match[1]);
    }
    return undefined;
  };

  const storyboard: VideoScene[] = blocks.map((block, i) => {
    const visual = field(block.lines, ['visual', 'shot', 'b-roll', 'footage']);
    const voiceover = field(block.lines, ['voiceover', 'voice over', 'vo', 'narration', 'script']);
    const onScreenText = field(block.lines, ['on-screen text', 'on screen text', 'text overlay', 'caption', 'lower third']);
    const leftovers = block.lines
      .filter((l) => l.trim() && !/^\s*(?:[-*•]\s*)?\**\s*(?:visual|shot|b-roll|footage|voiceover|voice over|vo|narration|script|on-screen text|on screen text|text overlay|caption|lower third)\s*\**\s*:/i.test(l))
      .map((l) => stripInline(isBullet(l) ? stripBullet(l) : l))
      .filter(Boolean);

    return {
      sceneNumber: block.number || i + 1,
      title: block.title || undefined,
      timecode: block.timecode,
      visual: visual || (leftovers.length ? leftovers.join(' ') : undefined),
      voiceover,
      onScreenText,
    };
  });

  const titleLine = lines.find((l) => isHeading(l));
  const ctaMatch = content.match(/\**\s*call\s*to\s*action\s*\**\s*:\s*(.+)/i);
  const durationMatch = content.match(/(\d{1,3})\s*(?:-|\s)?\s*second/i);

  return {
    title: stripInline(titleLine ? headingText(titleLine) : 'Video Package'),
    targetDurationSeconds: durationMatch ? parseInt(durationMatch[1], 10) : undefined,
    storyboard,
    callToAction: ctaMatch ? stripInline(ctaMatch[1]) : undefined,
  };
}
