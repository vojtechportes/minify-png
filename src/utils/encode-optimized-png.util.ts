import { Buffer } from 'node:buffer';
import type {
  EncodeQualityMode,
  EncodeOptions,
  MinifyPngResult,
  PngquantOptions,
  RawImageInput,
} from '../types/minify-png-types';
import { encodeWithPngquant } from './encode-with-pngquant.util';
import { normalizeRawImageInput } from './normalize-raw-image-input.util';

const hasTransparentPixels = (data: Uint8ClampedArray): boolean => {
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] !== 255) {
      return true;
    }
  }

  return false;
};

const defaultVisualThresholds = {
  averageDifference: 0.75,
  p95Difference: 3,
  smoothP95Difference: 1,
};

const photoVisualThresholds = {
  averageDifference: 4,
  p95Difference: 8,
  smoothP95Difference: 4,
};

const smoothPhotoVisualThresholds = {
  averageDifference: 0.8,
  p95Difference: 2.5,
  smoothP95Difference: 1,
};

const minimallyRewrittenPhotoVisualThresholds = {
  averageDifference: 0.5,
  p95Difference: 1.75,
  smoothP95Difference: 0.75,
};

const moderatelyRewrittenPhotoVisualThresholds = {
  averageDifference: 2.4,
  p95Difference: 5.75,
  smoothP95Difference: 1.5,
};

const qualityModeMultipliers: Record<EncodeQualityMode, number> = {
  aggressive: 3,
  balanced: 1.75,
  strict: 1,
};

type VisualDifferenceResult = {
  averageDifference: number;
  p95Difference: number;
  smoothP95Difference: number;
};

type VisualThresholds = VisualDifferenceResult;
type CandidateEntry = {
  buffer: Buffer;
  lossy: boolean;
  name: string;
};

type SharpModuleLike = {
  default?: SharpFactory;
};

type SharpFactory = (
  input: Buffer,
  options?: {
    raw?: {
      channels: number;
      height: number;
      width: number;
    };
  }
) => {
  ensureAlpha: () => {
    raw: () => {
      toBuffer: () => Promise<Buffer>;
    };
  };
  png: (options: Record<string, unknown>) => {
    toBuffer: () => Promise<Buffer>;
  };
  removeAlpha: () => ReturnType<SharpFactory>;
};

