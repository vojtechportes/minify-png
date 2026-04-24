import { readFile, writeFile } from 'node:fs/promises';
import { minifyPng } from '../minify-png';
import { encodeOptimizedPng } from './encode-optimized-png.util';
import { parseMinifyPngCliArguments } from './parse-minify-png-cli-arguments.util';

const helpText = `Usage: minify-png --input <input.png> --output <output.png> [options]

Options:
  -i, --input <path>             Source PNG file path
  -o, --output <path>            Output PNG file path
  --pngquant                     Enable optional external pngquant
  --pngquant-bin <path>          Custom pngquant binary path
  --pngquant-quality <min-max>   pngquant quality range, for example 80-95
  --pngquant-speed <1-10>        pngquant speed, lower is slower and usually higher quality
  --quality-mode <mode>          strict, balanced, or aggressive
  --verbose                      Print encoder decision details
  -h, --help                     Show this message
`;

export const runMinifyPngCli = async (
  argumentsList: string[]
): Promise<number> => {
  try {
    const parsedOptions = parseMinifyPngCliArguments(argumentsList);

    if (parsedOptions.help) {
      process.stdout.write(helpText);
      return 0;
    }

    if (
      parsedOptions.inputPath === undefined ||
      parsedOptions.outputPath === undefined
    ) {
      process.stderr.write(
        'Both --input and --output are required. Run with --help for usage.\n'
      );
      return 1;
    }

    const sourceBuffer = await readFile(parsedOptions.inputPath);
    const minifiedImage = await minifyPng(sourceBuffer);
    const outputBuffer = await encodeOptimizedPng(minifiedImage, {
      debugLogger: parsedOptions.verbose
        ? (message) => process.stdout.write(`${message}\n`)
        : undefined,
      pngquant: parsedOptions.pngquant
        ? (parsedOptions.pngquantOptions ?? true)
        : false,
      qualityMode: parsedOptions.qualityMode,
    });

    await writeFile(parsedOptions.outputPath, outputBuffer);
    process.stdout.write(`Wrote ${parsedOptions.outputPath}\n`);

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    process.stderr.write(`${message}\n`);
    return 1;
  }
};
