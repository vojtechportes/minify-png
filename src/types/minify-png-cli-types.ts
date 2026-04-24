import type { EncodeQualityMode } from './minify-png-types';
import type { PngquantOptions } from './minify-png-types';

export interface MinifyPngCliOptions {
  help: boolean;
  inputPath?: string;
  outputPath?: string;
  pngquant?: boolean;
  pngquantOptions?: PngquantOptions;
  qualityMode: EncodeQualityMode;
  verbose: boolean;
}
