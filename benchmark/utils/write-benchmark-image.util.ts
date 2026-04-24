import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { encodeOptimizedPng, minifyPng } from '../../src/index';
import type { WikimediaCategory } from '../constants/default-wikimedia-categories';
import { maxBenchmarkImageDimension } from '../constants/wikimedia-benchmark.constants';
import type { BenchmarkImageRecord } from '../types/benchmark-types';
import { buildCategoryOutputPaths } from './build-category-output-paths.util';
import { downloadBuffer } from './download-buffer.util';
import { fetchImageInfo } from './fetch-image-info.util';
import { sanitizeFileSegment } from './sanitize-file-segment.util';

export const writeBenchmarkImage = async (
  category: WikimediaCategory,
  fileTitle: string
): Promise<BenchmarkImageRecord | null> => {
  const imageInfo = await fetchImageInfo(fileTitle);

  if (!imageInfo?.url || !imageInfo.mime) {
    return null;
  }

  const sourceBuffer = await downloadBuffer(imageInfo.url);
  const resizedImage = sharp(sourceBuffer).resize({
    fit: 'inside',
    height: maxBenchmarkImageDimension,
    width: maxBenchmarkImageDimension,
    withoutEnlargement: true,
  });
  const metadata = await resizedImage.metadata();
  const originalPngBuffer = await resizedImage.png().toBuffer();
  const minifiedImage = await minifyPng(originalPngBuffer);
  const compressedPngBuffer = await encodeOptimizedPng(minifiedImage);
  const fileBaseName = sanitizeFileSegment(fileTitle);
  const categoryPaths = buildCategoryOutputPaths(category.key);
  const originalFilePath = join(categoryPaths.original, `${fileBaseName}.png`);
  const compressedFilePath = join(
    categoryPaths.compressed,
    `${fileBaseName}.png`
  );

  await mkdir(categoryPaths.original, { recursive: true });
  await mkdir(categoryPaths.compressed, { recursive: true });
  await writeFile(originalFilePath, originalPngBuffer);
  await writeFile(compressedFilePath, compressedPngBuffer);

  return {
    category: category.key,
    compressedPngBytes: compressedPngBuffer.length,
    compressionRatio:
      compressedPngBuffer.length / Math.max(1, originalPngBuffer.length),
    fileTitle,
    height: metadata.height ?? 0,
    originalMime: imageInfo.mime,
    originalPngBytes: originalPngBuffer.length,
    sourceBytes: sourceBuffer.length,
    width: metadata.width ?? 0,
  };
};
