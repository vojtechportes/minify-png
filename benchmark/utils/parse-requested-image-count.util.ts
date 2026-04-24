import { defaultTotalImages } from '../constants/wikimedia-benchmark.constants';

export const parseRequestedImageCount = (): number => {
  const userValue = process.argv[2];
  const parsed = userValue
    ? Number.parseInt(userValue, 10)
    : defaultTotalImages;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultTotalImages;
};
