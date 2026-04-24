import { defaultMinifyPngOptions } from './constants/default-minify-png-options';
import type {
  MinifyPngOptions,
  MinifyPngResult,
  RawImageInput,
} from './types/minify-png-types';
import { decodePngInput } from './utils/decode-png-input.util';
import { detectEdgeMask } from './utils/detect-edge-mask.util';
import { findFlatSeedTiles } from './utils/find-flat-seed-tiles.util';
import { growFlatRegions } from './utils/grow-flat-regions.util';
import { posterizeRegionPixels } from './utils/posterize-region-pixels.util';

export const minifyPng = async (
  input: Buffer | Uint8Array | RawImageInput,
  options: MinifyPngOptions = {}
): Promise<MinifyPngResult> => {
  const resolvedOptions = { ...defaultMinifyPngOptions, ...options };
  const sourcePng =
    input instanceof Uint8Array && !('data' in input)
      ? Buffer.from(input)
      : undefined;
  const decoded = await decodePngInput(input);
  const edgeMask = detectEdgeMask(
    decoded.data,
    decoded.width,
    decoded.height,
    resolvedOptions
  );
  const { tileMask, seeds, candidateTileCount } = findFlatSeedTiles(
    decoded.data,
    decoded.width,
    decoded.height,
    edgeMask,
    resolvedOptions
  );
  const { regionMask, regions } = growFlatRegions(
    seeds,
    decoded.width,
    decoded.height,
    resolvedOptions
  );
  const { data, posterizedPixelCount } = posterizeRegionPixels(
    decoded.data as Uint8ClampedArray,
    regionMask,
    edgeMask,
    regions,
    resolvedOptions
  );
  const protectedPixelCount = edgeMask.reduce((sum, value) => sum + value, 0);
  const totalPixels = decoded.width * decoded.height;
  const edgeRatio = totalPixels === 0 ? 0 : protectedPixelCount / totalPixels;
  const acceptedTileRatio =
    candidateTileCount === 0 ? 0 : seeds.length / candidateTileCount;
  const posterizedPixelRatio =
    totalPixels === 0 ? 0 : posterizedPixelCount / totalPixels;
  const photoLike =
    edgeRatio > 0.3 ||
    acceptedTileRatio < 0.35 ||
    (sourcePng !== undefined &&
      edgeRatio < 0.12 &&
      posterizedPixelRatio < 0.05) ||
    (edgeRatio > 0.2 && posterizedPixelRatio < 0.12);
  const posterizationSkipped = photoLike;

  return {
    width: decoded.width,
    height: decoded.height,
    channels: 4,
    data: posterizationSkipped ? new Uint8ClampedArray(decoded.data) : data,
    encodeHints: {
      qualityMode: options.qualityMode,
    },
    sourcePng,
    stats: {
      edgePixelCount: protectedPixelCount,
      candidateTileCount,
      acceptedTileCount: seeds.length,
      photoLike,
      regionCount: regions.length,
      posterizedPixelCount: posterizationSkipped ? 0 : posterizedPixelCount,
      posterizationSkipped,
      protectedPixelCount,
    },
    debug: resolvedOptions.outputDebug
      ? {
          edgeMask,
          tileMask,
          regionMask,
          gradientMask: Uint8Array.from(
            regions.map((region) => (region.gradientRejected ? 1 : 0))
          ),
        }
      : undefined,
  };
};
