import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string | null;
  bitrate: number;
  fps: number;
  fileSize: number;
  formatName: string;
}

export interface ConversionOptions {
  resolution?: 'original' | '1080p' | '720p' | '480p';
  quality?: 'high' | 'balanced' | 'compressed';
  fps?: 'original' | '30' | '60';
  audioBitrate?: '128k' | '192k' | '256k';
}

export interface ConversionHandle {
  promise: Promise<VideoMetadata>;
  cancel: () => void;
}

/**
 * Safe lazy resolver for FFmpeg binary without breaking serverless startup
 */
const GET_FFMPEG = async (): Promise<string> => {
  try {
    const ffmpegModule = await import('ffmpeg-static');
    const ffmpegPath = (ffmpegModule as any).default || ffmpegModule;
    if (ffmpegPath && typeof ffmpegPath === 'string' && fs.existsSync(ffmpegPath)) {
      return ffmpegPath;
    }
  } catch (err: any) {
    console.warn('⚠️ ffmpeg-static resolution warning:', err?.message || err);
  }
  return 'ffmpeg';
};

/**
 * Safe lazy resolver for FFprobe binary without breaking serverless startup
 */
const GET_FFPROBE = async (): Promise<string> => {
  try {
    const ffprobeModule = await import('ffprobe-static');
    const ffprobeObj = (ffprobeModule as any).default || ffprobeModule;
    if (ffprobeObj && ffprobeObj.path && fs.existsSync(ffprobeObj.path)) {
      return ffprobeObj.path;
    }
  } catch (err: any) {
    console.warn('⚠️ ffprobe-static resolution warning:', err?.message || err);
  }
  return 'ffprobe';
};

/**
 * Inspect video file metadata using ffprobe JSON output
 */
export const probeVideo = async (filePath: string): Promise<VideoMetadata> => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error('Uploaded file is empty (0 bytes).');
  }

  const ffprobeBin = await GET_FFPROBE();
  const args = [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ];

  return new Promise((resolve, reject) => {
    execFile(ffprobeBin, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(
          new Error(
            `Video inspection failed (FFprobe error): ${stderr || err.message}`
          )
        );
      }

      try {
        const data = JSON.parse(stdout);
        const format = data.format || {};
        const streams = data.streams || [];
        const videoStream = streams.find((s: any) => s.codec_type === 'video');
        const audioStream = streams.find((s: any) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('Invalid media file: No video stream found.'));
        }

        let fps = 30;
        if (videoStream.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && parseFloat(parts[1]) > 0) {
            fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
          } else {
            fps = Math.round(parseFloat(videoStream.r_frame_rate)) || 30;
          }
        }

        const metadata: VideoMetadata = {
          duration: parseFloat(format.duration || videoStream.duration || 0),
          width: parseInt(videoStream.width || 0, 10),
          height: parseInt(videoStream.height || 0, 10),
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream ? audioStream.codec_name : null,
          bitrate: parseInt(format.bit_rate || videoStream.bit_rate || 0, 10),
          fps,
          fileSize: parseInt(format.size || stat.size, 10),
          formatName: format.format_name || 'mov',
        };

        resolve(metadata);
      } catch (parseErr: any) {
        reject(new Error(`Failed to parse FFprobe JSON metadata: ${parseErr.message}`));
      }
    });
  });
};

/**
 * Validate generated MP4 video file decodability and container integrity
 */
export const validateMp4Output = async (filePath: string, _expectedMeta?: any): Promise<VideoMetadata> => {
  return probeVideo(filePath);
};

/**
 * Real Server-Side MOV → MP4 Conversion Engine
 */
export const convertMovToMp4 = (
  inputPath: string,
  outputPath: string,
  options: ConversionOptions = {},
  onProgress?: (progressPercent: number) => void
): ConversionHandle => {
  let isCancelled = false;
  let childProcess: any = null;

  const promise = new Promise<VideoMetadata>(async (resolve, reject) => {
    try {
      // 1. Inspect input video metadata
      const meta = await probeVideo(inputPath);

      if (isCancelled) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        return reject(new Error('Conversion cancelled by user.'));
      }

      // Ensure output directory exists
      const outDir = path.dirname(outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // 2. Build FFmpeg command arguments
      const args: string[] = ['-y', '-i', inputPath];

      // Resolution scaling filter
      const filters: string[] = [];
      if (options.resolution === '1080p') {
        filters.push('scale=-2:1080');
      } else if (options.resolution === '720p') {
        filters.push('scale=-2:720');
      } else if (options.resolution === '480p') {
        filters.push('scale=-2:480');
      }

      if (filters.length > 0) {
        args.push('-vf', filters.join(','));
      }

      // Video Codec & Quality CRF
      args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');

      if (options.quality === 'high') {
        args.push('-crf', '18', '-preset', 'medium');
      } else if (options.quality === 'compressed') {
        args.push('-crf', '28', '-preset', 'fast');
      } else {
        // Default balanced
        args.push('-crf', '23', '-preset', 'medium');
      }

      // Frame rate
      if (options.fps && options.fps !== 'original') {
        args.push('-r', options.fps);
      }

      // Audio Codec & Bitrate
      if (meta.audioCodec) {
        args.push('-c:a', 'aac');
        args.push('-b:a', options.audioBitrate || '192k');
      } else {
        args.push('-an');
      }

      // Faststart for progressive web playback
      args.push('-movflags', '+faststart');
      args.push(outputPath);

      const ffmpegBin = await GET_FFMPEG();
      childProcess = spawn(ffmpegBin, args);

      let totalDurationSec = meta.duration || 1;
      let stderrLogs = '';

      childProcess.stderr.on('data', (data: Buffer) => {
        const str = data.toString();
        stderrLogs += str;

        // Parse time=HH:MM:SS.ms progress
        const timeMatch = str.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
        if (timeMatch && onProgress) {
          const hours = parseFloat(timeMatch[1]);
          const mins = parseFloat(timeMatch[2]);
          const secs = parseFloat(timeMatch[3]);
          const currentSec = hours * 3600 + mins * 60 + secs;
          const percent = Math.min(99, Math.round((currentSec / totalDurationSec) * 100));
          onProgress(percent);
        }
      });

      childProcess.on('error', (spawnErr: any) => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(
          new Error(
            `Failed to start FFmpeg process (${spawnErr.message}). Ensure ffmpeg binary is available.`
          )
        );
      });

      childProcess.on('close', async (code: number) => {
        if (isCancelled) {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return reject(new Error('Conversion cancelled by user.'));
        }

        if (code !== 0) {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return reject(
            new Error(
              `FFmpeg process exited with error code ${code}.\nLogs: ${stderrLogs.slice(-300)}`
            )
          );
        }

        try {
          if (onProgress) onProgress(100);
          // 3. Inspect generated MP4 file to confirm validity
          const outputMeta = await probeVideo(outputPath);

          if (outputMeta.fileSize === 0) {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return reject(new Error('Generated MP4 file is 0 bytes. Conversion failed.'));
          }

          resolve(outputMeta);
        } catch (err: any) {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(new Error(`Generated MP4 validation failed: ${err.message}`));
        }
      });
    } catch (initErr: any) {
      reject(initErr);
    }
  });

  return {
    promise,
    cancel: () => {
      isCancelled = true;
      if (childProcess) {
        try {
          childProcess.kill('SIGKILL');
        } catch {}
      }
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch {}
      }
    },
  };
};
