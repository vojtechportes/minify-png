import type {
  MinifyPngOptions,
  RegionSummary,
} from '../types/minify-png-types';

export const posterizeRegionPixels = (
  data: Uint8ClampedArray,
  regionMask: Uint32Array,
  edgeMask: Uint8Array,
  regions: RegionSummary[],
  options: Required<MinifyPngOptions>
): { data: Uint8ClampedArray; posterizedPixelCount: number } => {
  const next = new Uint8ClampedArray(data);
  const acceptedRegions = new Map(
    regions
      .filter((region) => region.accepted)
      .map((region) => [region.id, region])
  );
  let posterizedPixelCount = 0;

  for (let pixelIndex = 0; pixelIndex < regionMask.length; pixelIndex += 1) {
    const region = acceptedRegions.get(regionMask[pixelIndex]);

    if (!region || edgeMask[pixelIndex] === 1) {
      continue;
    }

    const rgbaIndex = pixelIndex * 4;
    const alpha = options.preserveAlpha
      ? next[rgbaIndex + 3]
      : region.median[3];

    if (options.posterizeMode === 'quantize-bits') {
      const shift = Math.max(0, 8 - options.posterizeBitsPerChannel);
      next[rgbaIndex] = (region.median[0] >> shift) << shift;
      next[rgbaIndex + 1] = (region.median[1] >> shift) << shift;
      next[rgbaIndex + 2] = (region.median[2] >> shift) << shift;
    } else {
      next[rgbaIndex] = region.median[0];
      next[rgbaIndex + 1] = region.median[1];
      next[rgbaIndex + 2] = region.median[2];
    }

    next[rgbaIndex + 3] = alpha;
    posterizedPixelCount += 1;
  }

  return { data: next, posterizedPixelCount };
};
