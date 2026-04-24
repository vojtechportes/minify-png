import { Buffer } from 'node:buffer';
import type { RawImageInput } from '../types/minify-png-types';
import { normalizeRawImageInput } from './normalize-raw-image-input.util';

export const decodePngInput = async (
  input: Buffer | Uint8Array | RawImageInput
): Promise<RawImageInput> => {
  if (typeof (input as RawImageInput).width === 'number') {
    return normalizeRawImageInput(input as RawImageInput);
  }

  const pngBuffer = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input as Uint8Array);

  try {
    const sharpModule = await import('sharp');
    const result = await sharpModule
      .default(pngBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return normalizeRawImageInput({
      channels: 4,
      data: new Uint8ClampedArray(result.data),
      height: result.info.height,
      width: result.info.width,
    });
  } catch {
    const pngjsModule = await import('pngjs');
    const decoded = pngjsModule.PNG.sync.read(pngBuffer);

    return normalizeRawImageInput({
      channels: 4,
      data: new Uint8ClampedArray(decoded.data),
      height: decoded.height,
      width: decoded.width,
    });
  }
};
