import { normalizeRawImageInput } from './normalize-raw-image-input.util';

describe('normalizeRawImageInput', () => {
  it('adds opaque alpha to RGB buffers', () => {
    const normalized = normalizeRawImageInput({
      channels: 3,
      data: Uint8Array.from([1, 2, 3, 4, 5, 6]),
      width: 2,
      height: 1,
    });

    expect(Array.from(normalized.data)).toEqual([1, 2, 3, 255, 4, 5, 6, 255]);
  });
});
