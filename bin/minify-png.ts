#!/usr/bin/env node

import { runMinifyPngCli } from '../src/utils/run-minify-png-cli.util';

const main = async (): Promise<void> => {
  const exitCode = await runMinifyPngCli(process.argv.slice(2));

  process.exit(exitCode);
};

void main();
