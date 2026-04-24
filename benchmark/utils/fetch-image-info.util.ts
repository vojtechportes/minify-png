import { supportedMimeTypes } from '../constants/wikimedia-benchmark.constants';
import type {
  WikimediaImageInfo,
  WikimediaPage,
} from '../types/benchmark-types';
import { createApiUrl } from './create-api-url.util';
import { requestJson } from './request-json.util';

export const fetchImageInfo = async (
  fileTitle: string
): Promise<WikimediaImageInfo | null> => {
  const url = createApiUrl({
    iiprop: 'mime|size|url',
    prop: 'imageinfo',
    titles: fileTitle,
  });
  const response = await requestJson<{ query?: { pages?: WikimediaPage[] } }>(
    url
  );
  const page = response.query?.pages?.[0];
  const imageInfo = page?.imageinfo?.[0];

  if (
    !imageInfo?.url ||
    !imageInfo.mime ||
    !supportedMimeTypes.has(imageInfo.mime)
  ) {
    return null;
  }

  return imageInfo;
};
