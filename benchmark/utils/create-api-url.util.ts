import { wikimediaApiUrl } from '../constants/wikimedia-benchmark.constants';

export const createApiUrl = (parameters: Record<string, string>): URL => {
  const url = new URL(wikimediaApiUrl);

  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }

  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');

  return url;
};
