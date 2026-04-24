import type { MinifyPngOptions, TileSeed } from '../types/minify-png-types';

export const isGradientLikeRegion = (
  regionSeeds: TileSeed[],
  options: Required<MinifyPngOptions>
): boolean => {
  if (regionSeeds.length < 3 || !options.gradientRejectionEnabled) {
    return false;
  }

  const tileBrightness = regionSeeds.map((seed) => ({
    brightness:
      (seed.representative[0] +
        seed.representative[1] +
        seed.representative[2]) /
      3,
    diagonal: seed.tileX + seed.tileY,
    inverseDiagonal: seed.tileX - seed.tileY,
    x: seed.tileX,
    y: seed.tileY,
  }));
  const brightnessValues = tileBrightness
    .map((tile) => tile.brightness)
    .sort((left, right) => left - right);
  const lowPercentileBrightness =
    brightnessValues[Math.floor((brightnessValues.length - 1) * 0.1)] ?? 0;
  const highPercentileBrightness =
    brightnessValues[Math.floor((brightnessValues.length - 1) * 0.9)] ?? 0;
  const brightnessSpread = highPercentileBrightness - lowPercentileBrightness;

  if (brightnessSpread <= options.gradientMaxDirectionalDrift) {
    return false;
  }

  const projectAxis = (
    axis: 'x' | 'y' | 'diagonal' | 'inverseDiagonal'
  ): number => {
    const grouped = new Map<number, number[]>();

    for (const tile of tileBrightness) {
      const axisValue = tile[axis];
      const bucket = grouped.get(axisValue) ?? [];
      bucket.push(tile.brightness);
      grouped.set(axisValue, bucket);
    }

    if (grouped.size < 3) {
      return 0;
    }

    const ordered = [...grouped.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(
        ([, values]) =>
          values.reduce((sum, value) => sum + value, 0) / values.length
      );
    let positiveSteps = 0;
    let negativeSteps = 0;
    let totalDrift = 0;

    for (let index = 1; index < ordered.length; index += 1) {
      const delta = ordered[index]! - ordered[index - 1]!;
      totalDrift += Math.abs(delta);

      if (delta > 0.5) {
        positiveSteps += 1;
      } else if (delta < -0.5) {
        negativeSteps += 1;
      }
    }

    const dominantSteps = Math.max(positiveSteps, negativeSteps);
    const coherence =
      totalDrift === 0 ? 0 : dominantSteps / Math.max(1, ordered.length - 1);
    const drift = Math.abs(
      (ordered[ordered.length - 1] ?? 0) - (ordered[0] ?? 0)
    );

    return coherence >= 0.75 ? drift : 0;
  };

  const horizontalDrift = projectAxis('x');
  const verticalDrift = projectAxis('y');
  const diagonalDrift = projectAxis('diagonal');
  const inverseDiagonalDrift = projectAxis('inverseDiagonal');

  return (
    Math.max(
      horizontalDrift,
      verticalDrift,
      diagonalDrift,
      inverseDiagonalDrift
    ) > options.gradientMaxDirectionalDrift
  );
};
