import type { WikimediaCategory } from '../constants/default-wikimedia-categories';
import { maxCandidatesPerCategory } from '../constants/wikimedia-benchmark.constants';
import type { BenchmarkImageCandidate } from '../types/benchmark-types';
import { fetchCategoryMembers } from './fetch-category-members.util';
import { shuffle } from './shuffle.util';

export const collectBenchmarkCandidates = async (
  categories: WikimediaCategory[],
  imagesPerCategory: number
): Promise<BenchmarkImageCandidate[]> => {
  const selections: BenchmarkImageCandidate[] = [];

  for (const category of categories) {
    const members = await fetchCategoryMembers(
      category.title,
      maxCandidatesPerCategory
    );
    const uniqueTitles = [...new Set(members.map((member) => member.title))];
    const shuffledTitles = shuffle(uniqueTitles).slice(0, imagesPerCategory);

    for (const fileTitle of shuffledTitles) {
      selections.push({ category, fileTitle });
    }
  }

  return selections;
};
