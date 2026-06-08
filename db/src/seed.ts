// Initial seed data for kproj.
// Source: user's spec from the design conversation.
//
// Conventions:
// - `id` is the route slug (lowercase, no spaces). Stable; URLs will use it.
// - `stageName` preserves the user's exact spelling — that's the display label.
// - `_addedByAssistant` flags members I filled in because the user wrote
//   "fill the rest" — confirm or edit them.
// - `_needsReview` flags ambiguous parsing — read the comment, then edit & remove the flag.
//
// To load: pnpm --filter @kproj/db tsx src/seedRunner.ts
// (seedRunner.ts is added in the migration task — calls the API's POST /groups
// and POST /groups/:id/members for each entry.)

export interface SeedMember {
  id: string;
  stageName: string;
  _addedByAssistant?: true;
  _needsReview?: string;
}

export interface SeedGroup {
  id: string;
  name: string;
  debutYear?: number;
  agency?: string;
  members: SeedMember[];
  _needsReview?: string;
}

export const seedGroups: SeedGroup[] = [
  {
    id: 'lesserafim',
    name: 'LE SSERAFIM',
    debutYear: 2022,
    agency: 'Source Music (HYBE)',
    members: [
      { id: 'yunjin', stageName: 'Yunjin' },
      { id: 'chaewon', stageName: 'Chaewon' },
      { id: 'kazuha', stageName: 'Kazuha' },
      { id: 'eunchae', stageName: 'Eunchae' },
      { id: 'sakura', stageName: 'Sakura' },
    ],
  },
  {
    id: 'aespa',
    name: 'aespa',
    debutYear: 2020,
    agency: 'SM Entertainment',
    members: [
      { id: 'karina', stageName: 'Karina' },
      { id: 'winter', stageName: 'Winter' },
      { id: 'ningning', stageName: 'Ningning' },
      { id: 'giselle', stageName: 'Giselle' },
    ],
  },
  {
    id: 'meovv',
    name: 'MEOVV',
    debutYear: 2024,
    agency: 'The Black Label',
    members: [
      { id: 'anna', stageName: 'Anna' },
      { id: 'sooin', stageName: 'Sooin' },
      { id: 'narin', stageName: 'Narin' },
      { id: 'gawon', stageName: 'Gawon' },
      { id: 'ella', stageName: 'Ella' },
    ],
  },
  {
    id: 'katseye',
    name: 'KATSEYE',
    debutYear: 2024,
    agency: 'HYBE x Geffen',
    members: [
      { id: 'sophia', stageName: 'Sophia' },
      { id: 'yoonchae', stageName: 'Yoonchae' },
      { id: 'megan', stageName: 'Megan' },
      { id: 'manon', stageName: 'Manon' },
      { id: 'lara', stageName: 'Lara' },
      { id: 'daniela', stageName: 'Dani' },
    ],
  },
  {
    id: 'itzy',
    name: 'ITZY',
    debutYear: 2019,
    agency: 'JYP Entertainment',
    members: [
      { id: 'ryujin', stageName: 'Ryujin' },
      { id: 'yeji', stageName: 'Yeji' },
      { id: 'yuna', stageName: 'Yuna' },
      { id: 'chaeryoung', stageName: 'Chaeryoung' },
      { id: 'lia', stageName: 'Lia' },
    ],
  },
  {
    id: 'newjeans',
    name: 'NewJeans',
    debutYear: 2022,
    agency: 'ADOR (HYBE)',
    members: [
      { id: 'danielle', stageName: 'Danielle' },
      { id: 'hyein', stageName: 'Hyein' },
      { id: 'haerin', stageName: 'Haerin' },
      { id: 'hanni', stageName: 'Hanni' },
      { id: 'minji', stageName: 'Minji' },
    ],
  },
  {
    id: 'blackpink',
    name: 'BLACKPINK',
    debutYear: 2016,
    agency: 'YG Entertainment',
    members: [
      { id: 'jennie', stageName: 'Jennie' },
      { id: 'jisoo', stageName: 'Jisoo' },
      { id: 'rose', stageName: 'Rose' },
      { id: 'lisa', stageName: 'Lisa' },
    ],
  },
  {
    id: 'babymonster',
    name: 'BABYMONSTER',
    debutYear: 2024,
    agency: 'YG Entertainment',
    members: [
      { id: 'rora', stageName: 'Rora' },
      { id: 'ahyeon', stageName: 'Ahyeon' },
      { id: 'asa', stageName: 'Asa' },
      { id: 'chiquita', stageName: 'Chiquita' },
      { id: 'pharita', stageName: 'Pharita' },
      { id: 'ruka', stageName: 'Ruka' },
      { id: 'rami', stageName: 'Rami' },
    ],
  },
  {
    id: 'ive',
    name: 'IVE',
    debutYear: 2021,
    agency: 'Starship Entertainment',
    members: [
      { id: 'ahn-yujin', stageName: 'Ahn Yujin' },
      { id: 'liz', stageName: 'Liz' },
      { id: 'wonyoung', stageName: 'Wonyoung' },
      { id: 'leeso', stageName: 'Leeso' },
      { id: 'gauel', stageName: 'Gauel' },
      { id: 'rei', stageName: 'Rei' },
    ],
  },
  {
    id: 'twice',
    name: 'TWICE',
    debutYear: 2015,
    agency: 'JYP Entertainment',
    members: [
      { id: 'sana', stageName: 'Sana' },
      { id: 'tzuyu', stageName: 'Tzuyu' },
      { id: 'momo', stageName: 'Momo' },
      { id: 'mina', stageName: 'Mina' },
      { id: 'dahyun', stageName: 'Dahyun' },
      { id: 'nayeon', stageName: 'Nayeon', _addedByAssistant: true },
      { id: 'jeongyeon', stageName: 'Jeongyeon', _addedByAssistant: true },
      { id: 'jihyo', stageName: 'Jihyo', _addedByAssistant: true },
      { id: 'chaeyoung', stageName: 'Chaeyoung', _addedByAssistant: true },
    ],
  },
  {
    id: 'kiss-of-life',
    name: 'Kiss of Life',
    debutYear: 2023,
    agency: 'S2 Entertainment',
    members: [
      { id: 'natty', stageName: 'Natty' },
      { id: 'belle', stageName: 'Belle' },
      { id: 'haneul', stageName: 'Haneul' },
      { id: 'julie', stageName: 'Julie' },
    ],
  },
  {
    id: 'nmixx',
    name: 'NMIXX',
    debutYear: 2022,
    agency: 'JYP Entertainment',
    members: [
      { id: 'sullyoon', stageName: 'Sullyoon' },
      { id: 'bae', stageName: 'Bae' },
      { id: 'kyujin', stageName: 'Kyujin' },
      { id: 'lily', stageName: 'Lily' },
      { id: 'haewon', stageName: 'Haewon' },
      {
        id: 'jiwoo',
        stageName: 'Jiwoo',
        _addedByAssistant: true,
        _needsReview: 'NMIXX has 6 members; you only listed 5. Adding Jiwoo to complete — drop her if intentional.',
      },
    ],
  },
  {
    id: 'gidle',
    name: '(G)I-DLE',
    debutYear: 2018,
    agency: 'Cube Entertainment',
    members: [
      { id: 'yuqi', stageName: 'Yuqi' },
      { id: 'minnie', stageName: 'Minnie' },
      { id: 'miyeon', stageName: 'Miyeon' },
      { id: 'shuhua', stageName: 'Shuhua' },
      { id: 'soyeon', stageName: 'Soyeon' },
    ],
  },
  {
    id: 'illit',
    name: 'ILLIT',
    debutYear: 2024,
    agency: 'BELIFT LAB (HYBE)',
    members: [
      { id: 'minju', stageName: 'Minju' },
      { id: 'moka', stageName: 'Moka' },
      { id: 'iroha', stageName: 'Iroha' },
      {
        id: 'yunah',
        stageName: 'Yuna',
        _needsReview: 'You wrote "Yuna" — ILLIT\'s member is usually romanized "Yunah". Edit stageName if you prefer the H.',
      },
      { id: 'wonhee', stageName: 'Wonhee', _addedByAssistant: true },
    ],
  },
  {
    id: 'fifty-fifty',
    name: 'FIFTY FIFTY',
    debutYear: 2022,
    agency: 'ATTRAKT',
    _needsReview: 'You wrote "Chanelle Moon, Athena" — interpreted as 3 separate members (Chanelle, Moon, Athena). Original member Keena also remains in the post-dispute lineup; add her if you want her too.',
    members: [
      { id: 'chanelle', stageName: 'Chanelle' },
      { id: 'moon', stageName: 'Moon' },
      { id: 'athena', stageName: 'Athena' },
    ],
  },

  // Soloists — modeled as groups of 1 (cleanest fit with current schema).
  {
    id: 'somi',
    name: 'Somi',
    agency: 'The Black Label',
    members: [{ id: 'somi', stageName: 'Somi' }],
  },
  {
    id: 'yena',
    name: 'Yena',
    members: [{ id: 'yena', stageName: 'Yena' }],
  },

  // Topics — themed collections rather than groups. Modeled as member-less
  // groups for now; once the backend grows a `kind: 'topic'` concept (see the
  // Replit `entry.kind` model), these can migrate to that. Media attaches at
  // the group level (memberId omitted on upload).
  {
    id: 'nl',
    name: 'NL',
    members: [],
    _needsReview: 'Topic (not a group). No members. Confirm display name / intent.',
  },
  {
    id: 'futa',
    name: 'Futa',
    members: [],
    _needsReview: 'Topic (not a group). No members. Confirm display name / intent.',
  },
  // "6ix's Heaven" is a third special section, surfaced in the NavBar with its
  // own /heaven route (currently a "coming soon" placeholder).
];

// Quick consistency check — duplicate slugs would silently merge in the API.
export function validateSeed(groups: SeedGroup[]): string[] {
  const errors: string[] = [];
  const groupIds = new Set<string>();
  for (const g of groups) {
    if (groupIds.has(g.id)) errors.push(`Duplicate group slug: ${g.id}`);
    groupIds.add(g.id);
    const memberIds = new Set<string>();
    for (const m of g.members) {
      if (memberIds.has(m.id)) errors.push(`Duplicate member slug in ${g.id}: ${m.id}`);
      memberIds.add(m.id);
    }
  }
  return errors;
}
