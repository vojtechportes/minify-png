import type { RawImageInput } from '../types/minify-png-types';

export const normalizeRawImageInput = (input: RawImageInput): RawImageInput => {
  if (input.channels === 4) {
    return {
      channels: 4,
      data: new Uint8ClampedArray(input.data),
      height: input.height,
      width: input.width,
    };
  }

  const rgba = new Uint8ClampedArray(input.width * input.height * 4);

  for (
    let sourceIndex = 0, targetIndex = 0;
    sourceIndex < input.data.length;
    sourceIndex += 3, targetIndex += 4
  ) {
    rgba[targetIndex] = input.data[sourceIndex];
    rgba[targetIndex + 1] = input.data[sourceIndex + 1];
    rgba[targetIndex + 2] = input.data[sourceIndex + 2];
    rgba[targetIndex + 3] = 255;
  }

  return {
    channels: 4,
    data: rgba,
    height: input.height,
    width: input.width,
  };
};
