import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { probeVideo, convertMovToMp4, ConversionHandle } from '../engine/formatEngine/converters/videoConverter';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

import os from 'os';

// Configure isolated upload storage safely for serverless environments
const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads', 'media')
  : path.join(process.cwd(), 'uploads', 'media');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e: any) {
  console.warn('⚠️ Media upload directory creation warning:', e?.message || e);
}

export const uploadMiddleware = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max video file
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.mov' || ext === '.qt' || file.mimetype.includes('quicktime') || file.mimetype.includes('video')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MOV video files (.mov) are supported.'));
    }
  },
});

// Memory map of active conversion handles for instant cancellation
const activeConversions = new Map<string, ConversionHandle>();

/**
 * POST /api/media/upload
 * Upload and probe MOV video asset
 */
export const uploadSourceMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No video file provided in request body.', 400, 'NO_FILE');
      return;
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();

    // Enforce .mov extension check
    if (ext !== '.mov' && ext !== '.qt') {
      if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch (_) {}
      sendError(res, 'Invalid file format: File extension must be .mov', 400, 'INVALID_FORMAT');
      return;
    }

    // Inspect video metadata with ffprobe
    let metadata;
    try {
      metadata = await probeVideo(filePath);
    } catch (probeErr: any) {
      if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch (_) {}
      sendError(res, `Input Validation Failed: ${probeErr.message}`, 400, 'PROBE_FAILED');
      return;
    }

    const projectId = req.body.projectId ? String(req.body.projectId) : null;

    // Create MediaAsset record in Database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        projectId,
        assetType: 'VIDEO',
        filename: path.basename(filePath),
        mimeType: req.file.mimetype || 'video/quicktime',
        storageLocation: filePath,
        sizeBytes: metadata.fileSize,
        provider: 'local',
        metadata: JSON.stringify({
          originalName,
          format: 'mov',
          width: metadata.width,
          height: metadata.height,
          duration: metadata.duration,
          videoCodec: metadata.videoCodec,
          audioCodec: metadata.audioCodec,
          fps: metadata.fps,
          bitrate: metadata.bitrate,
        }),
      },
    });

    sendSuccess(res, {
      mediaAsset: {
        id: mediaAsset.id,
        filename: originalName,
        storagePath: filePath,
        fileSize: metadata.fileSize,
        metadata,
      },
    });
  } catch (err: any) {
    sendError(res, `Upload processing failed: ${err.message}`, 500, 'UPLOAD_FAILED');
  }
};

/**
 * POST /api/media/convert
 * Trigger MOV -> MP4 video conversion
 */
