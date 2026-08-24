export type StylePresetName =
  | 'PROFESSIONAL'
  | 'GOVERNMENT'
  | 'EXECUTIVE'
  | 'TECHNICAL'
  | 'SOCIAL'
  | 'NEWS'
  | 'ACADEMIC'
  | 'MODERN';

export interface StyleConfig {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontSizeTitle: number;
  fontSizeHeading: number;
  fontSizeSubheading: number;
  fontSizeBody: number;
  lineHeight: number;
  useEmojis: boolean;
  bulletChar: string;
}

export const STYLE_PRESETS: Record<StylePresetName, StyleConfig> = {
  PROFESSIONAL: {
    fontFamily: 'Calibri, Arial, sans-serif',
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
    accentColor: '#6366f1',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontSizeTitle: 24,
    fontSizeHeading: 18,
    fontSizeSubheading: 14,
    fontSizeBody: 11,
    lineHeight: 1.5,
    useEmojis: false,
    bulletChar: '•',
  },
  GOVERNMENT: {
    fontFamily: 'Times New Roman, Georgia, serif',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    accentColor: '#0284c7',
    textColor: '#09090b',
    backgroundColor: '#ffffff',
    fontSizeTitle: 22,
    fontSizeHeading: 16,
    fontSizeSubheading: 13,
    fontSizeBody: 11,
    lineHeight: 1.4,
    useEmojis: false,
    bulletChar: '•',
  },
  EXECUTIVE: {
    fontFamily: 'Helvetica, Inter, sans-serif',
    primaryColor: '#111827',
    secondaryColor: '#4b5563',
    accentColor: '#10b981',
    textColor: '#111827',
    backgroundColor: '#ffffff',
    fontSizeTitle: 26,
    fontSizeHeading: 20,
    fontSizeSubheading: 15,
    fontSizeBody: 12,
    lineHeight: 1.6,
    useEmojis: false,
    bulletChar: '—',
  },
  TECHNICAL: {
    fontFamily: 'Consolas, Monaco, monospace',
    primaryColor: '#0f172a',
    secondaryColor: '#2563eb',
    accentColor: '#06b6d4',
    textColor: '#1e293b',
    backgroundColor: '#f8fafc',
    fontSizeTitle: 22,
    fontSizeHeading: 16,
    fontSizeSubheading: 13,
    fontSizeBody: 10.5,
    lineHeight: 1.4,
    useEmojis: false,
    bulletChar: '>',
  },
  SOCIAL: {
    fontFamily: 'Inter, system-ui, sans-serif',
    primaryColor: '#4f46e5',
    secondaryColor: '#818cf8',
    accentColor: '#f43f5e',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontSizeTitle: 20,
    fontSizeHeading: 16,
    fontSizeSubheading: 14,
    fontSizeBody: 12,
    lineHeight: 1.6,
    useEmojis: true,
    bulletChar: '🔹',
  },
  NEWS: {
    fontFamily: 'Georgia, serif',
    primaryColor: '#991b1b',
    secondaryColor: '#dc2626',
    accentColor: '#e11d48',
    textColor: '#111827',
    backgroundColor: '#ffffff',
    fontSizeTitle: 28,
    fontSizeHeading: 20,
    fontSizeSubheading: 15,
    fontSizeBody: 11.5,
    lineHeight: 1.5,
    useEmojis: false,
    bulletChar: '▪',
  },
  ACADEMIC: {
    fontFamily: 'Times New Roman, serif',
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    fontSizeTitle: 22,
    fontSizeHeading: 16,
    fontSizeSubheading: 13,
    fontSizeBody: 11,
    lineHeight: 2.0,
    useEmojis: false,
    bulletChar: '•',
  },
  MODERN: {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    primaryColor: '#6366f1',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    fontSizeTitle: 24,
    fontSizeHeading: 18,
    fontSizeSubheading: 14,
    fontSizeBody: 11.5,
    lineHeight: 1.5,
    useEmojis: true,
    bulletChar: '⚡',
  },
};

export class StyleEngine {
  private currentPreset: StyleConfig;

  constructor(presetName: StylePresetName = 'PROFESSIONAL', customOverrides?: Partial<StyleConfig>) {
    this.currentPreset = {
      ...(STYLE_PRESETS[presetName] || STYLE_PRESETS.PROFESSIONAL),
      ...customOverrides,
    };
  }

  getStyleConfig(): StyleConfig {
    return this.currentPreset;
  }

  setPreset(presetName: StylePresetName) {
    this.currentPreset = { ...STYLE_PRESETS[presetName] };
  }

  overrideStyle(overrides: Partial<StyleConfig>) {
    this.currentPreset = { ...this.currentPreset, ...overrides };
  }
}
