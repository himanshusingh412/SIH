import fs from 'fs';
import path from 'path';
import { prisma } from '../config';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'media');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
    const safeFilename = `${timePrefix}_${options.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filePath, options.buffer);

    const storageLocation = `/uploads/media/${safeFilename}`;

    const asset = await prisma.mediaAsset.create({
      data: {
        projectId: options.projectId,
        assetType: options.assetType,
        filename: options.filename,
        mimeType: options.mimeType,
        storageLocation,
        sizeBytes: options.buffer.length,
        provider: options.provider || 'local',
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });

    return {
      id: asset.id,
      storageLocation,
      sizeBytes: asset.sizeBytes,
      assetType: asset.assetType,
      createdAt: asset.createdAt,
    };
  }

  /**
   * List media assets for a project
   */
  async getProjectMediaAssets(projectId: string, assetType?: string) {
    return prisma.mediaAsset.findMany({
      where: {
        projectId,
        ...(assetType ? { assetType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const mediaService = new MediaService();