const calculateVisualDifference = async (
  sharp: SharpFactory,
  candidateBuffer: Buffer,
  referenceData: Uint8ClampedArray,
  width: number,
  height: number,
  shouldKeepAlpha: boolean
): Promise<VisualDifferenceResult> => {
  const decoded = await sharp(candidateBuffer).ensureAlpha().raw().toBuffer();
  let totalDifference = 0;
  const pixelDifferences: number[] = [];
  const smoothRegionDifferences: number[] = [];
  const pixelCount = Math.max(1, width * height);
  const luma = (red: number, green: number, blue: number): number =>
    red * 0.299 + green * 0.587 + blue * 0.114;
  const smoothGradientThreshold = 6;

  for (let index = 0; index < referenceData.length; index += 4) {
    const redDifference = Math.abs(decoded[index] - referenceData[index]);
    const greenDifference = Math.abs(
      decoded[index + 1] - referenceData[index + 1]
    );
    const blueDifference = Math.abs(
      decoded[index + 2] - referenceData[index + 2]
    );
    const rgbDifference = Math.sqrt(
      redDifference * redDifference * 0.299 +
        greenDifference * greenDifference * 0.587 +
        blueDifference * blueDifference * 0.114
    );

    totalDifference += rgbDifference;
    pixelDifferences.push(rgbDifference);

    const referenceLuma = luma(
      referenceData[index],
      referenceData[index + 1],
      referenceData[index + 2]
    );
    const candidateLuma = luma(
      decoded[index],
      decoded[index + 1],
      decoded[index + 2]
    );
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    let maxLocalGradient = 0;

    if (x + 1 < width) {
      const rightIndex = index + 4;
      const rightLuma = luma(
        referenceData[rightIndex],
        referenceData[rightIndex + 1],
        referenceData[rightIndex + 2]
      );
      maxLocalGradient = Math.max(
        maxLocalGradient,
        Math.abs(referenceLuma - rightLuma)
      );
    }

    if (x > 0) {
      const leftIndex = index - 4;
      const leftLuma = luma(
        referenceData[leftIndex],
        referenceData[leftIndex + 1],
        referenceData[leftIndex + 2]
      );
      maxLocalGradient = Math.max(
        maxLocalGradient,
        Math.abs(referenceLuma - leftLuma)
      );
    }

    if (y + 1 < height) {
      const bottomIndex = index + width * 4;
      const bottomLuma = luma(
        referenceData[bottomIndex],
        referenceData[bottomIndex + 1],
        referenceData[bottomIndex + 2]
      );
      maxLocalGradient = Math.max(
        maxLocalGradient,
        Math.abs(referenceLuma - bottomLuma)
      );
    }

    if (y > 0) {
      const topIndex = index - width * 4;
      const topLuma = luma(
        referenceData[topIndex],
        referenceData[topIndex + 1],
        referenceData[topIndex + 2]
      );
      maxLocalGradient = Math.max(
        maxLocalGradient,
        Math.abs(referenceLuma - topLuma)
      );
    }

    if (maxLocalGradient <= smoothGradientThreshold) {
      smoothRegionDifferences.push(Math.abs(candidateLuma - referenceLuma));
    }

    if (shouldKeepAlpha) {
      totalDifference +=
        Math.abs(decoded[index + 3] - referenceData[index + 3]) / 4;
    }
  }

  pixelDifferences.sort((left, right) => left - right);

  return {
    averageDifference: totalDifference / pixelCount,
    p95Difference:
      pixelDifferences[Math.floor((pixelDifferences.length - 1) * 0.95)] ?? 0,
    smoothP95Difference:
      smoothRegionDifferences[
        Math.floor((smoothRegionDifferences.length - 1) * 0.95)
      ] ?? 0,
  };
};

const resolveVisualThresholds = (
  input: MinifyPngResult | RawImageInput,
  width: number,
  height: number,
  qualityMode: EncodeQualityMode
): VisualThresholds => {
  const minifyInput = input as MinifyPngResult;
  const totalPixels = Math.max(1, width * height);
  const edgeRatio = minifyInput.stats
    ? minifyInput.stats.edgePixelCount / totalPixels
    : 0;
  const acceptedTileRatio = minifyInput.stats
    ? minifyInput.stats.acceptedTileCount /
      Math.max(1, minifyInput.stats.candidateTileCount)
    : 0;
  const posterizedPixelRatio = minifyInput.stats
    ? minifyInput.stats.posterizedPixelCount / totalPixels
    : 0;
  const posterizationSkipped = minifyInput.stats?.posterizationSkipped ?? false;

  const baseThresholds = !minifyInput.stats?.photoLike
    ? defaultVisualThresholds
    : posterizationSkipped &&
        posterizedPixelRatio < 0.02 &&
        acceptedTileRatio > 0.55
      ? smoothPhotoVisualThresholds
      : posterizationSkipped && posterizedPixelRatio < 0.02 && edgeRatio < 0.12
        ? minimallyRewrittenPhotoVisualThresholds
        : posterizationSkipped && posterizedPixelRatio < 0.02
          ? moderatelyRewrittenPhotoVisualThresholds
          : edgeRatio < 0.12
            ? smoothPhotoVisualThresholds
            : photoVisualThresholds;
  const multiplier = qualityModeMultipliers[qualityMode];

  return {
    averageDifference: baseThresholds.averageDifference * multiplier,
    p95Difference: baseThresholds.p95Difference * multiplier,
    smoothP95Difference: baseThresholds.smoothP95Difference * multiplier,
  };
};

const isVisualDifferenceAcceptable = (
  difference: VisualDifferenceResult,
  thresholds: VisualThresholds
): boolean =>
  difference.averageDifference <= thresholds.averageDifference &&
  difference.p95Difference <= thresholds.p95Difference &&
  difference.smoothP95Difference <= thresholds.smoothP95Difference;

