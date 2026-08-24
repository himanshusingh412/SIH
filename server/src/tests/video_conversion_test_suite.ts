import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import {
  probeVideo,
  convertMovToMp4,
  validateMp4Output,
  VideoMetadata,
} from '../engine/formatEngine/converters/videoConverter';

const TEST_DIR = path.join(process.cwd(), 'tmp_video_tests');

const getFfmpegBin = () => {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  return 'ffmpeg';
};

/**
 * Generate a real MOV video file using FFmpeg test patterns
 */
const generateRealMovFile = (outputPath: string, durationSec = 3): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpegBin = getFfmpegBin();
    const args = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `testsrc=duration=${durationSec}:size=640x360:rate=30`,
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=1000:duration=${durationSec}`,
      '-c:v',
      'qtrle',
      '-c:a',
      'pcm_s16be',
      outputPath,
    ];

    const proc = spawn(ffmpegBin, args);
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`Failed to generate MOV test file, exit code ${code}`));
      }
    });
  });
};

async function runVideoConversionTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 PART 16 — REAL MOV → MP4 VIDEO CONVERSION TEST SUITE');
  console.log('======================================================\n');

  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  const realMovPath = path.join(TEST_DIR, 'test_source.mov');
  const realMp4Path = path.join(TEST_DIR, 'test_converted.mp4');
  const cancelMp4Path = path.join(TEST_DIR, 'test_cancel.mp4');
  const textFakePath = path.join(TEST_DIR, 'text_renamed.mov');
  const emptyFilePath = path.join(TEST_DIR, 'empty_file.mov');

  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failedTests++;
    }
  };

  try {
    // 1. Generate real MOV file
    console.log('🎬 1. Generating Real MOV Test Video File...');
    await generateRealMovFile(realMovPath, 3);
    assert(fs.existsSync(realMovPath) && fs.statSync(realMovPath).size > 0, 'Real MOV Test File Created');

    // 2. Probe MOV metadata
    console.log('\n🔍 2. Testing Input MOV Metadata Inspection (ffprobe)...');
    let sourceMeta: VideoMetadata | null = null;
    try {
      sourceMeta = await probeVideo(realMovPath);
      console.log(`     Format: ${sourceMeta.formatName} | Resolution: ${sourceMeta.width}x${sourceMeta.height} | Duration: ${sourceMeta.duration}s | Codecs: ${sourceMeta.videoCodec}/${sourceMeta.audioCodec}`);
      assert(
        sourceMeta.width === 640 &&
          sourceMeta.height === 360 &&
          sourceMeta.duration > 2.5 &&
          sourceMeta.videoCodec === 'qtrle',
        'MOV Inspection Extracted Correct Real Metadata'
      );
    } catch (e: any) {
      assert(false, `MOV Inspection Failed: ${e.message}`);
    }

    // 3. Real MOV -> MP4 Conversion with Progress Tracking
    console.log('\n🔄 3. Testing Real MOV → MP4 FFmpeg Conversion & Progress Tracking...');
    let maxProgressSeen = 0;
    try {
      const handle = convertMovToMp4(
        realMovPath,
        realMp4Path,
        { resolution: 'original', quality: 'balanced', fps: '30', audioBitrate: '192k' },
        (progressPercent) => {
          maxProgressSeen = Math.max(maxProgressSeen, progressPercent);
        }
      );

      const convertedMeta = await handle.promise;
      console.log(`     Output Format: ${convertedMeta.formatName} | Codecs: ${convertedMeta.videoCodec}/${convertedMeta.audioCodec} | Size: ${convertedMeta.fileSize} bytes`);

      assert(
        fs.existsSync(realMp4Path) &&
          convertedMeta.videoCodec === 'h264' &&
          convertedMeta.audioCodec === 'aac' &&
          convertedMeta.width === 640 &&
          convertedMeta.height === 360,
        'MOV → MP4 Converted Successfully to H.264 / AAC Container'
      );
      assert(maxProgressSeen > 0, `Real Progress Tracking Fired (Max progress: ${maxProgressSeen}%)`);
    } catch (e: any) {
      assert(false, `Conversion Failed: ${e.message}`);
    }

    // 4. Output MP4 Validation
    console.log('\n🛡️ 4. Testing Output MP4 Decodability & Integrity Validation...');
    try {
      const validatedMeta = await validateMp4Output(realMp4Path, sourceMeta!);
      assert(
        validatedMeta.videoCodec === 'h264' && validatedMeta.fileSize > 0,
        'Output MP4 Passed Strict ffprobe Integrity Validation'
      );
    } catch (e: any) {
      assert(false, `MP4 Validation Failed: ${e.message}`);
    }

    // 5. Cancellation Flow Test
    console.log('\n🛑 5. Testing Active Conversion Process Cancellation...');
    const longMovPath = path.join(TEST_DIR, 'test_long.mov');
    await generateRealMovFile(longMovPath, 15);

    try {
      const cancelHandle = convertMovToMp4(
        longMovPath,
        cancelMp4Path,
        { quality: 'high' }
      );

      // Cancel process after short delay so FFmpeg is actively running
      await new Promise((r) => setTimeout(r, 20));
      cancelHandle.cancel();

      let cancelCaught = false;
      try {
        await cancelHandle.promise;
      } catch (err: any) {
        cancelCaught = err.message.includes('cancelled');
      }

      const fileDeleted = !fs.existsSync(cancelMp4Path);
      assert(cancelCaught && fileDeleted, 'Active Conversion Cancelled Cleanly & Partial Files Removed');
    } catch (e: any) {
      assert(false, `Cancellation Test Failed: ${e.message}`);
    }

    // 6. Negative Test — Renamed TXT File
    console.log('\n⚠️ 6. Negative Test: Renamed Text File (.mov extension)...');
    fs.writeFileSync(textFakePath, 'This is a text file, not a real video container.');
    try {
      await probeVideo(textFakePath);
      assert(false, 'Failed to Reject Renamed Text File');
    } catch (e: any) {
      assert(
        e.message.includes('No media streams found') || e.message.includes('Invalid file') || e.message.includes('FFprobe'),
        'Renamed Text File Rejected with Helpful Validation Error'
      );
    }

    // 7. Negative Test — Empty 0-byte File
    console.log('\n⚠️ 7. Negative Test: Empty 0-byte File...');
    fs.writeFileSync(emptyFilePath, '');
    try {
      await probeVideo(emptyFilePath);
      assert(false, 'Failed to Reject 0-byte File');
    } catch (e: any) {
      assert(e.message.includes('empty'), 'Empty 0-byte File Rejected cleanly');
    }

  } finally {
    // Cleanup test files
    if (fs.existsSync(TEST_DIR)) {
      try {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVideoConversionTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
