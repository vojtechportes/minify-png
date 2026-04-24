import type { MinifyPngOptions } from '../types/minify-png-types';
import { calculateColorDistance } from './calculate-color-distance.util';
import { dilateMask } from './dilate-mask.util';

export const detectEdgeMask = (
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options: Required<MinifyPngOptions>
): Uint8Array => {
  const edgeMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const rgbaIndex = index * 4;
      const current: [number, number, number, number] = [
        data[rgbaIndex],
        data[rgbaIndex + 1],
        data[rgbaIndex + 2],
        data[rgbaIndex + 3],
      ];

      if (x + 1 < width) {
        const rightIndex = rgbaIndex + 4;
        const right: [number, number, number, number] = [
          data[rightIndex],
          data[rightIndex + 1],
          data[rightIndex + 2],
          data[rightIndex + 3],
        ];

        if (
          calculateColorDistance(
            current,
            right,
            options.alphaMode === 'premultiplied'
          ) > options.edgeThresholdColor ||
          Math.abs(current[3] - right[3]) > options.edgeThresholdAlpha
        ) {
          edgeMask[index] = 1;
          edgeMask[index + 1] = 1;
        }
      }

      if (y + 1 < height) {
        const bottomIndex = rgbaIndex + width * 4;
        const bottom: [number, number, number, number] = [
          data[bottomIndex],
          data[bottomIndex + 1],
          data[bottomIndex + 2],
          data[bottomIndex + 3],
        ];

        if (
          calculateColorDistance(
            current,
            bottom,
            options.alphaMode === 'premultiplied'
          ) > options.edgeThresholdColor ||
          Math.abs(current[3] - bottom[3]) > options.edgeThresholdAlpha
        ) {
          edgeMask[index] = 1;
          edgeMask[index + width] = 1;
        }
      }
    }
  }

  return dilateMask(edgeMask, width, height, options.edgeDilateRadius);
};
