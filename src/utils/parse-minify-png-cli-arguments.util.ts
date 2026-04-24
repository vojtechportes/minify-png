import type { EncodeQualityMode } from '../types/minify-png-types';
import type { MinifyPngCliOptions } from '../types/minify-png-cli-types';

const requireNextValue = (
  argumentsList: string[],
  index: number,
  flag: string
): string => {
  const value = argumentsList[index + 1];

  if (value === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
};

const parsePngquantQuality = (value: string): readonly [number, number] => {
  const [minimum, maximum] = value.split('-').map((part) => Number(part));

  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    minimum < 0 ||
    maximum > 100 ||
    minimum > maximum
  ) {
    throw new Error(
      'Invalid value for --pngquant-quality. Use the format min-max, for example 80-95.'
    );
  }

  return [minimum, maximum];
};

const parseQualityMode = (value: string): EncodeQualityMode => {
  if (value === 'strict' || value === 'balanced' || value === 'aggressive') {
    return value;
  }

  throw new Error(
    'Invalid value for --quality-mode. Use strict, balanced, or aggressive.'
  );
};

export const parseMinifyPngCliArguments = (
  argumentsList: string[]
): MinifyPngCliOptions => {
  const parsedOptions: MinifyPngCliOptions = {
    help: false,
    qualityMode: 'strict',
    verbose: false,
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    switch (argument) {
      case '--help':
      case '-h':
        parsedOptions.help = true;
        break;
      case '--verbose':
        parsedOptions.verbose = true;
        break;
      case '--quality-mode':
        parsedOptions.qualityMode = parseQualityMode(
          requireNextValue(argumentsList, index, argument)
        );
        index += 1;
        break;
      case '--input':
      case '-i':
        parsedOptions.inputPath = requireNextValue(
          argumentsList,
          index,
          argument
        );
        index += 1;
        break;
      case '--output':
      case '-o':
        parsedOptions.outputPath = requireNextValue(
          argumentsList,
          index,
          argument
        );
        index += 1;
        break;
      case '--pngquant':
        parsedOptions.pngquant = true;
        parsedOptions.pngquantOptions = {
          ...parsedOptions.pngquantOptions,
        };
        break;
      case '--pngquant-bin':
        parsedOptions.pngquant = true;
        parsedOptions.pngquantOptions = {
          ...parsedOptions.pngquantOptions,
          binaryPath: requireNextValue(argumentsList, index, argument),
        };
        index += 1;
        break;
      case '--pngquant-quality':
        parsedOptions.pngquant = true;
        parsedOptions.pngquantOptions = {
          ...parsedOptions.pngquantOptions,
          quality: parsePngquantQuality(
            requireNextValue(argumentsList, index, argument)
          ),
        };
        index += 1;
        break;
      case '--pngquant-speed': {
        parsedOptions.pngquant = true;
        const speed = Number(requireNextValue(argumentsList, index, argument));

        if (!Number.isInteger(speed) || speed < 1 || speed > 10) {
          throw new Error(
            'Invalid value for --pngquant-speed. Use an integer from 1 to 10.'
          );
        }

        parsedOptions.pngquantOptions = {
          ...parsedOptions.pngquantOptions,
          speed,
        };
        index += 1;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return parsedOptions;
};
