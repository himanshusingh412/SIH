import fs from 'fs';
import path from 'path';
import os from 'os';
import { prisma } from '../config';

const UPLOADS_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads', 'media')
  : path.join(process.cwd(), 'uploads', 'media');

// Ensure upload directory exists safely
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Ignore read-only filesystem errors on serverless functions
}

export class MediaService {
  /**
   * Save a buffer as a local file asset and register in MediaAsset DB table
   */
  async saveMediaAsset(options: {
    projectId: string;
    assetType: 'AUDIO' | 'VIDEO' | 'IMAGE' | 'TRANSCRIPT' | 'PRESENTATION';
    filename: string;
    mimeType: string;
    buffer: Buffer;
    provider?: string;
    metadata?: Record<string, any>;
  }) {
    const timePrefix = Date.now();
    const safeFilename = `${timePrefix}_${options.filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      fs.writeFileSync(filePath, options.buffer);
    } catch {
      // Fallback for serverless
    }

    const publicUrl = `/api/audio/assets/${safeFilename}`;

    // Register DB record if project exists
    try {
      const asset = await prisma.mediaAsset.create({
        data: {
          projectId: options.projectId,
          assetType: options.assetType,
          filename: safeFilename,
          mimeType: options.mimeType,
          storageLocation: filePath,
          sizeBytes: options.buffer.length,
          provider: options.provider || 'local',
          metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        },
      });
      return { asset: { ...asset, url: publicUrl }, filePath, publicUrl };
    } catch {
      return {
        asset: {
          id: `media-${timePrefix}`,
          projectId: options.projectId,
          assetType: options.assetType,
          filename: safeFilename,
          mimeType: options.mimeType,
          storageLocation: filePath,
          sizeBytes: options.buffer.length,
          provider: options.provider || 'local',
          metadata: options.metadata ? JSON.stringify(options.metadata) : null,
          url: publicUrl,
        },
        filePath,
        publicUrl,
      };
    }
  }

  async getProjectMediaAssets(projectId: string) {
    try {
      const assets = await prisma.mediaAsset.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
      return assets.map((a) => ({
        ...a,
        url: `/api/audio/assets/${a.filename}`,
      }));
    } catch {
      return [];
    }
  }
}

export const mediaService = new MediaService();