export const convertMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sourceAssetId,
      targetFormat = 'mp4',
      resolution = 'original',
      quality = 'balanced',
      fps = 'original',
      audioBitrate = '192k',
      projectId = null,
    } = req.body;

    if (!sourceAssetId) {
      sendError(res, 'sourceAssetId is required.', 400, 'INVALID_REQUEST');
      return;
    }

    if (String(targetFormat).toLowerCase() !== 'mp4') {
      sendError(res, 'Unsupported target format. Only MP4 conversion is supported.', 400, 'UNSUPPORTED_FORMAT');
      return;
    }

    const sourceIdStr = String(sourceAssetId);

    // Fetch source media asset from DB
    const sourceAsset = await prisma.mediaAsset.findUnique({
      where: { id: sourceIdStr },
    });

    if (!sourceAsset) {
      sendError(res, 'Source media asset not found.', 404, 'ASSET_NOT_FOUND');
      return;
    }

    if (!fs.existsSync(sourceAsset.storageLocation)) {
      sendError(res, 'Source video file missing from server storage.', 404, 'FILE_NOT_FOUND');
      return;
    }

    const parsedSourceMeta = sourceAsset.metadata ? JSON.parse(sourceAsset.metadata) : {};
    const targetProjId = projectId ? String(projectId) : sourceAsset.projectId;

    // Create MediaConversion record in Database
    const conversion = await prisma.mediaConversion.create({
      data: {
        projectId: targetProjId,
        sourceAssetId: sourceAsset.id,
        sourceFormat: 'mov',
        targetFormat: 'mp4',
        status: 'PROCESSING',
        progress: 0,
        sourceSize: sourceAsset.sizeBytes,
        sourceDuration: parsedSourceMeta.duration || 0,
        sourceCodec: parsedSourceMeta.videoCodec || 'unknown',
      },
    });

    const outputFilename = `converted_${conversion.id}.mp4`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Launch async FFmpeg conversion with progress reporting
    const handle = convertMovToMp4(
      sourceAsset.storageLocation,
      outputPath,
      { resolution, quality, fps, audioBitrate },
      async (percent) => {
        // Update database progress
        try {
          await prisma.mediaConversion.update({
            where: { id: conversion.id },
            data: { progress: percent },
          });
        } catch (_) {}
      }
    );

    // Store handle in active conversions memory map
    activeConversions.set(conversion.id, handle);

    // Attach completion/failure callback handlers
    handle.promise
      .then(async (outputMeta) => {
        activeConversions.delete(conversion.id);

        // Create output MediaAsset DB record
        const outputAsset = await prisma.mediaAsset.create({
          data: {
            projectId: targetProjId,
            assetType: 'VIDEO',
            filename: outputFilename,
            mimeType: 'video/mp4',
            storageLocation: outputPath,
            sizeBytes: outputMeta.fileSize,
            provider: 'local',
            metadata: JSON.stringify({
              originalName: `${path.parse(parsedSourceMeta.originalName || 'video.mov').name}.mp4`,
              format: 'mp4',
              width: outputMeta.width,
              height: outputMeta.height,
              duration: outputMeta.duration,
              videoCodec: outputMeta.videoCodec,
              audioCodec: outputMeta.audioCodec,
              fps: outputMeta.fps,
              bitrate: outputMeta.bitrate,
            }),
          },
        });

        // Mark conversion COMPLETED in DB
        await prisma.mediaConversion.update({
          where: { id: conversion.id },
          data: {
            status: 'COMPLETED',
            progress: 100,
            outputAssetId: outputAsset.id,
            outputSize: outputMeta.fileSize,
            outputDuration: outputMeta.duration,
            outputCodec: outputMeta.videoCodec,
            completedAt: new Date(),
          },
        });
      })
      .catch(async (err: any) => {
        activeConversions.delete(conversion.id);
        const isCancel = err.message && err.message.includes('cancelled');

        try {
          await prisma.mediaConversion.update({
            where: { id: conversion.id },
            data: {
              status: isCancel ? 'CANCELLED' : 'FAILED',
              error: err.message || 'Conversion process failed',
              progress: 0,
            },
          });
        } catch (_) {}
      });

    res.status(202);
    sendSuccess(res, {
      conversionId: conversion.id,
      status: 'PROCESSING',
      progress: 0,
      sourceAsset: {
        id: sourceAsset.id,
        filename: parsedSourceMeta.originalName || sourceAsset.filename,
        sizeBytes: sourceAsset.sizeBytes,
        metadata: parsedSourceMeta,
      },
    }, 202);
  } catch (err: any) {
    sendError(res, `Conversion request failed: ${err.message}`, 500, 'CONVERSION_FAILED');
  }
};

/**
 * GET /api/media/conversions/:id
 * Fetch conversion job status, progress, and output details
 */
