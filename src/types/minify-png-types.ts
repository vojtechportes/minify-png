export interface RawImageInput {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: 3 | 4;
}

export type EncodeQualityMode = 'strict' | 'balanced' | 'aggressive';

export interface MinifyPngOptions {
  tileSize?: number;
  edgeThresholdColor?: number;
  edgeThresholdAlpha?: number;
  edgeDilateRadius?: number;
  minUsableInteriorRatio?: number;
  flatnessMaxDistance?: number;
  flatnessP95Distance?: number;
  flatnessAlphaRange?: number;
  seedMinArea?: number;
  regionColorMergeThreshold?: number;
  regionAlphaMergeThreshold?: number;
  gradientRejectionEnabled?: boolean;
  gradientMaxDirectionalDrift?: number;
  minRegionArea?: number;
  minRegionThickness?: number;
  protectedEdgeDistance?: number;
  posterizeMode?: 'snap-to-median' | 'snap-to-mean' | 'quantize-bits';
  posterizeBitsPerChannel?: number;
  preserveAlpha?: boolean;
  alphaMode?: 'straight' | 'premultiplied';
  dither?: 'none' | 'adaptive';
  outputMask?: boolean;
  outputDebug?: boolean;
  qualityMode?: EncodeQualityMode;
}

export type AnalyzeOptions = MinifyPngOptions;

export interface RegionSummary {
  id: number;
  area: number;
  bbox: { x: number; y: number; width: number; height: number };
  median: [number, number, number, number];
  p95Distance: number;
  maxDistance: number;
  alphaRange: number;
  gradientRejected: boolean;
  accepted: boolean;
}

export interface AnalyzeResult {
  edgeMask: Uint8Array;
  tileMask: Uint8Array;
  regionMask: Uint32Array;
  regions: RegionSummary[];
}

export interface MinifyPngResult {
  width: number;
  height: number;
  channels: 4;
  data: Uint8ClampedArray;
  encodeHints?: {
    qualityMode?: EncodeQualityMode;
  };
  sourcePng?: Buffer;
  stats: {
    edgePixelCount: number;
    candidateTileCount: number;
    acceptedTileCount: number;
    photoLike: boolean;
    regionCount: number;
    posterizedPixelCount: number;
    posterizationSkipped: boolean;
    protectedPixelCount: number;
  };
  debug?: {
    edgeMask?: Uint8Array;
    tileMask?: Uint8Array;
    regionMask?: Uint32Array;
    gradientMask?: Uint8Array;
  };
}

export interface PngquantOptions {
  binaryPath?: string;
  colors?: number;
  quality?: readonly [number, number];
  speed?: number;
}

export interface EncodeOptions {
  compressionLevel?: number;
  filterType?: number;
  adaptiveFiltering?: boolean;
  colors?: number;
  debugLogger?: (message: string) => void;
  effort?: number;
  palette?: boolean;
  quality?: number;
  pngquant?: boolean | PngquantOptions;
  qualityMode?: EncodeQualityMode;
}

export interface TileSeed {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tileX: number;
  tileY: number;
  representative: [number, number, number, number];
  pixelIndexes: number[];
  p95Distance: number;
  maxDistance: number;
  alphaRange: number;
}
