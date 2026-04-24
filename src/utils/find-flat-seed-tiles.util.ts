import type { MinifyPngOptions, TileSeed } from '../types/minify-png-types';
import { calculateColorDistance } from './calculate-color-distance.util';
import { resolveRepresentativeColor } from './resolve-representative-color.util';

export const findFlatSeedTiles = (
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  edgeMask: Uint8Array,
  options: Required<MinifyPngOptions>
): { tileMask: Uint8Array; seeds: TileSeed[]; candidateTileCount: number } => {
  const tileColumns = Math.ceil(width / options.tileSize);
  const tileRows = Math.ceil(height / options.tileSize);
  const tileMask = new Uint8Array(tileColumns * tileRows);
  const seeds: TileSeed[] = [];
  let candidateTileCount = 0;
  let seedId = 1;

  for (let tileY = 0; tileY < tileRows; tileY += 1) {
    for (let tileX = 0; tileX < tileColumns; tileX += 1) {
      const startX = tileX * options.tileSize;
      const startY = tileY * options.tileSize;
      const endX = Math.min(startX + options.tileSize, width);
      const endY = Math.min(startY + options.tileSize, height);
      const pixels: number[][] = [];
      const pixelIndexes: number[] = [];
      const columnBrightnessBuckets = new Map<number, number[]>();
      const rowBrightnessBuckets = new Map<number, number[]>();
      const tileArea = (endX - startX) * (endY - startY);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const pixelIndex = y * width + x;

          if (edgeMask[pixelIndex] === 1) {
            continue;
          }

          let protectedNeighbor = false;

          for (
            let offsetY = -options.protectedEdgeDistance;
            offsetY <= options.protectedEdgeDistance;
            offsetY += 1
          ) {
            for (
              let offsetX = -options.protectedEdgeDistance;
              offsetX <= options.protectedEdgeDistance;
              offsetX += 1
            ) {
              const sampleX = x + offsetX;
              const sampleY = y + offsetY;

              if (
                sampleX < 0 ||
                sampleY < 0 ||
                sampleX >= width ||
                sampleY >= height
              ) {
                continue;
              }

              if (edgeMask[sampleY * width + sampleX] === 1) {
                protectedNeighbor = true;
              }
            }
          }

          if (protectedNeighbor) {
            continue;
          }

          const rgbaIndex = pixelIndex * 4;
          const brightness =
            (data[rgbaIndex] + data[rgbaIndex + 1] + data[rgbaIndex + 2]) / 3;
          pixels.push([
            data[rgbaIndex],
            data[rgbaIndex + 1],
            data[rgbaIndex + 2],
            data[rgbaIndex + 3],
          ]);
          pixelIndexes.push(pixelIndex);
          const rowBucket = rowBrightnessBuckets.get(y - startY) ?? [];
          rowBucket.push(brightness);
          rowBrightnessBuckets.set(y - startY, rowBucket);
          const columnBucket = columnBrightnessBuckets.get(x - startX) ?? [];
          columnBucket.push(brightness);
          columnBrightnessBuckets.set(x - startX, columnBucket);
        }
      }

      if (pixels.length === 0) {
        continue;
      }

      candidateTileCount += 1;

      if (
        pixels.length / tileArea < options.minUsableInteriorRatio ||
        pixels.length < options.seedMinArea
      ) {
        continue;
      }

      const representative = resolveRepresentativeColor(pixels);
      const distances = pixels
        .map((pixel) =>
          calculateColorDistance(
            representative,
            pixel as [number, number, number, number],
            options.alphaMode === 'premultiplied'
          )
        )
        .sort((left, right) => left - right);
      const alphaValues = pixels
        .map((pixel) => pixel[3])
        .sort((left, right) => left - right);
      const maxDistance = distances[distances.length - 1] ?? 0;
      const p95Distance =
        distances[
          Math.min(distances.length - 1, Math.floor(distances.length * 0.95))
        ] ?? 0;
      const alphaRange =
        (alphaValues[alphaValues.length - 1] ?? 0) - (alphaValues[0] ?? 0);
      const calculateAxisDrift = (buckets: Map<number, number[]>): number => {
        if (buckets.size < 3) {
          return 0;
        }

        const ordered = [...buckets.entries()]
          .sort((left, right) => left[0] - right[0])
          .map(
            ([, values]) =>
              values.reduce((sum, value) => sum + value, 0) / values.length
          );
        let positiveSteps = 0;
        let negativeSteps = 0;

        for (let index = 1; index < ordered.length; index += 1) {
          const delta = ordered[index]! - ordered[index - 1]!;

          if (delta > 0.5) {
            positiveSteps += 1;
          } else if (delta < -0.5) {
            negativeSteps += 1;
          }
        }

        const coherence =
          Math.max(positiveSteps, negativeSteps) /
          Math.max(1, ordered.length - 1);

        return coherence >= 0.75
          ? Math.abs((ordered[ordered.length - 1] ?? 0) - (ordered[0] ?? 0))
          : 0;
      };
      const rowDrift = calculateAxisDrift(rowBrightnessBuckets);
      const columnDrift = calculateAxisDrift(columnBrightnessBuckets);

      if (
        maxDistance > options.flatnessMaxDistance ||
        p95Distance > options.flatnessP95Distance ||
        alphaRange > options.flatnessAlphaRange ||
        rowDrift > options.gradientMaxDirectionalDrift ||
        columnDrift > options.gradientMaxDirectionalDrift
      ) {
        continue;
      }

      const tileIndex = tileY * tileColumns + tileX;
      tileMask[tileIndex] = 1;
      seeds.push({
        id: seedId,
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
        tileX,
        tileY,
        representative,
        pixelIndexes,
        p95Distance,
        maxDistance,
        alphaRange,
      });
      seedId += 1;
    }
  }

  return { tileMask, seeds, candidateTileCount };
};