export const getConversionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conversion = (await prisma.mediaConversion.findUnique({
      where: { id },
      include: {
        sourceAsset: true,
        outputAsset: true,
      },
    })) as any;

    if (!conversion) {
      sendError(res, 'Media conversion job not found.', 404, 'NOT_FOUND');
      return;
    }

    sendSuccess(res, {
      conversion: {
        id: conversion.id,
        status: conversion.status,
        progress: conversion.progress,
        error: conversion.error,
        sourceFormat: conversion.sourceFormat,
        targetFormat: conversion.targetFormat,
        sourceSize: conversion.sourceSize,
        outputSize: conversion.outputSize,
        sourceDuration: conversion.sourceDuration,
        outputDuration: conversion.outputDuration,
        sourceCodec: conversion.sourceCodec,
        outputCodec: conversion.outputCodec,
        createdAt: conversion.createdAt,
        completedAt: conversion.completedAt,
        sourceAsset: conversion.sourceAsset,
        outputAsset: conversion.outputAsset,
      },
    });
  } catch (err: any) {
    sendError(res, `Failed to fetch conversion status: ${err.message}`, 500, 'GET_STATUS_FAILED');
  }
};

/**
 * POST /api/media/conversions/:id/cancel
 * Cancel an active running conversion
 */
export const cancelConversion = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conversion = await prisma.mediaConversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      sendError(res, 'Media conversion job not found.', 404, 'NOT_FOUND');
      return;
    }

    if (conversion.status === 'PROCESSING' || conversion.status === 'QUEUED') {
      const handle = activeConversions.get(id);
      if (handle) {
        handle.cancel();
        activeConversions.delete(id);
      }

      await prisma.mediaConversion.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          progress: 0,
          completedAt: new Date(),
          error: 'Conversion cancelled by user request',
        },
      });
    }

    sendSuccess(res, { message: 'Conversion process cancelled successfully.' });
  } catch (err: any) {
    sendError(res, `Failed to cancel conversion: ${err.message}`, 500, 'CANCEL_FAILED');
  }
};

/**
 * GET /api/media/stream/:id
 * Stream video file with Range header support for browser HTML5 playback
 */
export const streamMediaFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!mediaAsset || !fs.existsSync(mediaAsset.storageLocation)) {
      sendError(res, 'Media asset file not found on server.', 404, 'NOT_FOUND');
      return;
    }

    const filePath = mediaAsset.storageLocation;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mediaAsset.mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mediaAsset.mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    sendError(res, `Streaming failed: ${err.message}`, 500, 'STREAM_FAILED');
  }
};

/**
 * GET /api/media/download/:id
 * Download real converted video file
 */
export const downloadMediaFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!mediaAsset || !fs.existsSync(mediaAsset.storageLocation)) {
      sendError(res, 'Media asset file not found on server.', 404, 'NOT_FOUND');
      return;
    }

    const parsedMeta = mediaAsset.metadata ? JSON.parse(mediaAsset.metadata) : {};
    const downloadName = parsedMeta.originalName || mediaAsset.filename;

    res.download(mediaAsset.storageLocation, downloadName);
  } catch (err: any) {
    sendError(res, `Download failed: ${err.message}`, 500, 'DOWNLOAD_FAILED');
  }
};

/**
 * GET /api/media
 * List all Media Assets & Conversions for Media Library
 */
export const listMediaAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const projIdStr = typeof projectId === 'string' ? projectId : undefined;
    const whereCondition = projIdStr ? { projectId: projIdStr } : {};

    const assets = await prisma.mediaAsset.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    const conversions = await prisma.mediaConversion.findMany({
      where: whereCondition,
      include: {
        sourceAsset: true,
        outputAsset: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { assets, conversions });
  } catch (err: any) {
    sendError(res, `Failed to list media library: ${err.message}`, 500, 'LIST_MEDIA_FAILED');
  }
};

/**
 * DELETE /api/media/:id
 * Delete Media Asset and associated file from disk
 */
export const deleteMediaAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      sendError(res, 'Media asset not found.', 404, 'NOT_FOUND');
      return;
    }

    if (fs.existsSync(asset.storageLocation)) {
      try { fs.unlinkSync(asset.storageLocation); } catch (_) {}
    }

    await prisma.mediaAsset.delete({ where: { id } });

    sendSuccess(res, { message: 'Media asset deleted successfully.' });
  } catch (err: any) {
    sendError(res, `Failed to delete media asset: ${err.message}`, 500, 'DELETE_MEDIA_FAILED');
  }
};
