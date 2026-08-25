import pdfParse from 'pdf-parse';
import { cleanPdfRawSyntax } from '../../processors/adapters/pdfAdapter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { AIProviderManager } from '../../ai/providerManager';
import { CandidateContentSpine, CandidateSkill, EducationItem, ProjectItem, WorkExperience } from './candidateSpine';
import { callGemini } from '../../utils/geminiCall';

export interface StructuredResumeJSON {
  personalInfo?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
  };
  professionalSummary?: string | null;
  skills?: {
    technical?: string[];
    soft?: string[];
    tools?: string[];
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
    cloud?: string[];
  } | Array<{ name: string; category?: string }>;
  experience?: Array<{
    company?: string;
    jobTitle?: string;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    current?: boolean;
    description?: string | null;
    achievements?: string[];
    technologies?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    grade?: string | null;
  }>;
  projects?: Array<{
    name?: string;
    description?: string | null;
    technologies?: string[];
    url?: string | null;
    achievements?: string[];
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string | null;
    credentialUrl?: string | null;
  }>;
  achievements?: Array<string | { name?: string; award?: string; description?: string }>;
  publications?: Array<any>;
  languages?: string[];
  volunteerExperience?: Array<any>;
  awards?: Array<any>;
}

export class ResumeExtractionService {
  /**
   * Deterministic local text extraction layer (PDF, DOCX, TXT)
   */
  async extractTextLocally(buffer: Buffer, filename: string, mimeType: string): Promise<{ text: string; isScanned: boolean }> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf' || mimeType.includes('pdf')) {
      try {
        const parsed = await pdfParse(buffer);
        const cleaned = cleanPdfRawSyntax(parsed.text || '');
        const readableLength = cleaned.replace(/\[Page \d+\]/g, '').trim().length;

        if (readableLength >= 30) {
          return { text: cleaned, isScanned: false };
        }

        // Try raw text stream parsing if pdfParse returned minimal text
        const rawStr = buffer.toString('utf-8');
        const textBlocks = rawStr.match(/\(([^)]+)\)\s*Tj/g);
        if (textBlocks && textBlocks.length > 5) {
          const extractedStream = textBlocks.map(b => b.replace(/[\(\)]/g, '').replace(/Tj$/, '')).join(' ').trim();
          if (extractedStream.length >= 30) {
            return { text: extractedStream, isScanned: false };
          }
        }

