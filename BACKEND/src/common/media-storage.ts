import { promises as fs } from 'fs';
import path from 'path';

export const uploadsRoot = path.join(process.cwd(), 'uploads');
export const publicMediaPrefix = '/media';

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

export async function ensureDirectory(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function buildBusinessMediaDirectory(businessId: string, scope: string) {
  return path.join(uploadsRoot, sanitizeSegment(businessId), sanitizeSegment(scope));
}

export function buildPublicMediaUrl(businessId: string, scope: string, filename: string) {
  return `${publicMediaPrefix}/${sanitizeSegment(businessId)}/${sanitizeSegment(scope)}/${filename}`;
}

export function buildStoredFilename(originalName: string) {
  const extension = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'asset', extension);
  const normalizedBase = sanitizeSegment(base) || 'asset';
  return `${Date.now()}-${normalizedBase}${extension}`;
}

export function toAbsoluteMediaPath(relativePath: string | null | undefined) {
  if (!relativePath) {
    return null;
  }

  return path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath);
}