const emitDebugLog = (
  logger: EncodeOptions['debugLogger'],
  message: string
): void => {
  logger?.(message);
};

const resolvePngquantCandidates = (
  pngquant: boolean | PngquantOptions | undefined
): PngquantOptions[] => {
  if (!pngquant) {
    return [];
  }

  if (pngquant === true) {
    return [
      { quality: [90, 98], speed: 3 },
      { quality: [80, 95], speed: 3 },
    ];
  }

  if (pngquant.quality !== undefined || pngquant.colors !== undefined) {
    return [pngquant];
  }

  return [
    { ...pngquant, quality: [90, 98] },
    { ...pngquant, quality: [80, 95] },
  ];
};

const resolvePaletteCandidateSpecs = (
  qualityMode: EncodeQualityMode
): Array<{ colors: number; dither: number; quality: number }> => {
  const baseCandidates = [
    { colors: 256, dither: 0, quality: 100 },
    { colors: 256, dither: 0.1, quality: 100 },
    { colors: 256, dither: 0.2, quality: 100 },
    { colors: 256, dither: 0.35, quality: 100 },
    { colors: 256, dither: 0.5, quality: 100 },
    { colors: 240, dither: 0, quality: 100 },
    { colors: 240, dither: 0.1, quality: 100 },
    { colors: 224, dither: 0, quality: 100 },
    { colors: 224, dither: 0.1, quality: 100 },
    { colors: 192, dither: 0, quality: 100 },
    { colors: 256, dither: 0, quality: 95 },
    { colors: 256, dither: 0.2, quality: 95 },
    { colors: 256, dither: 1, quality: 90 },
    { colors: 128, dither: 0, quality: 100 },
  ];

  if (qualityMode === 'strict') {
    return baseCandidates;
  }

  if (qualityMode === 'balanced') {
    return [
      ...baseCandidates,
      { colors: 160, dither: 0, quality: 100 },
      { colors: 128, dither: 0.15, quality: 100 },
      { colors: 128, dither: 0.5, quality: 95 },
    ];
  }

  return [
    ...baseCandidates,
    { colors: 160, dither: 0, quality: 100 },
    { colors: 128, dither: 0.15, quality: 100 },
    { colors: 128, dither: 0.5, quality: 95 },
    { colors: 96, dither: 0, quality: 100 },
    { colors: 96, dither: 0.2, quality: 95 },
    { colors: 64, dither: 0, quality: 100 },
  ];
};

