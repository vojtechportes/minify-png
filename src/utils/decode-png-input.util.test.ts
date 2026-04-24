import { decodePngInput } from './decode-png-input.util';

describe('decodePngInput', () => {
  it('normalizes raw image input without decoding', async () => {
    const result = await decodePngInput({
      channels: 3,
      data: Uint8Array.from([1, 2, 3]),
      width: 1,
      height: 1,
    });

    expect(result.channels).toBe(4);
    expect(Array.from(result.data)).toEqual([1, 2, 3, 255]);
  });
});
