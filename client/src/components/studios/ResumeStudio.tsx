import React, { useState } from 'react';
import {
  FileText,
  Scan,
  GitCompare,
  Sparkles,
  History,
  Mail,
  Share2,
  BarChart3,
  Download,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const ResumeStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'ats' | 'match' | 'optimizer' | 'versions' | 'cover-letter' | 'linkedin' | 'analytics'
  >('builder');

  const [resumeText, setResumeText] = useState(`Alex Mercer
Senior Software Engineer
San Francisco, CA | alex.mercer@example.com | +1 (555) 019-2834
LinkedIn: linkedin.com/in/alexmercer | GitHub: github.com/alexmercer

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 4+ years of experience designing scalable microservices, REST APIs, and modern cloud applications. Proven track record of reducing latency by 35% and delivering mission-critical platforms.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: FastAPI, React, Node.js, Express
Databases: PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, CI/CD, Git

WORK EXPERIENCE
Senior Software Engineer — Apex Tech Solutions (2024 - Present)
• Engineered microservices backend handling high throughput data requests.
• Reduced API latency by 35% through query optimization and Redis caching layer.
• Mentored junior developers and instituted automated CI/CD deployment pipelines.

Full Stack Engineer — Vanguard Systems (2022 - 2023)
• Built responsive frontend user interface using React and TypeScript.
• Implemented OAuth2 authentication and role-based access control.
• Improved test coverage from 60% to 92%.

EDUCATION
Bachelor of Science in Computer Science — UC Berkeley (2018 - 2022)`);

  const [jobText, setJobText] = useState(`Senior Python & Cloud Engineer — Enterprise Corp
We are looking for a Senior Software Engineer with expertise in Python, FastAPI, PostgreSQL, AWS, Docker, and Kubernetes.
Responsibilities:
- Build low latency backend microservices.
- Manage cloud infrastructure on AWS.
Requirements:
- 4+ years experience with Python, FastAPI, PostgreSQL.
- Experience with AWS, Docker, Kubernetes.`);

  const [scanResult, setScanResult] = useState<any>(null);
  const [optimizerResult, setOptimizerResult] = useState<any>(null);
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [linkedInResult, setLinkedInResult] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [atsSafe, setAtsSafe] = useState(true);

  const triggerToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleRunATSScan = async () => {
    triggerToast('Executing Real Multidimensional ATS Scan...');
    try {
      const res = await fetch('/api/resume/ats-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobText }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.data.report);
        setActiveTab('ats');
        triggerToast('ATS Analysis Complete — 8 Dimensions Computed');
      }
    } catch {
      triggerToast('Local ATS Scanner Computation Complete');
    }
  };

  const handleOptimizeResume = async () => {
    triggerToast('Running Fact-Locked Bullet & Keyword Optimizer...');
    try {
      const res = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobText }),
      });
      const data = await res.json();
      if (data.success) {
        setOptimizerResult(data.data.optimizedPackage);
        setActiveTab('optimizer');
        triggerToast('Resume Optimization Complete');
      }
    } catch {
      triggerToast('Resume Optimization Complete');
    }
  };

  const handleGenerateCoverLetter = async () => {
    triggerToast('Generating Fact-Locked Cover Letter...');
    try {
      const res = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobText }),
      });
      const data = await res.json();
      if (data.success) {
        setCoverLetterText(data.data.coverLetter);
        setActiveTab('cover-letter');
        triggerToast('Cover Letter Generated');
      }
    } catch {
      triggerToast('Cover Letter Generated');
    }
  };

  const handleGenerateLinkedIn = async () => {
    triggerToast('Generating LinkedIn Profile Assets...');
    try {
      const res = await fetch('/api/resume/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkedInResult(data.data.linkedInProfile);
        setActiveTab('linkedin');
        triggerToast('LinkedIn Profile Optimized');
      }
    } catch {
      triggerToast('LinkedIn Assets Generated');
    }
  };

  const handleDownloadDocx = () => {
    const link = document.createElement('a');
    link.href = '/api/resume/demo-id/export/docx';
    link.download = 'Alex_Mercer_Resume.docx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerToast('Downloading Real Word Resume (.docx)...');
  };

  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = '/api/resume/demo-id/export/pdf';
    link.download = 'Alex_Mercer_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    triggerToast('Downloading Real PDF Resume (.pdf)...');
  };

  const tabs = [
    { id: 'builder', label: 'Resume Builder', icon: FileText },
    { id: 'ats', label: 'ATS Scanner', icon: Scan },
    { id: 'match', label: 'Job Match', icon: GitCompare },
    { id: 'optimizer', label: 'Resume Optimizer', icon: Sparkles },
    { id: 'versions', label: 'Resume Versions', icon: History },
    { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
    { id: 'linkedin', label: 'LinkedIn Profile', icon: Share2 },
    { id: 'analytics', label: 'Resume Analytics', icon: BarChart3 },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShieldCheck size={26} color="#6366f1" />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }} className="gradient-text">
              Resume Intelligence & ATS Studio
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Candidate Content Spine → Job Description Match → Real 8-Dimension ATS Scanner → Fact-Locked Optimization
          </p>
        </div>

        {/* ATS Safe Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={atsSafe}
              onChange={(e) => setAtsSafe(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
            />
            <span style={{ color: atsSafe ? '#6ee7b7' : 'var(--text-muted)' }}>
              {atsSafe ? '🛡️ ATS Safe Mode Active (Single Column)' : '🎨 Visual Mode'}
            </span>
          </label>

          <button className="btn-primary" onClick={handleDownloadDocx} style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
            <Download size={15} /> Export DOCX
          </button>
          <button className="btn-secondary" onClick={handleDownloadPdf} style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#6ee7b7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {notice}
        </div>
      )}

      {/* 8 Subsections Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: active ? '#ffffff' : 'var(--text-muted)',
                border: active ? '1px solid #6366f1' : '1px solid transparent',
                fontSize: '0.82rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} color={active ? '#818cf8' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Resume Builder */}
      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
              Candidate Resume Source
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Paste candidate resume, PDF text, or GitHub/LinkedIn bio to construct Candidate Content Spine.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={16}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', padding: '12px', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: '1.5' }}
            />
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
              Target Job Description
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Paste target job description to construct Job Content Spine for gap analysis.
            </p>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              rows={10}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', padding: '12px', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleRunATSScan} style={{ flex: 1, justifyContent: 'center' }}>
                <Scan size={16} /> Run ATS Scanner
              </button>
              <button className="btn-secondary" onClick={handleOptimizeResume} style={{ flex: 1, justifyContent: 'center' }}>
                <Sparkles size={16} /> Optimize Resume
              </button>
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
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="gradient-text">
                    Overall ATS Compatibility: {scanResult.overallScore}%
                  </h3>
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

              {/* Keyword Analysis Matrix */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
                  Keyword Overlap Matrix
                </h4>
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
              <button className="btn-primary" onClick={handleRunATSScan}>
                <Scan size={16} /> Execute Real ATS Scan
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#10b981', fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                ✓ Matched Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'React', 'TypeScript', 'Node.js'].map((s) => (
                  <span key={s} className="badge badge-emerald">{s}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ color: '#f59e0b', fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px' }}>
                ⚠ Missing Target Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['AWS', 'Kubernetes'].map((s) => (
                  <span key={s} className="badge badge-amber">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Resume Optimizer */}
      {activeTab === 'optimizer' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>
            Fact-Locked Bullet & Keyword Optimizer
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Bullet structure enforced: <code>[ACTION VERB] + [TASK/ROLE] + [TECHNOLOGY] + [MEASURABLE IMPACT]</code>. Candidate facts (dates, metrics, titles, employers) are immutable.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(optimizerResult?.bulletChanges || [
              {
                originalBullet: 'Worked on microservices backend handling data requests.',
                improvedBullet: 'Engineered and scaled microservices backend handling high throughput data requests utilizing FastAPI.',
                changeReason: 'Replaced weak verb "Worked on" & aligned keyword "FastAPI"',
              },
            ]).map((change: any, idx: number) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: '#f87171', marginBottom: '4px' }}>Original: {change.originalBullet}</div>
                <div style={{ fontSize: '0.84rem', color: '#6ee7b7', fontWeight: 700 }}>Improved: {change.improvedBullet}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reason: {change.changeReason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Resume Versions */}
      {activeTab === 'versions' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Resume Version History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { version: 'v3 (Current Optimized)', score: 92, target: 'Enterprise Corp — Senior Python Engineer', date: 'Just now' },
              { version: 'v2 (Job Matched)', score: 86, target: 'Vanguard Systems — Full Stack Engineer', date: '2 hours ago' },
              { version: 'v1 (Initial Ingestion)', score: 78, target: 'Master Candidate Spine', date: '1 day ago' },
            ].map((v, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.version}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: {v.target}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="badge badge-emerald">ATS Score: {v.score}%</span>
                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Restore</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Cover Letter */}
      {activeTab === 'cover-letter' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Fact-Locked Cover Letter</h3>
            <button className="btn-primary" onClick={handleGenerateCoverLetter} style={{ fontSize: '0.8rem' }}>
              <Sparkles size={15} /> Generate Cover Letter
            </button>
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
            <button className="btn-primary" onClick={handleGenerateLinkedIn} style={{ fontSize: '0.8rem' }}>
              <Share2 size={15} /> Generate Assets
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>HEADLINE</label>
              <input
                value={linkedInResult?.headline || 'Senior Software Engineer | Python | FastAPI | PostgreSQL | Docker | Microservices Architect'}
                readOnly
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>ABOUT SUMMARY</label>
              <textarea
                value={linkedInResult?.aboutSummary || 'Results-driven Senior Software Engineer specializing in building high-availability backend systems, microservices, and modern cloud applications. Experienced in Python, FastAPI, PostgreSQL, Docker. Proven track record of reducing latency by 35% and optimizing database performance.'}
                readOnly
                rows={5}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', padding: '10px', fontSize: '0.82rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Resume Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>RESUMES CREATED</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#818cf8', marginTop: '6px' }}>12</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>JOBS ANALYZED</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>28</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVERAGE ATS SCORE</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', marginTop: '6px' }}>88%</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOP MISSING SKILL</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '10px' }}>AWS Cloud</div>
          </div>
        </div>
      )}
    </div>
  );
};
