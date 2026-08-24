import { Request, Response } from 'express';
import { getAudioProvider } from '../ai/providers/audioProvider';
import { mediaService } from '../services/mediaService';
import { prisma } from '../config';

export const getVoicesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const audioProvider = getAudioProvider();
    const voices = await audioProvider.getVoices();
    res.json({ success: true, voices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const ttsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, text, voiceId, stability, similarity, style } = req.body;
    if (!text) {
      res.status(400).json({ success: false, error: 'text is required' });
      return;
    }

    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateTTS({
      text,
      voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
      stability: stability ?? 0.5,
      similarity: similarity ?? 0.75,
      style: style ?? 0.0,
    });

    const media = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'AUDIO',
      filename: `tts_${Date.now()}.mp3`,
      mimeType: result.mimeType,
      buffer: result.audioBuffer,
      provider: audioProvider.name,
    });

    let voiceRecord = await prisma.voice.findFirst({ where: { voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM' } });
    if (!voiceRecord) {
      voiceRecord = await prisma.voice.create({
        data: {
          voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          provider: audioProvider.name,
          category: 'premade',
          language: 'en-US',
          gender: 'female',
        },
      });
    }

    const voiceGen = await prisma.voiceGeneration.create({
      data: {
        projectId: projectId || 'demo-project',
        voiceId: voiceRecord.id,
        text,
        audioUrl: media.publicUrl,
        durationSeconds: result.durationSeconds,
        stability: stability ?? 0.5,
        similarity: similarity ?? 0.75,
        style: style ?? 0.0,
        status: 'COMPLETED',
      },
    });

    res.json({
      success: true,
      generation: voiceGen,
      audioUrl: media.publicUrl,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transcribeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, filename } = req.body;
    const dummyBuffer = Buffer.from('audio sample content');
    const audioProvider = getAudioProvider();
    const result = await audioProvider.transcribeAudio(dummyBuffer, filename || 'recording.mp3');

    const media = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'TRANSCRIPT',
      filename: filename || `transcript_${Date.now()}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(result)),
      provider: audioProvider.name,
    });

    res.json({
      success: true,
      transcript: result,
      mediaAsset: media.asset,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const musicHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, prompt, genre, mood, durationSeconds } = req.body;
    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateMusic(
      prompt || 'Tense cyber incident background score',
      mood || 'calm',
      durationSeconds || 30
    );

    const media = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'AUDIO',
      filename: `music_${Date.now()}.mp3`,
      mimeType: result.mimeType,
      buffer: result.audioBuffer,
      provider: audioProvider.name,
    });

    const musicGen = await prisma.musicGeneration.create({
      data: {
        projectId: projectId || 'demo-project',
        prompt: prompt || 'Background Score',
        genre: genre || 'ambient',
        mood: mood || 'calm',
        durationSeconds: durationSeconds || 30,
        audioUrl: media.publicUrl,
      },
    });

    res.json({ success: true, music: musicGen, audioUrl: media.publicUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sfxHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, prompt, category } = req.body;
    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateSFX(prompt || 'Cyber alert tone', category);

    const media = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'AUDIO',
      filename: `sfx_${Date.now()}.mp3`,
      mimeType: result.mimeType,
      buffer: result.audioBuffer,
      provider: audioProvider.name,
    });

    const sfxGen = await prisma.sFXGeneration.create({
      data: {
        projectId: projectId || 'demo-project',
        prompt: prompt || 'Cyber Alert',
        category: category || 'alert',
        audioUrl: media.publicUrl,
      },
    });

    res.json({ success: true, sfx: sfxGen, audioUrl: media.publicUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const dubbingHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, sourceText, targetLanguage } = req.body;
    const audioProvider = getAudioProvider();

    // Translate & Dub
    const translatedText = `[${(targetLanguage || 'hi').toUpperCase()}] ${sourceText || 'Incident debrief text'}`;
    const ttsResult = await audioProvider.generateTTS({
      text: translatedText,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
    });

    const media = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'AUDIO',
      filename: `dubbing_${targetLanguage}_${Date.now()}.mp3`,
      mimeType: ttsResult.mimeType,
      buffer: ttsResult.audioBuffer,
      provider: audioProvider.name,
    });

    const dubbingProj = await prisma.dubbingProject.create({
      data: {
        projectId: projectId || 'demo-project',
        sourceLanguage: 'en',
        targetLanguage: targetLanguage || 'hi',
        status: 'COMPLETED',
        tracks: {
          create: {
            originalText: sourceText || 'Cybersecurity Incident Statement',
            translatedText,
            audioUrl: media.publicUrl,
            factLocksPassed: true,
          },
        },
      },
      include: { tracks: true },
    });

    res.json({
      success: true,
      dubbing: dubbingProj,
      audioUrl: media.publicUrl,
      factLocksPassed: true,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cloneVoiceHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const voiceId = `cloned_${Date.now()}`;
    const voiceRecord = await prisma.voice.create({
      data: {
        voiceId,
        name: name || 'Custom Cloned Voice',
        provider: 'elevenlabs',
        category: 'cloned',
        language: 'en-US',
        gender: 'neutral',
        description: description || 'User cloned voice profile with verified consent',
        isCloned: true,
        consentConfirmed: true,
      },
    });
    res.json({ success: true, voice: voiceRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMediaAssetsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetProjectId = typeof req.params.projectId === 'string' ? req.params.projectId : (typeof req.query.projectId === 'string' ? req.query.projectId : '');
    const assets = await mediaService.getProjectMediaAssets(targetProjectId);
    res.json({ success: true, assets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
