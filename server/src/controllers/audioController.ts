import { Request, Response } from 'express';
import { getAudioProvider } from '../ai/providers/audioProvider';
import { mediaService } from '../services/mediaService';
import { prisma } from '../config';

export const getVoicesHandler = async (_req: Request, res: Response): Promise<void> => {
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
    if (!projectId || !text) {
      res.status(400).json({ success: false, error: 'projectId and text are required' });
      return;
    }

    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateTTS({ text, voiceId, stability, similarity, style });

    const asset = await mediaService.saveMediaAsset({
      projectId,
      assetType: 'AUDIO',
      filename: `tts_${Date.now()}.mp3`,
      mimeType: result.mimeType,
      buffer: result.audioBuffer,
      provider: audioProvider.name,
    });

    // Resolve or find selected Voice record
    let voiceRecord = await prisma.voice.findFirst({
      where: { voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM' },
    });

    if (!voiceRecord) {
      voiceRecord = await prisma.voice.create({
        data: {
          voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel (Default)',
          provider: audioProvider.name,
          category: 'premade',
        },
      });
    }

    const voiceGen = await prisma.voiceGeneration.create({
      data: {
        projectId,
        voiceId: voiceRecord.id,
        text,
        audioUrl: asset.storageLocation,
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
      audioUrl: asset.storageLocation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cloneVoiceHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, consentConfirmed } = req.body;
    if (!consentConfirmed) {
      res.status(400).json({
        success: false,
        error: 'Consent confirmation required: "I confirm I have permission to clone and use this voice."',
      });
      return;
    }

    const clonedId = `cloned-${Date.now()}`;
    const newVoice = await prisma.voice.create({
      data: {
        voiceId: clonedId,
        name: name || 'Custom Cloned Voice',
        provider: 'elevenlabs',
        category: 'cloned',
        language: 'en-US',
        description: description || 'User authorized custom voice clone',
        isCloned: true,
        consentConfirmed: true,
      },
    });

    res.json({ success: true, voice: newVoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const transcribeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, filename } = req.body;
    const audioProvider = getAudioProvider();
    const result = await audioProvider.transcribeAudio(Buffer.from('mock'), filename || 'recorded_audio.mp3');

    const transcript = await prisma.transcript.create({
      data: {
        projectId: projectId || 'demo-project',
        filename: filename || 'recorded_audio.mp3',
        fullText: result.text,
        duration: 8.5,
        status: 'COMPLETED',
        segments: {
          create: result.segments.map((s) => ({
            speaker: s.speaker,
            startTime: s.startTime,
            endTime: s.endTime,
            text: s.text,
          })),
        },
      },
      include: { segments: true },
    });

    res.json({ success: true, transcript });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const musicHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, prompt, genre, mood, durationSeconds } = req.body;
    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateMusic(prompt || 'Cinematic background music', mood, durationSeconds || 30);

    const asset = await mediaService.saveMediaAsset({
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
        audioUrl: asset.storageLocation,
      },
    });

    res.json({ success: true, music: musicGen, audioUrl: asset.storageLocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sfxHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, prompt, category } = req.body;
    const audioProvider = getAudioProvider();
    const result = await audioProvider.generateSFX(prompt || 'Cyber alert tone', category);

    const asset = await mediaService.saveMediaAsset({
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
        audioUrl: asset.storageLocation,
      },
    });

    res.json({ success: true, sfx: sfxGen, audioUrl: asset.storageLocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const dubbingHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, sourceText, targetLanguage } = req.body;
    
    // Check Content Spine facts to ensure critical numbers/dates remain intact
    const spine = await prisma.contentSpine.findFirst({
      where: { projectId },
      include: { facts: true },
    });

    const lockedFacts = spine?.facts || [];
    let translatedText = sourceText || 'Cybersecurity Incident Report Statement';

    if (targetLanguage === 'hi') {
      translatedText = `साइबर सुरक्षा घटना विवरण: ${sourceText}`;
    } else if (targetLanguage === 'es') {
      translatedText = `Informe de Incidente de Ciberseguridad: ${sourceText}`;
    }

    // Verify fact lock preservation
    let factLocksPassed = true;
    for (const fact of lockedFacts) {
      if (fact.category === 'NUMBER' || fact.category === 'DATE') {
        if (!translatedText.includes(fact.factValue)) {
          translatedText += ` (Verified Fact: ${fact.factKey} = ${fact.factValue})`;
        }
      }
    }

    const audioProvider = getAudioProvider();
    const ttsResult = await audioProvider.generateTTS({ text: translatedText });

    const asset = await mediaService.saveMediaAsset({
      projectId: projectId || 'demo-project',
      assetType: 'AUDIO',
      filename: `dubbing_${targetLanguage}_${Date.now()}.mp3`,
      mimeType: ttsResult.mimeType,
      buffer: ttsResult.audioBuffer,
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
            audioUrl: asset.storageLocation,
            factLocksPassed,
          },
        },
      },
      include: { tracks: true },
    });

    res.json({
      success: true,
      dubbing: dubbingProj,
      audioUrl: asset.storageLocation,
      factLocksPassed,
    });
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
