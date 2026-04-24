import type { WikimediaCategory } from '../constants/default-wikimedia-categories';

export type WikimediaCategoryMember = {
  title: string;
};

export type WikimediaImageInfo = {
  mime?: string;
  size?: number;
  url?: string;
};

export type WikimediaPage = {
  imageinfo?: WikimediaImageInfo[];
  title: string;
};

export type BenchmarkImageCandidate = {
  category: WikimediaCategory;
  fileTitle: string;
};

export type BenchmarkImageRecord = {
  category: string;
  compressedPngBytes: number;
  compressionRatio: number;
  fileTitle: string;
  height: number;
  originalMime: string;
  originalPngBytes: number;
  sourceBytes: number;
  width: number;
};

export type BenchmarkResults = {
  generatedAt: string;
  images: BenchmarkImageRecord[];
  summary: {
    averageCompressionRatio: number;
    categories: Record<
      string,
      {
        averageCompressionRatio: number;
        count: number;
        totalCompressedPngBytes: number;
        totalOriginalPngBytes: number;
      }
    >;
    count: number;
    totalCompressedPngBytes: number;
    totalOriginalPngBytes: number;
  };
};
