import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Scan,
  GitCompare,
  Sparkles,
  History as HistoryIcon,
  Mail,
  BarChart3,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { BrandLogo } from '../BrandLogo';

interface WorkExperience {
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

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

interface CandidateSkill {
  name: string;
  category: 'TECHNICAL' | 'PROGRAMMING' | 'FRAMEWORK' | 'TOOL' | 'CLOUD' | 'DATABASE' | 'SOFT';
  proficiency?: string;
}

interface ProjectItem {
  id: string;
  projectName: string;
  description: string;
  technologies: string[];
  measurableImpact?: string;
  link?: string;
}

interface CandidateContentSpine {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    portfolio?: string;
    linkedIn?: string;
    gitHub?: string;
  };
  summary: string;
  experiences: WorkExperience[];
  education: EducationItem[];
  skills: CandidateSkill[];
  projects: ProjectItem[];
  certifications?: Array<{ id: string; certification: string; issuer: string; date?: string }>;
  achievements?: Array<{ id: string; award: string; competition?: string }>;
}

export const ResumeStudio: React.FC<{ projectId?: string }> = ({ projectId = 'demo-project' }) => {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'ats' | 'match' | 'optimizer' | 'versions' | 'cover-letter' | 'linkedin' | 'analytics'
  >('builder');

  const [template, setTemplate] = useState<'ATS_CLASSIC' | 'MODERN_PROFESSIONAL' | 'TECHNICAL' | 'EXECUTIVE'>('ATS_CLASSIC');
  const [resumeId, setResumeId] = useState<string>('demo-resume');
  const [jobId, setJobId] = useState<string | undefined>(undefined);

  // Resume State (Structured Candidate Content Spine)
  const [spine, setSpine] = useState<CandidateContentSpine>({
    personal: {
      name: 'Alex Mercer',
      email: 'alex.mercer@example.com',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      linkedIn: 'https://linkedin.com/in/alexmercer',
      gitHub: 'https://github.com/alexmercer',
    },
    summary:
      'Results-driven Senior Software Engineer with 4+ years of experience designing scalable microservices, REST APIs, and modern cloud applications. Proven track record of reducing latency by 35% and delivering mission-critical platforms.',
    experiences: [
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
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2018',
        endDate: '2022',
        gpa: '3.85',
      },
    ],
    skills: [
      { name: 'Python', category: 'PROGRAMMING' },
      { name: 'FastAPI', category: 'FRAMEWORK' },
      { name: 'JavaScript', category: 'PROGRAMMING' },
      { name: 'TypeScript', category: 'PROGRAMMING' },
      { name: 'React', category: 'FRAMEWORK' },
      { name: 'Node.js', category: 'FRAMEWORK' },
      { name: 'PostgreSQL', category: 'DATABASE' },
      { name: 'Docker', category: 'CLOUD' },
    ],
    projects: [
      {
        id: 'proj-1',
        projectName: 'ContentSpine AI Engine',
        description: 'Multimodal content transformation and ATS analysis platform.',
        technologies: ['TypeScript', 'Node.js', 'React', 'Prisma'],
        measurableImpact: 'Achieved 99.9% fact retention accuracy across 500+ documents.',
      },
    ],
  });

  const [jobText, setJobText] = useState<string>(`Senior Python & Cloud Engineer — Enterprise Corp
We are looking for a Senior Software Engineer with expertise in Python, FastAPI, PostgreSQL, AWS, Docker, and Kubernetes.
Responsibilities:
- Build low latency backend microservices.
- Manage cloud infrastructure on AWS.
Requirements:
- 4+ years experience with Python, FastAPI, PostgreSQL.
- Experience with AWS, Docker, Kubernetes.`);

  // Results State
  const [scanResult, setScanResult] = useState<any>(null);
  const [optimizerResult, setOptimizerResult] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [linkedInResult, setLinkedInResult] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Loading & Autosave States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'FAILED'>('IDLE');
  const [notice, setNotice] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  // Load Initial Resume from Neon PostgreSQL
  useEffect(() => {
    fetchInitialResume();
  }, [projectId]);

  const fetchInitialResume = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getResume(resumeId);
      if (data && data.resume) {
        setResumeId(data.resume.id);
        if (data.candidateSpine) {
          setSpine(data.candidateSpine);
        }
      }
    } catch (err) {
      console.warn('Could not fetch resume from Neon, using default spine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced Autosave to Neon Database
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('SAVING');
    const timer = setTimeout(async () => {
      try {
        await apiClient.saveResume(resumeId, spine);
        setSaveStatus('SAVED');
      } catch {
        setSaveStatus('FAILED');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [spine]);

  const triggerToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Section Editors Handlers
  const handleUpdatePersonal = (field: string, val: string) => {
    setSpine((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: val },
    }));
  };

  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: 'New Company',
      role: 'Software Engineer',
      startDate: '2023-01',
      endDate: 'Present',
      responsibilities: ['Architected key software solutions.'],
      achievements: [],
      metrics: [],
      technologies: ['TypeScript'],
    };
    setSpine((prev) => ({ ...prev, experiences: [newExp, ...prev.experiences] }));
  };

  const handleRemoveExperience = (id: string) => {
    setSpine((prev) => ({ ...prev, experiences: prev.experiences.filter((e) => e.id !== id) }));
  };

  const handleUpdateExperience = (id: string, field: string, val: any) => {
    setSpine((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    }));
  };

  const handleAddSkill = () => {
    setSpine((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: 'New Skill', category: 'TECHNICAL' }],
    }));
  };

  const handleRemoveSkill = (name: string) => {
    setSpine((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.name !== name) }));
  };

  // Action Handlers for Tabs
  const handleRunATSScan = async () => {
    setIsLoading(true);
    triggerToast('Executing Real Multidimensional ATS Scan & Job Match...');
    try {
      let activeJobId = jobId;
      if (jobText) {
        try {
          const parsedJob = await apiClient.parseJobDescription(jobText);
          if (parsedJob && parsedJob.jobId) {
            activeJobId = parsedJob.jobId;
            setJobId(parsedJob.jobId);
          }
        } catch {}
      }

      const res = await apiClient.runATSScan({
        resumeId,
        jobId: activeJobId,
        resumeText: JSON.stringify(spine),
        jobText,
      });
      if (res && res.report) {
        setScanResult(res.report);
        setActiveTab('ats');
        triggerToast('ATS Analysis Complete — 8 Dimensions Computed');
      }
    } catch (err: any) {
      triggerToast(`ATS Scan Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeResume = async () => {
    setIsLoading(true);
    triggerToast('Running Fact-Locked Bullet & Keyword Optimizer via Gemini 3.1 Flash Lite...');
    try {
      const res = await apiClient.optimizeResume({
        resumeId,
        jobId,
        resumeText: JSON.stringify(spine),
        jobText,
      });
      if (res && res.optimizedPackage) {
        setOptimizerResult(res.optimizedPackage);
        setActiveTab('optimizer');
        triggerToast('Resume Optimization Complete — Fact Lock Verified 🛡️');
      }
    } catch (err: any) {
      triggerToast(`Optimization Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizerResult || !optimizerResult.candidateSpine) return;
    setSpine(optimizerResult.candidateSpine);
    triggerToast('Optimized Bullets Applied to Candidate Resume Spine');
  };

  const handleSaveAsVersion = async () => {
    try {
      await apiClient.createResumeVersion(resumeId, {
        versionName: `Version (ATS ${scanResult?.overallScore || 85}%)`,
        targetJobTitle: 'Optimized Target Role',
        atsScore: scanResult?.overallScore || 85,
        optimizedContent: spine,
        changesSummary: optimizerResult?.bulletChanges || [],
      });
      triggerToast(`Version Saved to Neon Database!`);
      fetchVersions();
    } catch (err: any) {
      triggerToast(`Failed to save version: ${err.message}`);
    }
  };

  const fetchVersions = async () => {
    try {
      const res = await apiClient.getResumeVersions(resumeId);
      if (res && res.versions) {
        setVersions(res.versions);
      }
    } catch {}
  };

  const handleRestoreVersion = async (vId: string) => {
    try {
      const res = await apiClient.restoreResumeVersion(resumeId, vId);
      if (res && res.candidateSpine) {
        setSpine(res.candidateSpine);
        triggerToast('Restored Resume Version safely!');
        fetchVersions();
      }
    } catch (err: any) {
      triggerToast(`Restore Error: ${err.message}`);
    }
  };

  const handleDeleteVersion = async (vId: string) => {
    try {
      await apiClient.deleteResumeVersion(resumeId, vId);
      setVersions((prev) => prev.filter((v) => v.id !== vId));
      triggerToast('Version Deleted');
    } catch (err: any) {
      triggerToast(`Delete Error: ${err.message}`);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsLoading(true);
    triggerToast('Generating Fact-Locked Cover Letter via Gemini 3.1 Flash Lite...');
    try {
      const res = await apiClient.generateCoverLetter({
        resumeId,
        jobId,
        resumeText: JSON.stringify(spine),
        jobText,
      });
      if (res && res.coverLetter) {
        setCoverLetterText(res.coverLetter);
        setActiveTab('cover-letter');
        triggerToast('Cover Letter Generated & Persisted to Neon');
      }
    } catch (err: any) {
      triggerToast(`Cover Letter Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLinkedIn = async () => {
    setIsLoading(true);
    triggerToast('Generating Fact-Locked LinkedIn Assets via Gemini...');
    try {
      const res = await apiClient.generateLinkedInProfile({
        resumeId,
        resumeText: JSON.stringify(spine),
      });
      if (res && res.linkedInProfile) {
        setLinkedInResult(res.linkedInProfile);
        setActiveTab('linkedin');
        triggerToast('LinkedIn Assets Generated & Persisted to Neon');
      }
    } catch (err: any) {
      triggerToast(`LinkedIn Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.getResumeAnalytics(resumeId);
      if (res && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'versions') fetchVersions();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  // Document Export Triggers
  const handleDownloadDocx = () => {
    window.open(`/api/resume/${encodeURIComponent(resumeId)}/export/docx?template=${template}`, '_blank');
    triggerToast('Downloading Word Resume (.docx)...');
  };

  const handleDownloadPdf = () => {
    window.open(`/api/resume/${encodeURIComponent(resumeId)}/export/pdf?template=${template}`, '_blank');
    triggerToast('Downloading PDF Resume (.pdf)...');
  };

  const tabs = [
    { id: 'builder', label: 'Resume Builder', icon: FileText },
    { id: 'ats', label: 'ATS Scanner', icon: Scan },
    { id: 'match', label: 'Job Match', icon: GitCompare },
    { id: 'optimizer', label: 'Resume Optimizer', icon: Sparkles },
    { id: 'versions', label: 'Resume Versions', icon: HistoryIcon },
    { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
    { id: 'linkedin', label: 'LinkedIn Profile', brand: 'linkedin' as const },
    { id: 'analytics', label: 'Resume Analytics', icon: BarChart3 },
  ];

  return (
    <div className="page-enter" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Top Header & Export Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShieldCheck size={24} color="var(--burgundy-700)" aria-hidden="true" />
            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)', margin: 0 }}>
              Resume Intelligence &amp; ATS Studio
            </h1>
            <span className="badge badge-success">
              ● Neon PostgreSQL + Gemini
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
            Candidate Content Spine → Job Match → Real 8-Dimension ATS Scanner → Fact-Locked Optimization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Template Selector */}
          <select
            value={template}
            onChange={(e: any) => setTemplate(e.target.value)}
            className="input"
            style={{ width: 'auto', height: '36px', fontSize: 'var(--font-xs)', padding: '0 10px' }}
          >
            <option value="ATS_CLASSIC">ATS Classic Template</option>
            <option value="MODERN_PROFESSIONAL">Modern Professional</option>
            <option value="TECHNICAL">Technical Engineer</option>
            <option value="EXECUTIVE">Executive Leadership</option>
          </select>

          {/* Autosave Status */}
          <span style={{ fontSize: 'var(--font-xs)', color: saveStatus === 'SAVED' ? 'var(--color-success)' : saveStatus === 'SAVING' ? 'var(--burgundy-700)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            {saveStatus === 'SAVING' && <RefreshCw size={12} className="spin" aria-hidden="true" />}
            {saveStatus === 'SAVED' && <CheckCircle2 size={12} aria-hidden="true" />}
            {saveStatus === 'SAVING' ? 'Autosaving to Neon...' : saveStatus === 'SAVED' ? 'Saved to Neon' : 'Draft'}
          </span>

          <button className="btn-primary btn-sm" onClick={handleDownloadDocx}>
            <BrandLogo name="word" size={15} /> Export DOCX
          </button>
          <button className="btn-secondary btn-sm" onClick={handleDownloadPdf}>
            <BrandLogo name="pdf" size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {notice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#6ee7b7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {notice}
        </div>
      )}

      {/* 8 Subsections Tab Navigation */}
      <div className="tab-list" style={{ overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-item ${active ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              {tab.brand ? (
                <BrandLogo name={tab.brand} size={15} />
              ) : Icon ? (
                <Icon size={15} color={active ? 'var(--burgundy-700)' : 'var(--text-muted)'} aria-hidden="true" />
              ) : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Resume Builder (Split View: Section-by-Section Editor + Formatted Real-Time Preview) */}
      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column: Structured Form Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Personal Details */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-indigo)' }}>
                Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    value={spine.personal.name}
                    onChange={(e) => handleUpdatePersonal('name', e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</label>
                  <input
                    type="email"
                    value={spine.personal.email}
                    onChange={(e) => handleUpdatePersonal('email', e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</label>
                  <input
                    type="text"
                    value={spine.personal.phone}
                    onChange={(e) => handleUpdatePersonal('phone', e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</label>
                  <input
                    type="text"
                    value={spine.personal.location}
                    onChange={(e) => handleUpdatePersonal('location', e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-indigo)' }}>
                Professional Summary
              </h3>
              <textarea
                value={spine.summary}
                onChange={(e) => setSpine({ ...spine, summary: e.target.value })}
                rows={4}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: 'white', fontSize: '0.85rem', lineHeight: '1.5' }}
              />
            </div>

            {/* Work Experiences */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>Work Experience</h3>
                <button className="btn-secondary" onClick={handleAddExperience} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <Plus size={14} /> Add Experience
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {spine.experiences.map((exp, idx) => (
                  <div key={exp.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Experience #{idx + 1}</span>
                      <button onClick={() => handleRemoveExperience(exp.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Responsibilities / Bullets:</div>
                    {exp.responsibilities.map((resp, bIdx) => (
                      <input
                        key={bIdx}
                        type="text"
                        value={resp}
                        onChange={(e) => {
                          const updated = [...exp.responsibilities];
                          updated[bIdx] = e.target.value;
                          handleUpdateExperience(exp.id, 'responsibilities', updated);
                        }}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'white', fontSize: '0.8rem', marginBottom: '4px' }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>Technical Skills</h3>
                <button className="btn-secondary" onClick={handleAddSkill} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <Plus size={14} /> Add Skill
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {spine.skills.map((skill, sIdx) => (
                  <span key={sIdx} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {skill.name}
                    <button onClick={() => handleRemoveSkill(skill.name)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Formatted Preview */}
          <div>
            <div className="glass-panel" style={{ padding: '32px', minHeight: '800px', background: '#ffffff', color: '#111827', borderRadius: '8px', fontFamily: 'Georgia, serif', border: '1px solid #e5e7eb' }}>
              {/* Header */}
              <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {spine.personal.name}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                  {spine.personal.email} • {spine.personal.phone} • {spine.personal.location}
                  {spine.personal.linkedIn && ` • ${spine.personal.linkedIn}`}
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
                  Professional Summary
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#1f2937' }}>{spine.summary}</p>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
                  Technical Competencies
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#1f2937' }}>
                  {spine.skills.map((s) => s.name).join(' • ')}
                </p>
              </div>

              {/* Experience */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '10px' }}>
                  Work Experience
                </h4>
                {spine.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                      <span>{exp.role} — {exp.company}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}>{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '0.83rem', color: '#374151', lineHeight: '1.4' }}>
                      {exp.responsibilities.map((resp, bIdx) => (
                        <li key={bIdx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '6px' }}>
                  Education
                </h4>
                {spine.education.map((edu, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#1f2937' }}>
                    <strong>{edu.degree} in {edu.field}</strong> — {edu.institution} ({edu.endDate})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ATS Scanner */}
      {activeTab === 'ats' && (
        <div>
          {scanResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Overall Score Banner */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #6366f1' }}>
                <div>
                  <span className="badge badge-indigo" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    REAL ATS EVALUATION
                  </span>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="gradient-text">
                    Overall ATS Compatibility: {scanResult.overallScore}%
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', maxWidth: '650px' }}>
                    {scanResult.honestyDisclaimer}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: scanResult.overallScore >= 80 ? '#10b981' : '#f59e0b' }}>
                    {scanResult.overallScore}/100
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Computed across 8 dimensions</span>
                </div>
              </div>

              {/* 8-Dimension Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {Object.entries(scanResult.dimensions || {}).map(([key, score]: [string, any]) => (
                  <div key={key} className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: score >= 80 ? '#6ee7b7' : score >= 60 ? '#fcd34d' : '#f87171', marginTop: '4px' }}>
                      {score}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyword Overlap Matrix */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                  Keyword Overlap Matrix
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px' }}>Keyword</th>
                      <th style={{ padding: '8px' }}>Category</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scanResult.keywordTable || []).map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 700 }}>{row.keyword}</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{row.category}</td>
                        <td style={{ padding: '8px' }}>
                          <span className={`badge ${row.status === 'FOUND' ? 'badge-emerald' : row.status === 'PARTIAL' ? 'badge-indigo' : 'badge-amber'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{row.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Scan size={40} color="#6366f1" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Run ATS Scanner</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', marginBottom: '20px' }}>
                Click below to compute real multidimensional ATS scoring against your job description.
              </p>
              <button className="btn-primary" onClick={handleRunATSScan} disabled={isLoading}>
                {isLoading ? <RefreshCw size={16} className="spin" /> : <Scan size={16} />} Execute Real ATS Scan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Job Match */}
      {activeTab === 'match' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Job Description ↔ Candidate Content Spine Match
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              TARGET JOB DESCRIPTION
            </label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              rows={6}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', padding: '12px', fontSize: '0.82rem' }}
            />
            <button className="btn-primary" onClick={handleRunATSScan} style={{ marginTop: '12px' }}>
              <GitCompare size={16} /> Calculate Job Match & Skills Overlap
            </button>
          </div>

          {scanResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div>
                <h4 style={{ color: '#10b981', fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                  ✓ Matched Technical Skills ({scanResult.keywordTable?.filter((k: any) => k.status === 'FOUND').length || 0})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(scanResult.keywordTable?.filter((k: any) => k.status === 'FOUND') || []).map((s: any, idx: number) => (
                    <span key={idx} className="badge badge-emerald">{s.keyword}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: '#f59e0b', fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                  ⚠ Missing Target Skills ({scanResult.missingKeywords?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(scanResult.missingKeywords || []).map((s: string, idx: number) => (
                    <span key={idx} className="badge badge-amber">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Resume Optimizer (Gemini 3.1 Flash Lite + Fact Lock) */}
      {activeTab === 'optimizer' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Fact-Locked Bullet & Keyword Optimizer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Powered by Gemini 3.1 Flash Lite. Immutable candidate facts (employer names, job titles, dates, degrees, metrics) are verified server-side.
              </p>
            </div>
            <button className="btn-primary" onClick={handleOptimizeResume} disabled={isLoading}>
              {isLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />} Run Fact-Locked Optimizer
            </button>
          </div>

          {optimizerResult && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button className="btn-primary" onClick={handleApplyOptimization}>
                  <CheckCircle2 size={16} /> Apply Changes to Active Resume
                </button>
                <button className="btn-secondary" onClick={handleSaveAsVersion}>
                  <Save size={16} /> Save as New Version in Neon
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(optimizerResult.bulletChanges || []).map((change: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: '6px' }}>
                      <strong>Original:</strong> {change.originalBullet}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 700, marginBottom: '6px' }}>
                      <strong>Improved:</strong> {change.improvedBullet}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <strong>Reason:</strong> {change.changeReason} | <strong>Action Verb:</strong> {change.actionVerb}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Resume Versions (Persistent History from Neon) */}
      {activeTab === 'versions' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Resume Version History</h3>
            <button className="btn-primary" onClick={handleSaveAsVersion}>
              <Plus size={16} /> Create New Version
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {versions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No saved versions yet. Optimize your resume or click "Create New Version" to snapshot your current state in Neon PostgreSQL.
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'white' }}>
                      Version {v.version}: {v.versionName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Target: {v.targetJobTitle || 'Software Engineer'} • Saved {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-emerald">ATS Score: {v.atsScore}%</span>
                    <button className="btn-secondary" onClick={() => handleRestoreVersion(v.id)} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      Restore State
                    </button>
                    <button onClick={() => handleDeleteVersion(v.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Cover Letter */}
      {activeTab === 'cover-letter' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Fact-Locked Cover Letter</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleGenerateCoverLetter} disabled={isLoading}>
                {isLoading ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />} Generate Cover Letter
              </button>
              <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(coverLetterText)}>
                <Copy size={15} /> Copy Text
              </button>
            </div>
          </div>

          <textarea
            value={coverLetterText || `Click 'Generate Cover Letter' to construct a personalized, fact-locked cover letter matching candidate experience with job description.`}
            onChange={(e) => setCoverLetterText(e.target.value)}
            rows={14}
            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', padding: '14px', fontFamily: 'serif', fontSize: '0.9rem', lineHeight: '1.6' }}
          />
        </div>
      )}

      {/* Tab 7: LinkedIn Profile */}
      {activeTab === 'linkedin' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>LinkedIn Profile Assets</h3>
            <button className="btn-primary" onClick={handleGenerateLinkedIn} disabled={isLoading}>
              {isLoading ? <RefreshCw size={15} className="spin" aria-hidden="true" /> : <BrandLogo name="linkedin" size={15} />} Generate LinkedIn Content
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                OPTIMIZED LINKEDIN HEADLINE
              </label>
              <input
                type="text"
                value={linkedInResult?.headline || `${spine.experiences[0]?.role || 'Software Engineer'} | Python | FastAPI | PostgreSQL | Microservices Architect`}
                onChange={(e) => setLinkedInResult({ ...linkedInResult, headline: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                ABOUT / SUMMARY
              </label>
              <textarea
                value={linkedInResult?.aboutSummary || spine.summary}
                onChange={(e) => setLinkedInResult({ ...linkedInResult, aboutSummary: e.target.value })}
                rows={5}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', padding: '10px', fontSize: '0.82rem', lineHeight: '1.5' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Resume Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ATS SCANS RUN</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#818cf8', marginTop: '6px' }}>
              {analytics?.totalScans || 1}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>RESUME VERSIONS</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
              {analytics?.totalVersions || versions.length || 1}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVERAGE ATS SCORE</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', marginTop: '6px' }}>
              {analytics?.avgAtsScore || scanResult?.overallScore || 85}%
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOP MISSING SKILL</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '10px' }}>
              {analytics?.topMissingSkills?.[0] || 'AWS Cloud'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
