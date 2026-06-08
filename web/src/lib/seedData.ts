// Seed data for the one-time archive populate (/admin/seed).
// Self-contained in web/ so it works on localhost and in the Vercel build.
//
// Conventions:
//  - `id` is the route slug (lowercase, hyphens). Stable; URLs use it.
//  - `stageName` is the display label (user's preferred spelling).
//  - Soloists are modeled as groups of 1.
//  - Topics (NL, Futa) are member-less groups; media attaches at group level.
//  - 6ix's Heaven is NOT seeded — it's the admin-only /heaven route.

export interface SeedMember {
  id: string;
  stageName: string;
}

export interface SeedGroup {
  id: string;
  name: string;
  debutYear?: number;
  agency?: string;
  members: SeedMember[];
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
      { id: 'rose', stageName: 'Rosé' },
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
      { id: 'nayeon', stageName: 'Nayeon' },
      { id: 'jeongyeon', stageName: 'Jeongyeon' },
      { id: 'momo', stageName: 'Momo' },
      { id: 'sana', stageName: 'Sana' },
      { id: 'jihyo', stageName: 'Jihyo' },
      { id: 'mina', stageName: 'Mina' },
      { id: 'dahyun', stageName: 'Dahyun' },
      { id: 'chaeyoung', stageName: 'Chaeyoung' },
      { id: 'tzuyu', stageName: 'Tzuyu' },
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
      { id: 'haewon', stageName: 'Haewon' },
      { id: 'lily', stageName: 'Lily' },
      { id: 'sullyoon', stageName: 'Sullyoon' },
      { id: 'bae', stageName: 'Bae' },
      { id: 'jiwoo', stageName: 'Jiwoo' },
      { id: 'kyujin', stageName: 'Kyujin' },
    ],
  },
  {
    id: 'gidle',
    name: '(G)I-DLE',
    debutYear: 2018,
    agency: 'Cube Entertainment',
    members: [
      { id: 'miyeon', stageName: 'Miyeon' },
      { id: 'minnie', stageName: 'Minnie' },
      { id: 'soyeon', stageName: 'Soyeon' },
      { id: 'yuqi', stageName: 'Yuqi' },
      { id: 'shuhua', stageName: 'Shuhua' },
    ],
  },
  {
    id: 'illit',
    name: 'ILLIT',
    debutYear: 2024,
    agency: 'BELIFT LAB (HYBE)',
    members: [
      { id: 'yunah', stageName: 'Yunah' },
      { id: 'minju', stageName: 'Minju' },
      { id: 'moka', stageName: 'Moka' },
      { id: 'wonhee', stageName: 'Wonhee' },
      { id: 'iroha', stageName: 'Iroha' },
    ],
  },
  {
    id: 'fifty-fifty',
    name: 'FIFTY FIFTY',
    debutYear: 2022,
    agency: 'ATTRAKT',
    members: [
      { id: 'chanelle-moon', stageName: 'Chanelle Moon' },
      { id: 'athena', stageName: 'Athena' },
    ],
  },

  // Soloists — groups of 1.
  { id: 'somi', name: 'Somi', agency: 'The Black Label', members: [{ id: 'somi', stageName: 'Somi' }] },
  { id: 'yena', name: 'Yena', members: [{ id: 'yena', stageName: 'Yena' }] },

  // Topics — member-less collections (media attaches at group level).
  { id: 'nl', name: 'NL', members: [] },
  { id: 'futa', name: 'Futa', members: [] },
];
