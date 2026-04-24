import { defaultMinifyPngOptions } from '../constants/default-minify-png-options';
import type {
  AnalyzeOptions,
  AnalyzeResult,
  RawImageInput,
} from '../types/minify-png-types';
import { decodePngInput } from './decode-png-input.util';
import { detectEdgeMask } from './detect-edge-mask.util';
import { findFlatSeedTiles } from './find-flat-seed-tiles.util';
import { growFlatRegions } from './grow-flat-regions.util';

export const analyzeFlatRegions = async (
  input: Buffer | Uint8Array | RawImageInput,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResult> => {
  const resolvedOptions = { ...defaultMinifyPngOptions, ...options };
  const decoded = await decodePngInput(input);
  const edgeMask = detectEdgeMask(
    decoded.data,
    decoded.width,
    decoded.height,
    resolvedOptions
  );
  const { tileMask, seeds } = findFlatSeedTiles(
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

  return {
    edgeMask,
    tileMask,
    regionMask,
    regions,
  };
};
