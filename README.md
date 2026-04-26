<img src="https://github.com/vojtechportes/minify-png/blob/main/logo.png" />
# minify-png


[![npm version](https://img.shields.io/npm/v/%40vojtechportes%2Fminify-png)](https://www.npmjs.com/package/@vojtechportes/minify-png)
[![codecov](https://codecov.io/gh/vojtechportes/minify-png/branch/main/graph/badge.svg)](https://codecov.io/gh/vojtechportes/minify-png)

`minify-png` is a Node.js library for reducing PNG size with a combination of:

- edge-aware flat-region cleanup for screenshots, UI assets, icons, diagrams, and illustrations
- photo-safe PNG recompression for natural images where aggressive flat-region posterization would look bad

![Minification shwcase](https://github.com/vojtechportes/minify-png/blob/main/example.png)

## What It Does

For flat graphics, the library:

- decodes the PNG into RGBA pixels
- detects and protects edges
- finds flat interior tiles
- rejects gradient-like regions
- selectively remaps accepted non-edge regions

For photo-like images, the library becomes conservative:

- it avoids destructive flat-region remapping
- it still tries smaller PNG encodes
- it picks the smallest candidate that stays within a visual-difference budget

This means the package is best understood as:

PNG minification with selective flat-region optimization plus adaptive recompression.

## Install

```bash
npm install @vojtechportes/minify-png
```

`sharp` is used when available for decoding and encoding. `pngjs` is included as a fallback.

You can also opt into a system-installed `pngquant` binary for stronger PNG compression without bundling it into this package.

## Usage

```ts
import { encodeOptimizedPng, minifyPng } from '@vojtechportes/minify-png';
import { readFile, writeFile } from 'node:fs/promises';

const sourceBuffer = await readFile('input.png');
const result = await minifyPng(sourceBuffer);
const outputBuffer = await encodeOptimizedPng(result);

await writeFile('output.png', outputBuffer);
```

With optional external `pngquant`:

```ts
const result = await minifyPng(sourceBuffer);
const outputBuffer = await encodeOptimizedPng(result, {
  pngquant: true,
  qualityMode: 'aggressive',
});
```

You can also set `qualityMode` on `minifyPng()` directly, and `encodeOptimizedPng()` will use that hint automatically unless you override it:

```ts
const result = await minifyPng(sourceBuffer, {
  qualityMode: 'aggressive',
});
const outputBuffer = await encodeOptimizedPng(result);
```

If `pngquant` is not installed or is not found on `PATH`, the library silently falls back to the built-in encoder path.

## CLI

After install, you can also run the package as a CLI:

```bash
minify-png --input input.png --output output.png
```

With optional external `pngquant`:

```bash
minify-png \
  --input input.png \
  --output output.png \
  --pngquant \
  --pngquant-bin "C:\pngquant\pngquant.exe" \
  --quality-mode aggressive \
  --pngquant-quality 90-98 \
  --pngquant-speed 3
```

Available flags:

- `--input`, `-i`
- `--output`, `-o`
- `--pngquant`
- `--pngquant-bin`
- `--pngquant-quality`
- `--pngquant-speed`
- `--quality-mode`
- `--verbose`
- `--help`, `-h`

## API

### `minifyPng(input, options?)`

Analyzes a PNG or raw image input and returns a rewritten RGBA result together with processing stats.

Supported input:

- `Buffer | Uint8Array` containing a PNG
- raw image input with `data`, `width`, `height`, and `channels`

Returns:

- `width`, `height`, `channels`
- rewritten `data` as `Uint8ClampedArray`
- `stats` describing edge protection, accepted tiles, rewritten pixels, and whether posterization was skipped for a photo-like image

### `encodeOptimizedPng(input, options?)`

Encodes a `minifyPng()` result or a raw image input back to PNG.

By default it tries multiple PNG encoding strategies and keeps the smallest acceptable candidate.

### `analyzeFlatRegions(input, options?)`

Returns intermediate analysis data:

- `edgeMask`
- `tileMask`
- `regionMask`
- `regions`

This is mainly useful for debugging and tuning thresholds.

## Behavior Notes

- Best results are typically on UI screenshots, dashboards, icons, and illustrations.
- Natural photographs can still shrink well, but they are handled more conservatively to avoid obvious color shifts and posterization.
- The library is deterministic.
- Internal processing uses normalized 8-bit RGBA.

## Options

The main options include:

- `tileSize`
- `edgeThresholdColor`
- `edgeThresholdAlpha`
- `edgeDilateRadius`
- `flatnessMaxDistance`
- `flatnessP95Distance`
- `gradientRejectionEnabled`
- `gradientMaxDirectionalDrift`
- `minRegionArea`
- `minRegionThickness`
- `posterizeMode`
- `posterizeBitsPerChannel`
- `outputDebug`

Encoder options include:

- `compressionLevel`
- `adaptiveFiltering`
- `palette`
- `colors`
- `quality`
- `effort`
- `pngquant`
- `qualityMode`

### Optional `pngquant`

`encodeOptimizedPng()` supports an opt-in external `pngquant` path:

```ts
const outputBuffer = await encodeOptimizedPng(result, {
  pngquant: {
    binaryPath: 'pngquant',
    quality: [90, 98],
    speed: 3,
  },
  qualityMode: 'aggressive',
});
```

Notes:

- `pngquant` is never bundled by this package.
- `pngquant` / `libimagequant` are not MIT-licensed. They are GPL/commercial licensed, so this package only supports them as an optional external tool.
- The binary must already be installed on the system or otherwise available via `binaryPath`.
- If `pngquant` is unavailable or its output does not pass the same visual checks, the library keeps the built-in result instead.

### `qualityMode`

`encodeOptimizedPng()` supports three visual-threshold modes, and `minifyPng()` can carry the same mode forward as an encode hint:

- `strict`: current safest default
- `balanced`: slightly looser acceptance
- `aggressive`: more willing to accept smaller lossy candidates

## Current Design

The current implementation combines two strategies:

1. Selective flat-region optimization for graphics-like PNGs.
2. Candidate-based PNG recompression for photo-like PNGs.

It does not try to be a full semantic image optimizer, and it is still intentionally more conservative than dedicated hosted optimizers for some photographic images.

## Development

```bash
npm test
npm run typecheck
npm run build
npm run coverage
```

To run the local sample pipeline in the `test/` folder:

```bash
npm run test:png
```

To enable optional external `pngquant` for the local test runner:

```bash
npm run test:png:pngquant
```

To pass a custom binary path:

```bash
npm run test:png -- --pngquant --pngquant-bin "C:\pngquant\pngquant.exe"
```

You can also pass explicit quality and speed:

```bash
npm run test:png -- --pngquant --pngquant-bin "C:\pngquant\pngquant.exe" --pngquant-quality 90-98 --pngquant-speed 3 --quality-mode aggressive
```

The test runner now loads a root `.env` file through `dotenv`, so if you prefer, you can still set defaults there:

```env
USE_PNGQUANT=1
PNGQUANT_BIN=C:\pngquant\pngquant.exe
```

If you want to verify whether `pngquant` was actually used, run with `--verbose`:

```bash
npm run test:png -- --pngquant --pngquant-bin "C:\pngquant\pngquant.exe" --quality-mode aggressive --verbose
```

The output will tell you whether each `pngquant` candidate was unavailable, rejected by the visual checks, accepted, or ultimately selected.

Coverage is uploaded from GitHub Actions to Codecov. The workflow expects a `CODECOV_TOKEN` repository secret.

To try the CLI from the repository without publishing:

```bash
npm run build
node dist/minify-png.js --input test/test.png --output test/test.min.png
```
