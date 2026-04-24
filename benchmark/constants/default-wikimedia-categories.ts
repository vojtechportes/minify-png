export type WikimediaCategory = {
  key: string;
  title: string;
};

export const defaultWikimediaCategories: WikimediaCategory[] = [
  { key: 'nature', title: 'Category:Featured pictures of plants' },
  { key: 'wildlife', title: 'Category:Featured pictures of animals' },
  { key: 'portraits', title: 'Category:Featured pictures of people' },
  { key: 'architecture', title: 'Category:Featured pictures of architecture' },
  { key: 'art', title: 'Category:Featured pictures of art' },
  { key: 'maps', title: 'Category:Maps' },
  { key: 'flags', title: 'Category:Flags' },
  { key: 'diagrams', title: 'Category:Diagrams' },
];
