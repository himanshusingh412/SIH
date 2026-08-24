import React, { useState } from 'react';
import { Mic, FileAudio, Music, Zap, Languages, Video } from 'lucide-react';
import type { CreativeStudioTab, ContentSpineData } from '../types';
import { VoiceStudio } from '../components/studios/VoiceStudio';
import { SpeechToTextStudio } from '../components/studios/SpeechToTextStudio';
import { MusicStudio } from '../components/studios/MusicStudio';
import { SFXStudio } from '../components/studios/SFXStudio';
import { DubbingStudio } from '../components/studios/DubbingStudio';
import { VideoStudio } from '../components/studios/VideoStudio';
import { VideoFormatConverter } from '../components/studios/VideoFormatConverter';

interface CreativeStudioPageProps {
  projectId: string;
  spine: ContentSpineData | null;
  onSpineCreated?: (spine: ContentSpineData) => void;
}

export const CreativeStudioPage: React.FC<CreativeStudioPageProps> = ({
  projectId,
  spine,
  onSpineCreated,
}) => {
  const [activeTab, setActiveTab] = useState<CreativeStudioTab>('voice-studio');

  const tabs: Array<{ id: CreativeStudioTab; label: string; icon: any }> = [
    { id: 'voice-studio', label: 'Voice Studio', icon: Mic },
    { id: 'speech-to-text', label: 'Speech-to-Text', icon: FileAudio },
    { id: 'music-studio', label: 'Music Studio', icon: Music },
    { id: 'sfx-studio', label: 'Sound Effects', icon: Zap },
    { id: 'dubbing', label: 'Dubbing & Localization', icon: Languages },
    { id: 'video-studio', label: 'Video Studio', icon: Video },
    { id: 'format-converter', label: 'Format Converter', icon: Video },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Title & Sub-Tab Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>
            Multimodal Platform Integration
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
            Creative Studio & Audio Engine
          </h2>
        </div>

        {/* Studio Sub-Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '10px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`btn-secondary ${active ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Studio */}
      {activeTab === 'voice-studio' && <VoiceStudio projectId={projectId} spine={spine} />}
      {activeTab === 'speech-to-text' && <SpeechToTextStudio projectId={projectId} onSpineCreated={onSpineCreated} />}
      {activeTab === 'music-studio' && <MusicStudio projectId={projectId} />}
      {activeTab === 'sfx-studio' && <SFXStudio projectId={projectId} />}
      {activeTab === 'dubbing' && <DubbingStudio projectId={projectId} spine={spine} />}
      {activeTab === 'video-studio' && <VideoStudio projectId={projectId} spine={spine} onOpenConverter={() => setActiveTab('format-converter')} />}
      {activeTab === 'format-converter' && <VideoFormatConverter projectId={projectId} />}
    </div>
  );
};
