import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

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

const GET_FFMPEG = (): string => {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  return 'ffmpeg';
};

const GET_FFPROBE = (): string => {
  if (ffprobePath && ffprobePath.path && fs.existsSync(ffprobePath.path)) {
    return ffprobePath.path;
  }
  return 'ffprobe';
};

/**
 * Inspect video file metadata using ffprobe JSON output
 */
export const probeVideo = (filePath: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found at path: ${filePath}`));
    }

    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      return reject(new Error('Uploaded file is empty (0 bytes).'));
    }

    const ffprobeBin = GET_FFPROBE();
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    execFile(ffprobeBin, args, (error, stdout, stderr) => {
      if (error) {
        return reject(
          new Error(`FFprobe inspection failed: ${error.message} ${stderr}`)
        );
      }

      try {
        const parsed = JSON.parse(stdout);
        if (!parsed.streams || !Array.isArray(parsed.streams)) {
          return reject(new Error('Invalid video container: No media streams found.'));
        }

        const videoStream = parsed.streams.find(
          (s: any) => s.codec_type === 'video'
        );
        if (!videoStream) {
          return reject(
            new Error('Invalid file: Uploaded media does not contain a valid video stream.')
          );
        }

        const audioStream = parsed.streams.find(
          (s: any) => s.codec_type === 'audio'
        );

        let duration = parseFloat(parsed.format?.duration || videoStream.duration || '0');
        if (isNaN(duration) || duration <= 0) {
          return reject(new Error('Invalid video stream: Duration is 0 or unreadable.'));
        }

        const width = parseInt(videoStream.width || '0', 10);
        const height = parseInt(videoStream.height || '0', 10);
        if (width === 0 || height === 0) {
          return reject(new Error('Invalid video stream: Resolution is 0x0.'));
        }

        // Calculate FPS
        let fps = 30;
        if (videoStream.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && parseFloat(parts[1]) > 0) {
            fps = Math.round((parseFloat(parts[0]) / parseFloat(parts[1])) * 100) / 100;
          }
        }

        const metadata: VideoMetadata = {
          duration,
          width,
          height,
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream ? audioStream.codec_name || 'unknown' : null,
          bitrate: parseInt(parsed.format?.bit_rate || '0', 10),
          fps,
          fileSize: stat.size,
          formatName: parsed.format?.format_name || 'unknown',
        };

        resolve(metadata);
      } catch (err: any) {
        reject(new Error(`Failed to parse media probe JSON: ${err.message}`));
      }
    });
  });
};

/**
 * Execute MOV -> MP4 conversion with real FFmpeg process and real-time progress parsing
 */
export const convertMovToMp4 = (
  inputPath: string,
  outputPath: string,
  options: ConversionOptions = {},
  onProgress?: (percent: number) => void
): ConversionHandle => {
  let childProcess: ReturnType<typeof spawn> | null = null;
  let isCancelled = false;

  const promise = new Promise<VideoMetadata>(async (resolve, reject) => {
    try {
      if (isCancelled) {
        return reject(new Error('Conversion process was cancelled by user.'));
      }

      // Step 1: Probe source video metadata
      const sourceMeta = await probeVideo(inputPath);

      if (isCancelled) {
        return reject(new Error('Conversion process was cancelled by user.'));
      }

      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Build FFmpeg command arguments
      const ffmpegBin = GET_FFMPEG();
      const args: string[] = ['-y', '-i', inputPath];

      // Video Codec
      args.push('-c:v', 'libx264');
      args.push('-pix_fmt', 'yuv420p');
      args.push('-movflags', '+faststart');

      // Quality CRF selection
      const quality = options.quality || 'balanced';
      if (quality === 'high') {
        args.push('-crf', '18', '-preset', 'slow');
      } else if (quality === 'compressed') {
        args.push('-crf', '28', '-preset', 'fast');
      } else {
        args.push('-crf', '23', '-preset', 'medium');
      }

      // Resolution Filter
      const resolution = options.resolution || 'original';
      if (resolution === '1080p') {
        args.push('-vf', 'scale=-2:1080');
      } else if (resolution === '720p') {
        args.push('-vf', 'scale=-2:720');
      } else if (resolution === '480p') {
        args.push('-vf', 'scale=-2:480');
      }

      // Frame Rate
      if (options.fps === '30') {
        args.push('-r', '30');
      } else if (options.fps === '60') {
        args.push('-r', '60');
      }

      // Audio handling
      if (sourceMeta.audioCodec) {
        args.push('-c:a', 'aac');
        const audioBitrate = options.audioBitrate || '192k';
        args.push('-b:a', audioBitrate);
      } else {
        args.push('-an');
      }

      args.push(outputPath);

      childProcess = spawn(ffmpegBin, args);

      // Parse FFmpeg stderr for real-time progress
      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data: Buffer) => {
          if (isCancelled) return;
          const str = data.toString();
          // Match time=00:00:02.50
          const match = str.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
          if (match && sourceMeta.duration > 0) {
            const hours = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const secs = parseInt(match[3], 10);
            const centis = parseInt(match[4], 10);
            const currentTime = hours * 3600 + mins * 60 + secs + centis / 100;
            const percent = Math.min(99, Math.floor((currentTime / sourceMeta.duration) * 100));
            if (onProgress) {
              onProgress(percent);
            }
          }
        });
      }

      childProcess.on('error', (err) => {
        if (isCancelled) return;
        reject(new Error(`FFmpeg process execution failed: ${err.message}`));
      });

      childProcess.on('close', async (code) => {
        if (isCancelled) {
          return reject(new Error('Conversion process was cancelled by user.'));
        }

        if (code !== 0) {
          // Clean up partial output file if error
          if (fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch (_) {}
          }
          return reject(new Error(`FFmpeg process exited with failure code ${code}.`));
        }

        if (onProgress) {
          onProgress(100);
        }

        // Step 2: Validate generated MP4 output
        try {
          const validatedMeta = await validateMp4Output(outputPath, sourceMeta);
          resolve(validatedMeta);
        } catch (valErr: any) {
          if (fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch (_) {}
          }
          reject(new Error(`Generated MP4 output validation failed: ${valErr.message}`));
        }
      });
    } catch (err: any) {
      reject(err);
    }
  });

  const cancel = () => {
    isCancelled = true;
    if (childProcess) {
      childProcess.kill('SIGKILL');
    }
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (_) {}
    }
  };

  return { promise, cancel };
};

/**
 * Validate generated MP4 file against strict requirements
 */
export const validateMp4Output = async (
  outputPath: string,
  sourceMeta: VideoMetadata
): Promise<VideoMetadata> => {
  if (!fs.existsSync(outputPath)) {
    throw new Error('Converted MP4 output file does not exist on disk.');
  }

  const stat = fs.statSync(outputPath);
  if (stat.size === 0) {
    throw new Error('Converted MP4 file is 0 bytes.');
  }

  const outputMeta = await probeVideo(outputPath);

  if (outputMeta.videoCodec !== 'h264') {
    throw new Error(`Invalid codec: Expected h264 but got ${outputMeta.videoCodec}.`);
  }

  if (outputMeta.width === 0 || outputMeta.height === 0) {
    throw new Error('Invalid video dimensions: Converted MP4 is 0x0.');
  }

  if (sourceMeta.audioCodec && !outputMeta.audioCodec) {
    throw new Error('Audio stream lost during MOV to MP4 conversion.');
  }

  // Duration check (within 2 seconds tolerance)
  if (Math.abs(outputMeta.duration - sourceMeta.duration) > 2.0) {
    throw new Error(
      `Duration mismatch: Source is ${sourceMeta.duration}s, converted MP4 is ${outputMeta.duration}s.`
    );
  }

  return outputMeta;
};
