import { createApiUrl } from './create-api-url.util';
import { requestJson } from './request-json.util';
import type { WikimediaCategoryMember } from '../types/benchmark-types';

export const fetchCategoryMembers = async (
  categoryTitle: string,
  limit: number
): Promise<WikimediaCategoryMember[]> => {
  const members: WikimediaCategoryMember[] = [];
  let continueToken: string | undefined;

  while (members.length < limit) {
    const url = createApiUrl({
      cmlimit: '500',
      cmprop: 'title',
      cmtitle: categoryTitle,
      cmtype: 'file',
      list: 'categorymembers',
    });

    if (continueToken) {
      url.searchParams.set('cmcontinue', continueToken);
    }

    const response = await requestJson<{
      continue?: { cmcontinue?: string };
      query?: { categorymembers?: WikimediaCategoryMember[] };
    }>(url);
    const nextMembers = response.query?.categorymembers ?? [];

    members.push(...nextMembers);

    if (!response.continue?.cmcontinue || nextMembers.length === 0) {
      break;
    }

    continueToken = response.continue.cmcontinue;
  }

  return members.slice(0, limit);
};
