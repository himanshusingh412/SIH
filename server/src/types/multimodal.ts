export interface VoiceProfile {
  id: string;
  voiceId: string;
  name: string;
  provider: 'elevenlabs' | 'mock';
  category: 'premade' | 'cloned' | 'professional';
  language: string;
  gender: string;
  previewUrl?: string;
  description?: string;
  isCloned?: boolean;
  consentConfirmed?: boolean;
}

export interface TTSRequest {
  projectId: string;
  outputId?: string;
  text: string;
  voiceId: string;
  stability?: number;
  similarity?: number;
  style?: number;
}

export interface TTSResponse {
  id: string;
  projectId: string;
  voiceId: string;
  audioUrl: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface TranscriptionSegmentData {
  id: string;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TranscriptionResponse {
  id: string;
  projectId: string;
  filename: string;
  language: string;
  fullText: string;
  duration: number;
  segments: TranscriptionSegmentData[];
}

export interface MusicRequest {
  projectId: string;
  prompt: string;
  genre?: string;
  mood?: string;
  durationSeconds?: number;
}

export interface MusicResponse {
  id: string;
  projectId: string;
  prompt: string;
  genre: string;
  mood: string;
  audioUrl: string;
  durationSeconds: number;
}

export interface SFXRequest {
  projectId: string;
  prompt: string;
  category?: string;
}

export interface SFXResponse {
  id: string;
  projectId: string;
  prompt: string;
  category: string;
  audioUrl: string;
}

export interface DubbingRequest {
  projectId: string;
  sourceText: string;
  targetLanguage: string;
  voiceId?: string;
}

export interface DubbingResponse {
  id: string;
  projectId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  audioUrl: string;
  factLocksPassed: boolean;
}

export interface VideoProductionSpec {
  projectId: string;
  title: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  scenes: Array<{
    sceneNumber: number;
    title: string;
    narrationText: string;
    visualDescription: string;
    durationSeconds: number;
    audioUrl?: string;
  }>;
  backgroundMusicUrl?: string;
  status: 'READY_TO_RENDER' | 'RENDERING_NOT_CONFIGURED';
  note: string;
}

export interface AgentAskRequest {
  sessionId?: string;
  query: string;
}

export interface AgentAskResponse {
  sessionId: string;
  query: string;
  answer: string;
  sourceOnly: boolean;
  toolCalls: Array<{ tool: string; params: any; result: any }>;
  factLocksVerified: string[];
  audioUrl?: string;
}