export const encodeOptimizedPng = async (
  input: MinifyPngResult | RawImageInput,
  options: EncodeOptions = {}
): Promise<Buffer> => {
  const normalized = normalizeRawImageInput({
    channels: input.channels,
    data: input.data,
    height: input.height,
    width: input.width,
  });

  try {
    const sharpModule = await import('sharp');
    const sharp = ((sharpModule as SharpModuleLike).default ??
      sharpModule) as unknown as SharpFactory;
    const shouldKeepAlpha = hasTransparentPixels(
      normalized.data as Uint8ClampedArray
    );
    const minifyInput = input as MinifyPngResult;
    const qualityMode =
      options.qualityMode ?? minifyInput.encodeHints?.qualityMode ?? 'strict';
    const visualThresholds = resolveVisualThresholds(
      input,
      normalized.width,
      normalized.height,
      qualityMode
    );
    const pngquantCandidates = resolvePngquantCandidates(options.pngquant);
    const debugLogger = options.debugLogger;

    emitDebugLog(
      debugLogger,
      `[encodeOptimizedPng] quality mode: ${qualityMode}`
    );

    const sourceBuffer = Buffer.from(normalized.data);
    const createSharpImage = () => {
      const image = sharp(sourceBuffer, {
        raw: {
          width: normalized.width,
          height: normalized.height,
          channels: 4,
        },
      });

      return shouldKeepAlpha ? image : image.removeAlpha();
    };

    const requestedPngOptions = {
      adaptiveFiltering: options.adaptiveFiltering ?? true,
      colors: options.colors,
      compressionLevel: options.compressionLevel ?? 9,
      effort: options.effort ?? 10,
      palette: options.palette,
      quality: options.quality,
    };

    if (
      options.palette !== undefined ||
      options.colors !== undefined ||
      options.quality !== undefined ||
      options.effort !== undefined ||
      options.adaptiveFiltering !== undefined
    ) {
      const sharpBuffer = await createSharpImage()
        .png({
          adaptiveFiltering: requestedPngOptions.adaptiveFiltering,
          colors: requestedPngOptions.colors,
          compressionLevel: requestedPngOptions.compressionLevel,
          effort: requestedPngOptions.effort,
          palette: requestedPngOptions.palette ?? true,
          quality: requestedPngOptions.quality ?? 100,
        })
        .toBuffer();

      let bestBuffer = sharpBuffer;
      let bestBufferSource = 'sharp-custom';

      emitDebugLog(
        debugLogger,
        `[encodeOptimizedPng] sharp-custom candidate: ${sharpBuffer.length} bytes`
      );

      for (const [
        candidateIndex,
        candidateOptions,
      ] of pngquantCandidates.entries()) {
        const pngquantResult = await encodeWithPngquant(
          sharpBuffer,
          candidateOptions
        );

        if (!pngquantResult.success) {
          emitDebugLog(
            debugLogger,
            `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: ${pngquantResult.message}`
          );
          continue;
        }
        const pngquantBuffer = pngquantResult.buffer;

        if (pngquantBuffer.length >= bestBuffer.length) {
          emitDebugLog(
            debugLogger,
            `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: skipped because ${pngquantBuffer.length} bytes is not smaller than current best ${bestBuffer.length} bytes`
          );
          continue;
        }

        const difference = await calculateVisualDifference(
          sharp,
          pngquantBuffer,
          normalized.data as Uint8ClampedArray,
          normalized.width,
          normalized.height,
          shouldKeepAlpha
        );

        if (isVisualDifferenceAcceptable(difference, visualThresholds)) {
          bestBuffer = pngquantBuffer;
          bestBufferSource = `pngquant-${candidateIndex + 1}`;
          emitDebugLog(
            debugLogger,
            `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: accepted at ${pngquantBuffer.length} bytes`
          );
          continue;
        }

        emitDebugLog(
          debugLogger,
          `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: rejected by visual thresholds (avg=${difference.averageDifference.toFixed(3)}, p95=${difference.p95Difference.toFixed(3)}, smoothP95=${difference.smoothP95Difference.toFixed(3)})`
        );
      }

      emitDebugLog(
        debugLogger,
        `[encodeOptimizedPng] selected candidate: ${bestBufferSource} (${bestBuffer.length} bytes)`
      );

      return bestBuffer;
    }

    const paletteCandidateSpecs = resolvePaletteCandidateSpecs(qualityMode);

    const candidateEntries = await Promise.all([
      createSharpImage()
        .png({
          adaptiveFiltering: true,
          compressionLevel: requestedPngOptions.compressionLevel,
          palette: false,
        })
        .toBuffer()
        .then(
          (buffer: Buffer): CandidateEntry => ({
            buffer,
            lossy: false,
            name: 'sharp-lossless',
          })
        ),
      ...paletteCandidateSpecs.map((candidate) =>
        createSharpImage()
          .png({
            adaptiveFiltering: true,
            colors: candidate.colors,
            compressionLevel: requestedPngOptions.compressionLevel,
            dither: candidate.dither,
            effort: 10,
            palette: true,
            quality: candidate.quality,
          })
          .toBuffer()
          .then(
            (buffer: Buffer): CandidateEntry => ({
              buffer,
              lossy: true,
              name: `sharp-palette-${candidate.colors}-q${candidate.quality}-d${candidate.dither}`,
            })
          )
      ),
    ]);
    const viableCandidates: Buffer[] = minifyInput.sourcePng
      ? [minifyInput.sourcePng]
      : [];
    const candidateNames = new Map<Buffer, string>();

    if (minifyInput.sourcePng) {
      candidateNames.set(minifyInput.sourcePng, 'source-png');
      emitDebugLog(
        debugLogger,
        `[encodeOptimizedPng] source-png candidate: ${minifyInput.sourcePng.length} bytes`
      );
    }

    const losslessSharpCandidate = candidateEntries[0]?.buffer;

    for (const candidateEntry of candidateEntries) {
      emitDebugLog(
        debugLogger,
        `[encodeOptimizedPng] ${candidateEntry.name} candidate: ${candidateEntry.buffer.length} bytes`
      );

      if (!candidateEntry.lossy) {
        viableCandidates.push(candidateEntry.buffer);
        candidateNames.set(candidateEntry.buffer, candidateEntry.name);
        continue;
      }

      const difference = await calculateVisualDifference(
        sharp,
        candidateEntry.buffer,
        normalized.data as Uint8ClampedArray,
        normalized.width,
        normalized.height,
        shouldKeepAlpha
      );

      if (isVisualDifferenceAcceptable(difference, visualThresholds)) {
        viableCandidates.push(candidateEntry.buffer);
        candidateNames.set(candidateEntry.buffer, candidateEntry.name);
        emitDebugLog(
          debugLogger,
          `[encodeOptimizedPng] ${candidateEntry.name}: accepted`
        );
        continue;
      }

      emitDebugLog(
        debugLogger,
        `[encodeOptimizedPng] ${candidateEntry.name}: rejected by visual thresholds (avg=${difference.averageDifference.toFixed(3)}, p95=${difference.p95Difference.toFixed(3)}, smoothP95=${difference.smoothP95Difference.toFixed(3)})`
      );
    }

    if (losslessSharpCandidate !== undefined) {
      for (const [
        candidateIndex,
        candidateOptions,
      ] of pngquantCandidates.entries()) {
        const pngquantResult = await encodeWithPngquant(
          losslessSharpCandidate,
          candidateOptions
        );

        if (!pngquantResult.success) {
          emitDebugLog(
            debugLogger,
            `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: ${pngquantResult.message}`
          );
          continue;
        }
        const pngquantBuffer = pngquantResult.buffer;

        emitDebugLog(
          debugLogger,
          `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: ${pngquantBuffer.length} bytes`
        );

        const difference = await calculateVisualDifference(
          sharp,
          pngquantBuffer,
          normalized.data as Uint8ClampedArray,
          normalized.width,
          normalized.height,
          shouldKeepAlpha
        );

        if (isVisualDifferenceAcceptable(difference, visualThresholds)) {
          viableCandidates.push(pngquantBuffer);
          candidateNames.set(pngquantBuffer, `pngquant-${candidateIndex + 1}`);
          emitDebugLog(
            debugLogger,
            `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: accepted`
          );
          continue;
        }

        emitDebugLog(
          debugLogger,
          `[encodeOptimizedPng] pngquant candidate ${candidateIndex + 1}: rejected by visual thresholds (avg=${difference.averageDifference.toFixed(3)}, p95=${difference.p95Difference.toFixed(3)}, smoothP95=${difference.smoothP95Difference.toFixed(3)})`
        );
      }
    }

    if (viableCandidates.length === 0) {
      throw new Error('No viable sharp PNG candidates');
    }

    const selectedCandidate = viableCandidates.reduce((smallest, candidate) =>
      candidate.length < smallest.length ? candidate : smallest
    );

    emitDebugLog(
      debugLogger,
      `[encodeOptimizedPng] selected candidate: ${candidateNames.get(selectedCandidate) ?? 'unknown'} (${selectedCandidate.length} bytes)`
    );

    return selectedCandidate;
  } catch {
    // Fall back to pure-JS encoding when sharp is unavailable.
  }

  const pngjsModule = await import('pngjs');
  const png = new pngjsModule.PNG({
    colorType: 6,
    height: normalized.height,
    width: normalized.width,
  });

  png.data = Buffer.from(normalized.data);

  return pngjsModule.PNG.sync.write(png, {
    colorType: 6,
    filterType: options.filterType ?? -1,
    inputColorType: 6,
    inputHasAlpha: true,
    deflateLevel: options.compressionLevel ?? 9,
  });
};
