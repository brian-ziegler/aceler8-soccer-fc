export interface Team {
  slug: string;
  name: string;
  ageGroup: string;
  season: string;
  playerSlugs: string[];
  galleryImages: string[];
}

export const teams: Team[] = [
  {
    slug: 'u12',
    name: 'Aceler8 FC U12',
    ageGroup: 'U12',
    season: 'Fall 2026',
    playerSlugs: [
      'bryn-ingraham',
      'ellie-cross',
      'natalie-jones',
      'sophia-edozien',
      'carina-stagnitta',
      'avery-carter',
      'lauren-hoenk',
      'emilia-bateman',
      'ellie-seaman',
      'payton-ziegler',
      'adrianna-hauck',
      'julia-dangelo',
      'olivia-norselli',
      'gemma-stagnitta',
      'eloise-konwinski',
    ],
    galleryImages: [
      '/images/players-1.png',
      '/images/players-2.png',
      '/images/players-3.png',
      '/images/players-4.png',
      '/images/players-5.png',
      '/images/players-6.png',
    ],
  },
  {
    slug: 'u11',
    name: 'Aceler8 FC U11',
    ageGroup: 'U11',
    season: 'Fall 2026',
    playerSlugs: [],
    galleryImages: [],
  },
  {
    slug: 'u10',
    name: 'Aceler8 FC U10',
    ageGroup: 'U10',
    season: 'Fall 2026',
    playerSlugs: [],
    galleryImages: [],
  },
  {
    slug: 'u9',
    name: 'Aceler8 FC U9',
    ageGroup: 'U9',
    season: 'Fall 2026',
    playerSlugs: [],
    galleryImages: [],
  },
  {
    slug: 'u8',
    name: 'Aceler8 FC U8',
    ageGroup: 'U8',
    season: 'Fall 2026',
    playerSlugs: [],
    galleryImages: [],
  },
];

export function getTeamBySlug(slug: string): Team | undefined {
  return teams.find((t) => t.slug === slug);
}
