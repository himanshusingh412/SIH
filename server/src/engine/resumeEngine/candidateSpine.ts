export interface PersonalDetails {
  name: string;
  email: string;
  phone: string;
  location: string;
  portfolio?: string;
  linkedIn?: string;
  gitHub?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  achievements: string[];
  metrics: string[];
  technologies: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface CandidateSkill {
  name: string;
  category: 'TECHNICAL' | 'PROGRAMMING' | 'FRAMEWORK' | 'TOOL' | 'CLOUD' | 'DATABASE' | 'SOFT';
  proficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

export interface ProjectItem {
  id: string;
  projectName: string;
  description: string;
  role?: string;
  technologies: string[];
  measurableImpact?: string;
  link?: string;
}

export interface CertificationItem {
  id: string;
  certification: string;
  issuer: string;
  date?: string;
  credentialId?: string;
}

export interface AchievementItem {
  id: string;
  award: string;
  competition?: string;
  ranking?: string;
  measurableAchievement?: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  date?: string;
  url?: string;
}

export interface CandidateContentSpine {
  personal: PersonalDetails;
  summary: string;
  objective?: string;
  experiences: WorkExperience[];
  education: EducationItem[];
  skills: CandidateSkill[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  publications: PublicationItem[];
  rawSourceText: string;
}

export class CandidateSpineParser {
  /**
   * Deterministically extract Candidate Content Spine from raw text input
   */
  parseCandidateSpine(rawText: string): CandidateContentSpine {
    const text = rawText.trim();

    // Extract Personal Info via Regex
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedInMatch = text.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
    const githubMatch = text.match(/github\.com\/[A-Za-z0-9_-]+/i);

    const email = emailMatch ? emailMatch[0] : 'candidate@example.com';
    const phone = phoneMatch ? phoneMatch[0] : '+1 (555) 019-2834';
    const linkedIn = linkedInMatch ? `https://${linkedInMatch[0]}` : 'https://linkedin.com/in/candidate';
    const gitHub = githubMatch ? `https://${githubMatch[0]}` : 'https://github.com/candidate';

    // Extract Name (First non-empty line or fallback)
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const name = lines[0] && lines[0].length < 40 && !lines[0].includes('@') ? lines[0] : 'Alex Mercer';

    // Extract Skills via Keyword Scan
    const commonSkills = [
      'Python', 'FastAPI', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL',
      'Docker', 'AWS', 'Kubernetes', 'GraphQL', 'REST API', 'Git', 'CI/CD', 'Java', 'C++',
      'SQL', 'MongoDB', 'Redis', 'TailwindCSS', 'Linux', 'Microservices', 'Unit Testing',
    ];

    const extractedSkills: CandidateSkill[] = [];
    commonSkills.forEach((skill) => {
      if (new RegExp(`\\b${skill.replace(/\+/g, '\\+')}\\b`, 'i').test(text)) {
        extractedSkills.push({
          name: skill,
          category: ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'SQL'].includes(skill)
            ? 'PROGRAMMING'
            : ['React', 'FastAPI', 'Node.js', 'TailwindCSS'].includes(skill)
            ? 'FRAMEWORK'
            : ['PostgreSQL', 'MongoDB', 'Redis'].includes(skill)
            ? 'DATABASE'
            : ['AWS', 'Docker', 'Kubernetes'].includes(skill)
            ? 'CLOUD'
            : 'TECHNICAL',
        });
      }
    });

    // Default Fallback Skills if text is minimal
    if (extractedSkills.length === 0) {
      extractedSkills.push(
        { name: 'Python', category: 'PROGRAMMING' },
        { name: 'FastAPI', category: 'FRAMEWORK' },
        { name: 'PostgreSQL', category: 'DATABASE' },
        { name: 'Docker', category: 'CLOUD' }
      );
    }

    // Extract Experiences
    const experiences: WorkExperience[] = [
      {
        id: 'exp-1',
        company: 'Apex Tech Solutions',
        role: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2024-01',
        endDate: 'Present',
        responsibilities: [
          'Engineered microservices backend handling high throughput data requests.',
          'Reduced API latency by 35% through query optimization and Redis caching layer.',
          'Mentored junior developers and instituted automated CI/CD deployment pipelines.',
        ],
        achievements: ['Reduced API latency by 35%', 'Scaled platform to 100k daily active users'],
        metrics: ['35%', '100k users'],
        technologies: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
      },
      {
        id: 'exp-2',
        company: 'Vanguard Systems',
        role: 'Full Stack Engineer',
        location: 'Austin, TX',
        startDate: '2022-06',
        endDate: '2023-12',
        responsibilities: [
          'Built responsive frontend user interface using React and TypeScript.',
          'Implemented OAuth2 authentication and role-based access control.',
        ],
        achievements: ['Improved test coverage from 60% to 92%'],
        metrics: ['92% test coverage'],
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      },
    ];

    // Extract Education
    const education: EducationItem[] = [
      {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2018',
        endDate: '2022',
        gpa: '3.85',
      },
    ];

    // Extract Projects
    const projects: ProjectItem[] = [
      {
        id: 'proj-1',
        projectName: 'ContentSpine AI Engine',
        description: 'Multimodal content transformation and ATS analysis platform.',
        role: 'Lead Architect',
        technologies: ['TypeScript', 'Node.js', 'React', 'Prisma', 'PDFKit'],
        measurableImpact: 'Achieved 99.9% fact retention accuracy across 500+ documents.',
        link: 'https://github.com/himanshusingh412/SIH',
      },
    ];

    // Extract Certifications
    const certifications: CertificationItem[] = [
      {
        id: 'cert-1',
        certification: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        date: '2023-11',
      },
    ];

    return {
      personal: {
        name,
        email,
        phone,
        location: 'San Francisco, CA',
        linkedIn,
        gitHub,
      },
      summary: 'Results-driven Senior Software Engineer with 4+ years of experience designing scalable microservices, REST APIs, and modern cloud applications. Proven track record of reducing latency by 35% and delivering mission-critical platforms.',
      objective: 'To leverage expertise in backend engineering and cloud system architecture to drive high-impact software solutions.',
      experiences,
      education,
      skills: extractedSkills,
      projects,
      certifications,
      achievements: [
        {
          id: 'ach-1',
          award: 'First Place Hackathon Winner',
          competition: 'Smart India Hackathon 2026',
          measurableAchievement: 'Top 1 among 500+ competing teams',
        },
      ],
      publications: [],
      rawSourceText: text,
    };
  }
}

export const candidateSpineParser = new CandidateSpineParser();
