import type {
  BenchmarkImageRecord,
  BenchmarkResults,
} from '../types/benchmark-types';

export const summarizeBenchmarkResults = (
  images: BenchmarkImageRecord[]
): BenchmarkResults['summary'] => {
  const categories: BenchmarkResults['summary']['categories'] = {};
  let totalCompressedPngBytes = 0;
  let totalOriginalPngBytes = 0;

  for (const image of images) {
    totalCompressedPngBytes += image.compressedPngBytes;
    totalOriginalPngBytes += image.originalPngBytes;

    if (!categories[image.category]) {
      categories[image.category] = {
        averageCompressionRatio: 0,
        count: 0,
        totalCompressedPngBytes: 0,
        totalOriginalPngBytes: 0,
      };
    }

    const categorySummary = categories[image.category]!;
    categorySummary.count += 1;
    categorySummary.totalCompressedPngBytes += image.compressedPngBytes;
    categorySummary.totalOriginalPngBytes += image.originalPngBytes;
  }

  for (const categorySummary of Object.values(categories)) {
    categorySummary.averageCompressionRatio =
      categorySummary.totalCompressedPngBytes /
      Math.max(1, categorySummary.totalOriginalPngBytes);
  }

  return {
    averageCompressionRatio:
      totalCompressedPngBytes / Math.max(1, totalOriginalPngBytes),
    categories,
    count: images.length,
    totalCompressedPngBytes,
    totalOriginalPngBytes,
  };
};