        console.warn(`[ResumeExtractor] PDF text layer minimal (${readableLength} chars). Marking as scanned/image PDF.`);
        return { text: '', isScanned: true };
      } catch (err: any) {
        console.warn(`[ResumeExtractor] pdf-parse failed: ${err.message}. Marking as scanned PDF.`);
        return { text: '', isScanned: true };
      }
    }

    if (ext === 'docx' || ext === 'doc' || mimeType.includes('word') || mimeType.includes('officedocument')) {
      try {
        const rawStr = buffer.toString('utf-8');
        let extracted = '';
        const xmlTextMatches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (xmlTextMatches && xmlTextMatches.length > 0) {
          extracted = xmlTextMatches
            .map((m) => m.replace(/<[^>]+>/g, ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        if (!extracted || extracted.length < 20) {
          extracted = rawStr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        if (!extracted || extracted.length < 20) {
          extracted = buffer.toString('ascii').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        if (extracted && extracted.length >= 30) {
          return { text: extracted, isScanned: false };
        }
      } catch (err: any) {
        console.warn(`[ResumeExtractor] DOCX local extraction warning: ${err.message}`);
      }
      return { text: '', isScanned: false };
    }

    // Default TXT
    const txt = buffer.toString('utf-8').trim();
    return { text: txt, isScanned: false };
  }

  /**
   * Main Layered Pipeline for Resume Ingestion
   */
  async processResumeUpload(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{
    structuredData: StructuredResumeJSON;
    candidateSpine: CandidateContentSpine;
    extractionMethod: 'deterministic_text' | 'ai_text_extraction' | 'ai_vision_multimodal' | 'fallback';
    providerUsed: string;
  }> {
    // 1. Validate file size and format
    if (buffer.length > 20 * 1024 * 1024) {
      throw new Error('This file exceeds the maximum allowed size limit of 20MB.');
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const validExts = ['pdf', 'docx', 'doc', 'txt'];
    if (!validExts.includes(ext) && !mimeType.includes('pdf') && !mimeType.includes('word') && !mimeType.includes('text')) {
      throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT document.');
    }

    // 2. Deterministic local text extraction
    const { text: localText, isScanned } = await this.extractTextLocally(buffer, filename, mimeType);

    // 3. AI Extraction Strategy
    let structuredData: StructuredResumeJSON | null = null;
    let extractionMethod: 'deterministic_text' | 'ai_text_extraction' | 'ai_vision_multimodal' | 'fallback' = 'ai_text_extraction';
    let providerUsed = 'Gemini';

    const apiKey = config.aiApiKey || config.geminiApiKey || process.env.AI_API_KEY;

    if (apiKey) {
      try {
        if (isScanned && (ext === 'pdf' || mimeType.includes('pdf') || mimeType.includes('image'))) {
          console.log(`[ResumeExtractor] Processing scanned/image PDF via Gemini Multimodal Vision API...`);
          structuredData = await this.extractViaGeminiMultimodal(buffer, mimeType, apiKey);
          extractionMethod = 'ai_vision_multimodal';
        } else if (localText && localText.length >= 30) {
          console.log(`[ResumeExtractor] Processing text resume via AI Extraction Engine...`);
          structuredData = await this.extractViaAI(localText, apiKey);
          extractionMethod = 'ai_text_extraction';
        } else {
          console.log(`[ResumeExtractor] Local text short. Attempting multimodal inline document extraction...`);
          structuredData = await this.extractViaGeminiMultimodal(buffer, mimeType || 'application/pdf', apiKey);
          extractionMethod = 'ai_vision_multimodal';
        }
      } catch (aiErr: any) {
        console.warn(`[ResumeExtractor] Primary AI extraction notice (${aiErr.message}). Attempting ProviderManager fallback.`);
      }
    }

    // 4. Multi-provider AI Fallback (OpenAI / Bedrock) if primary Gemini failed
    if (!structuredData && localText && localText.length >= 30) {
      try {
        const textResult = await AIProviderManager.generateOutput(
          { summary: localText, entities: [], dates: [], numbers: [], locations: [], events: [], risks: [], recommendations: [], claims: [], relationships: [], factLocks: [] },
          'EXECUTIVE_SUMMARY',
          'TECHNICAL',
          'OPENAI'
        );
        if (textResult && textResult.content) {
          structuredData = this.parseJSONResponse(textResult.content);
          extractionMethod = 'ai_text_extraction';
          providerUsed = textResult.provider;
        }
      } catch {}
    }

    // 5. Deterministic text parser fallback if AI unavailable
    if (!structuredData && localText && localText.length >= 20) {
      console.log(`[ResumeExtractor] Parsing via deterministic CandidateSpine fallback...`);
      structuredData = this.parseLocalTextToSchema(localText);
      extractionMethod = 'deterministic_text';
      providerUsed = 'Deterministic Local Engine';
    }

    // 6. Last resort clean fallback (NEVER use filename as candidate name)
    if (!structuredData) {
      structuredData = {
        personalInfo: { fullName: null, email: null, phone: null, location: null },
        professionalSummary: 'Resume imported from uploaded document.',
        skills: { technical: [] },
        experience: [],
        education: [],
        projects: [],
      };
      extractionMethod = 'fallback';
      providerUsed = 'Default System Fallback';
    }

    // 7. Normalize JSON to strictly remove filename pollution
    structuredData = this.sanitizeStructuredData(structuredData, filename);

    // 8. Convert Structured Resume JSON into CandidateContentSpine
    const candidateSpine = this.convertToCandidateSpine(structuredData, localText);

    return {
      structuredData,
      candidateSpine,
      extractionMethod,
      providerUsed,
    };
  }

  /**
   * Sanitize & Normalize Structured Resume JSON to guarantee filename is never candidate name
   */
  private sanitizeStructuredData(data: StructuredResumeJSON, filename: string): StructuredResumeJSON {
    const cleanName = (name: string | null | undefined): string | null => {
      if (!name) return null;
      const lower = name.toLowerCase();
      const baseFilename = filename.replace(/\.[^/.]+$/, '').toLowerCase();
      if (
        lower === baseFilename ||
        lower.includes('resume-template') ||
        lower.includes('security-guard') ||
        lower.includes('scaled-') ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.txt') ||
        lower === 'candidate profile' ||
        lower === 'uploaded_resume'
      ) {
        return null;
      }
      return name;
    };

    if (data.personalInfo) {
      data.personalInfo.fullName = cleanName(data.personalInfo.fullName);
    }

    return data;
  }

  /**
   * Extract resume profile from plain text using Gemini or OpenAI fallback
   */
  private async extractViaAI(text: string, apiKey: string): Promise<StructuredResumeJSON> {
    const prompt = `${this.getSystemPrompt()}

Raw Resume Text:
${text.slice(0, 10000)}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = config.aiModel || 'gemini-3.1-flash-lite';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await callGemini(() => model.generateContent(prompt), 'Resume text extraction');
    const resText = result.response.text();
    return this.parseJSONResponse(resText);
  }

  /**
   * Extract resume profile from scanned PDF / Image buffer via Gemini Multimodal API
   */
  private async extractViaGeminiMultimodal(buffer: Buffer, mimeType: string, apiKey: string): Promise<StructuredResumeJSON> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = config.aiModel || 'gemini-3.1-flash-lite';
    const model = genAI.getGenerativeModel({ model: modelName });

    const inlinePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: mimeType && mimeType.includes('/') ? mimeType : 'application/pdf',
      },
    };

    const prompt = `${this.getSystemPrompt()}

Please analyze the attached document pages and extract all candidate information into strict JSON.`;

    const result = await callGemini(
      () => model.generateContent([prompt, inlinePart]),
      'Resume multimodal extraction'
    );
    const resText = result.response.text();
    return this.parseJSONResponse(resText);
  }

  private parseJSONResponse(text: string): StructuredResumeJSON {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse valid JSON from AI extraction output.');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      const repaired = jsonMatch[0]
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      return JSON.parse(repaired);
    }
  }

  private getSystemPrompt(): string {
    return `SYSTEM ROLE:
You are a professional, highly accurate resume parser.
Read the ENTIRE uploaded resume document.
Extract ONLY information explicitly present in the resume.
Do not infer or invent information.
Do NOT use the filename as a candidate name.

Return ONLY valid raw JSON with NO markdown code block formatting matching this exact schema:
{
  "personalInfo": {
    "fullName": "Candidate Full Name or null",
    "email": "email@example.com or null",
    "phone": "phone or null",
    "location": "City, State or null",
    "linkedin": "URL or null",
    "github": "URL or null",
    "portfolio": "URL or null"
  },
  "professionalSummary": "Full text summary or null",
  "skills": {
    "technical": ["Skill 1"],
    "soft": ["Skill 2"],
    "tools": ["Tool 1"],
    "languages": ["Lang 1"],
    "frameworks": ["Framework 1"],
    "databases": ["DB 1"],
    "cloud": ["Cloud 1"]
  },
  "experience": [
    {
      "company": "Company Name",
      "jobTitle": "Job Title",
      "location": "Location or null",
      "startDate": "YYYY-MM or YYYY or null",
      "endDate": "YYYY-MM or Present or null",
      "current": false,
      "description": "Responsibility summary",
      "achievements": ["Achievement 1"],
      "technologies": ["Tech 1"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree Name",
      "field": "Field of Study or null",
      "startDate": "YYYY or null",
      "endDate": "YYYY or null",
      "grade": "GPA or grade or null"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "technologies": ["Tech 1"],
      "url": "URL or null",
      "achievements": ["Impact summary"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM or null",
      "credentialUrl": "URL or null"
    }
  ],
  "achievements": ["Award 1"],
  "publications": [],
  "languages": []
}`;
  }

  /**
   * Deterministic local text fallback parser (NO hardcoded filename data)
   */
  private parseLocalTextToSchema(text: string): StructuredResumeJSON {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedInMatch = text.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
    const githubMatch = text.match(/github\.com\/[A-Za-z0-9_-]+/i);

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const nameLine = lines[0] && lines[0].length < 40 && !lines[0].includes('@') && !lines[0].toLowerCase().includes('resume') ? lines[0] : null;

    const commonSkills = [
      'Python', 'FastAPI', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL',
      'Docker', 'AWS', 'Kubernetes', 'GraphQL', 'REST API', 'Git', 'CI/CD', 'Java', 'C++',
      'SQL', 'MongoDB', 'Redis', 'TailwindCSS', 'Linux', 'Microservices', 'HTML', 'CSS',
    ];

    const foundSkills: string[] = [];
    commonSkills.forEach((sk) => {
      if (new RegExp(`\\b${sk.replace(/\+/g, '\\+')}\\b`, 'i').test(text)) {
        foundSkills.push(sk);
      }
    });

    const expBlocks: Array<{ company: string; jobTitle: string; achievements: string[] }> = [];
    let inExp = false;
    let currentCompany = '';
    let currentTitle = '';

    lines.forEach((line) => {
      if (/WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT/i.test(line)) {
        inExp = true;
        return;
      }
      if (inExp && /EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS/i.test(line)) {
        inExp = false;
      }
      if (inExp) {
        if (line.includes('|') || line.includes('–') || line.includes('-') || /Engineer|Developer|Manager|Architect|Lead/i.test(line)) {
          const parts = line.split(/[|–-]/).map((p) => p.trim());
          if (parts.length >= 2) {
            currentTitle = parts[0];
            currentCompany = parts[1];
          } else {
            currentTitle = line;
          }

          if (currentCompany || currentTitle) {
            expBlocks.push({
              company: currentCompany || 'Company',
              jobTitle: currentTitle || 'Role',
              achievements: [],
            });
          }
        } else if (line.startsWith('-') || line.startsWith('•')) {
          if (expBlocks.length > 0) {
            expBlocks[expBlocks.length - 1].achievements.push(line.replace(/^[-•]\s*/, ''));
          }
        }
      }
    });

    return {
      personalInfo: {
        fullName: nameLine,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        location: null,
        linkedin: linkedInMatch ? `https://${linkedInMatch[0]}` : null,
        github: githubMatch ? `https://${githubMatch[0]}` : null,
        portfolio: null,
      },
      professionalSummary: lines.slice(1, 4).join(' ') || null,
      skills: {
        technical: foundSkills,
      },
      experience: expBlocks,
      education: [],
      projects: [],
      certifications: [],
      achievements: [],
    };
  }

  /**
   * Normalize StructuredResumeJSON into CandidateContentSpine for state & DB storage
   */
  convertToCandidateSpine(data: StructuredResumeJSON, rawSourceText = ''): CandidateContentSpine {
    const info = data.personalInfo || {};

    const skillsList: CandidateSkill[] = [];

    if (data.skills) {
      if (Array.isArray(data.skills)) {
        data.skills.forEach((s: any) => {
          if (typeof s === 'string') {
            skillsList.push({ name: s, category: 'TECHNICAL' });
          } else if (s && s.name) {
            skillsList.push({ name: s.name, category: (s.category as any) || 'TECHNICAL' });
          }
        });
      } else {
        const categories: Array<keyof typeof data.skills> = ['technical', 'soft', 'tools', 'languages', 'frameworks', 'databases', 'cloud'];
        categories.forEach((cat) => {
          const list = (data.skills as any)[cat];
          if (Array.isArray(list)) {
            list.forEach((item: string) => {
              const upperCat =
                cat === 'frameworks'
                  ? 'FRAMEWORK'
                  : cat === 'databases'
                  ? 'DATABASE'
                  : cat === 'cloud'
                  ? 'CLOUD'
                  : cat === 'languages'
                  ? 'PROGRAMMING'
                  : cat === 'tools'
                  ? 'TOOL'
                  : cat === 'soft'
                  ? 'SOFT'
                  : 'TECHNICAL';

              skillsList.push({ name: item, category: upperCat as any });
            });
          }
        });
      }
    }

    const experiences: WorkExperience[] = (data.experience || []).map((exp, idx) => {
      const achievements = exp.achievements || [];
      const metrics = achievements
        .flatMap((ach) => ach.match(/\b\d+(?:%|\s*k|\s*M|\s*users|\s*ms)?\b/gi) || [])
        .filter(Boolean);

      return {
        id: `exp-${idx + 1}`,
        company: exp.company || 'Company',
        role: exp.jobTitle || 'Role',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.current ? 'Present' : exp.endDate || '',
        responsibilities: exp.description ? [exp.description] : achievements,
        achievements,
        metrics,
        technologies: exp.technologies || [],
      };
    });

    const education: EducationItem[] = (data.education || []).map((edu, idx) => ({
      id: `edu-${idx + 1}`,
      institution: edu.institution || 'University',
      degree: edu.degree || 'Degree',
      field: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.grade || '',
    }));

    const projects: ProjectItem[] = (data.projects || []).map((proj, idx) => ({
      id: `proj-${idx + 1}`,
      projectName: proj.name || 'Project',
      description: proj.description || '',
      technologies: proj.technologies || [],
      measurableImpact: (proj.achievements || []).join('; '),
      link: proj.url || '',
    }));

    const certifications = (data.certifications || []).map((cert, idx) => ({
      id: `cert-${idx + 1}`,
      certification: cert.name || 'Certification',
      issuer: cert.issuer || '',
      date: cert.date || '',
      credentialId: cert.credentialUrl || '',
    }));

    const achievements = (data.achievements || []).map((ach, idx) => ({
      id: `ach-${idx + 1}`,
      award: typeof ach === 'string' ? ach : ach.award || ach.name || 'Achievement',
      description: typeof ach === 'object' ? ach.description : undefined,
    }));

    return {
      personal: {
        name: info.fullName || 'Candidate Profile',
        email: info.email || '',
        phone: info.phone || '',
        location: info.location || '',
        linkedIn: info.linkedin || '',
        gitHub: info.github || '',
        portfolio: info.portfolio || '',
      },
      summary: data.professionalSummary || '',
      experiences,
      education,
      skills: skillsList,
      projects,
      certifications,
      achievements,
      publications: (data.publications || []).map((pub: any, idx: number) => ({
        id: `pub-${idx + 1}`,
        title: typeof pub === 'string' ? pub : pub.title || 'Publication',
        publisher: typeof pub === 'object' ? pub.publisher || '' : '',
      })),
      rawSourceText,
    };
  }
}

export const resumeExtractionService = new ResumeExtractionService();
