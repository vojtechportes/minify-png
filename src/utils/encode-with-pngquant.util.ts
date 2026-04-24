import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import type { PngquantOptions } from '../types/minify-png-types';

export type PngquantEncodeResult =
  | { buffer: Buffer; success: true }
  | { message: string; success: false };

export const encodeWithPngquant = async (
  input: Buffer,
  options: PngquantOptions = {}
): Promise<PngquantEncodeResult> =>
  new Promise((resolve) => {
    const binaryPath = options.binaryPath ?? 'pngquant';
    const quality = options.quality ?? [85, 98];
    const speed = options.speed ?? 3;
    const args = [
      `--quality=${quality[0]}-${quality[1]}`,
      '--speed',
      String(speed),
      '-',
    ];

    if (options.colors !== undefined) {
      args.unshift(String(options.colors));
    }

    const child = spawn(binaryPath, args, {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const chunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.from(chunk));
    });

    child.on('error', (error) => {
      resolve({
        message:
          error instanceof Error
            ? `spawn error: ${error.message}`
            : 'spawn error',
        success: false,
      });
    });

    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve({ buffer: Buffer.concat(chunks), success: true });
        return;
      }

      resolve({
        message:
          signal !== null
            ? `terminated by signal ${signal}`
            : code === 99
              ? 'exited with code 99 (pngquant could not meet the requested quality range)'
              : `exited with code ${code ?? 'unknown'}`,
        success: false,
      });
    });

    child.stdin.end(input);
  });
