import type {
  MinifyPngOptions,
  RegionSummary,
  TileSeed,
} from '../types/minify-png-types';
import { calculateColorDistance } from './calculate-color-distance.util';
import { isGradientLikeRegion } from './is-gradient-like-region.util';
import { resolveRepresentativeColor } from './resolve-representative-color.util';

export const growFlatRegions = (
  seeds: TileSeed[],
  width: number,
  height: number,
  options: Required<MinifyPngOptions>
): { regionMask: Uint32Array; regions: RegionSummary[] } => {
  const seedByTile = new Map(
    seeds.map((seed) => [`${seed.tileX}:${seed.tileY}`, seed] as const)
  );
  const visited = new Set<number>();
  const regionMask = new Uint32Array(width * height);
  const regions: RegionSummary[] = [];
  let regionId = 1;

  for (const seed of seeds) {
    if (visited.has(seed.id)) {
      continue;
    }

    const queue = [seed];
    const regionSeeds: TileSeed[] = [];
    visited.add(seed.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      regionSeeds.push(current);

      for (const [offsetX, offsetY] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const neighbor = seedByTile.get(
          `${current.tileX + offsetX}:${current.tileY + offsetY}`
        );

        if (!neighbor || visited.has(neighbor.id)) {
          continue;
        }

        const colorDistance = calculateColorDistance(
          current.representative,
          neighbor.representative,
          options.alphaMode === 'premultiplied'
        );
        const alphaDistance = Math.abs(
          current.representative[3] - neighbor.representative[3]
        );

        if (
          colorDistance > options.regionColorMergeThreshold ||
          alphaDistance > options.regionAlphaMergeThreshold
        ) {
          continue;
        }

        visited.add(neighbor.id);
        queue.push(neighbor);
      }
    }

    const allPixels = regionSeeds.flatMap(
      (regionSeed) => regionSeed.pixelIndexes
    );
    const thickness = Math.min(
      Math.max(1, ...regionSeeds.map((regionSeed) => regionSeed.width)),
      Math.max(1, ...regionSeeds.map((regionSeed) => regionSeed.height))
    );
    const representatives = regionSeeds.map((regionSeed) => [
      ...regionSeed.representative,
    ]);
    const median = resolveRepresentativeColor(representatives);
    const representativeDistances = representatives
      .map((representative) =>
        calculateColorDistance(
          median,
          representative as [number, number, number, number],
          options.alphaMode === 'premultiplied'
        )
      )
      .sort((left, right) => left - right);
    const p95Distance = Math.max(
      ...regionSeeds.map((regionSeed) => regionSeed.p95Distance)
    );
    const maxDistance = Math.max(
      ...regionSeeds.map((regionSeed) => regionSeed.maxDistance)
    );
    const alphaRange = Math.max(
      ...regionSeeds.map((regionSeed) => regionSeed.alphaRange)
    );
    const representativeP95Distance =
      representativeDistances[
        Math.min(
          representativeDistances.length - 1,
          Math.floor(representativeDistances.length * 0.95)
        )
      ] ?? 0;
    const representativeMaxDistance =
      representativeDistances[representativeDistances.length - 1] ?? 0;
    const bboxX = Math.min(...regionSeeds.map((regionSeed) => regionSeed.x));
    const bboxY = Math.min(...regionSeeds.map((regionSeed) => regionSeed.y));
    const bboxRight = Math.max(
      ...regionSeeds.map((regionSeed) => regionSeed.x + regionSeed.width)
    );
    const bboxBottom = Math.max(
      ...regionSeeds.map((regionSeed) => regionSeed.y + regionSeed.height)
    );
    const gradientRejected = isGradientLikeRegion(regionSeeds, options);
    const accepted =
      allPixels.length >= options.minRegionArea &&
      thickness >= options.minRegionThickness &&
      representativeP95Distance <= options.flatnessP95Distance &&
      representativeMaxDistance <= options.flatnessMaxDistance &&
      !gradientRejected;

    if (accepted) {
      for (const pixelIndex of allPixels) {
        regionMask[pixelIndex] = regionId;
      }
    }

    regions.push({
      id: regionId,
      area: allPixels.length,
      bbox: {
        x: bboxX,
        y: bboxY,
        width: bboxRight - bboxX,
        height: bboxBottom - bboxY,
      },
      median,
      p95Distance,
      maxDistance,
      alphaRange,
      gradientRejected,
      accepted,
    });
    regionId += 1;
  }

  return { regionMask, regions };
};
