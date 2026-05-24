#!/usr/bin/env node
/**
 * One-time script to seed DynamoDB from existing site data.
 * Usage: TABLE_NAME=aceler8-cms node scripts/seed-cms-data.mjs
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME;
if (!TABLE_NAME) {
  console.error('Error: TABLE_NAME environment variable is required.');
  process.exit(1);
}

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function putItem(item) {
  await ddb.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: marshall(item, { removeUndefinedValues: true }),
  }));
}

// ── Coaches ───────────────────────────────────────────────────────────────────

const coaches = [
  {
    slug: 'connally-edozien',
    name: 'Connally Edozien',
    role: 'Head Coach',
    title: 'Founder | Head of Coaching and Player Development',
    imageSrc: '/coaches/connally.jpg',
    imageAlt: 'Connally Edozien — Co-Founder, Aceler8 FC',
    summary: 'Former professional player bringing MLS and European experience to player development.',
    bio: [
      "Connally Edozien is a former professional soccer player and co-founder of Aceler8 FC. Born in Lagos, Nigeria, and raised in London, he moved to the United States to attend Embry–Riddle Aeronautical University, where he became an All-American, a two-time Florida Sun Conference Player of the Year, and the school's all-time leading scorer.",
      "Connally's professional career took him to Germany, France, and Major League Soccer with the New England Revolution, giving him first-hand experience at the highest levels of the game.",
      'Today, he brings that expertise to developing the next generation of players, focusing on technical skill, tactical awareness, and mental resilience. Connally is dedicated to helping athletes maximize their potential on and off the field.',
    ],
    credentials: [
      'Former MLS — New England Revolution',
      'Professional experience — Germany, France',
      'NCAA All-American, Embry–Riddle Aeronautical University',
    ],
  },
  {
    slug: 'betsy-jones',
    name: 'Betsy Jones',
    role: 'Coach',
    title: 'Youth development · Fundamentals & character',
    imageSrc: '/coaches/betsy.jpg',
    imageAlt: 'Betsy Jones — Coach, Aceler8 FC',
    summary: 'Known for deep knowledge of the game and an ability to help every player grow with confidence.',
    bio: [
      'Coach Betsy is a dedicated and inspiring youth soccer coach who has made an incredible impact on every player she works with. Known for her deep knowledge of the game and years of experience, she has a unique ability to bring out the best in each child, helping them grow not just as athletes but as confident individuals.',
      "Her coaching style blends expert skill development with genuine care, creating a supportive environment where children feel encouraged and motivated to succeed. Betsy's focus on the fundamentals, teamwork, and personal growth ensures that her players gain the tools they need to excel in soccer now and in the future.",
      'Her passion and commitment continually shape young athletes into driven, respectful, and skilled players ready to thrive on and off the field.',
    ],
    credentials: ['Youth soccer — multi-year coaching experience'],
  },
  {
    slug: 'carmen-stagnitta',
    name: 'Carmen Stagnitta',
    role: 'Coach',
    title: 'Educator · U.S. Soccer licensed',
    imageSrc: '/coaches/carmen.jpg',
    imageAlt: 'Carmen Stagnitta — Coach, Aceler8 FC',
    summary: 'Educator and licensed coach emphasizing long-term development and player-centered training.',
    bio: [
      'Carmen Stagnitta is an educator and youth soccer coach with over 14 years of classroom experience and 5 years in coaching. He integrates his background in education to create structured, engaging, and inclusive training environments where players can learn, grow, and enjoy the game.',
      'Carmen holds his U.S. Soccer Grassroots 9v9 and 11v11 Licenses, as well as his U.S. Soccer D License, reflecting his commitment to high-quality player development.',
      'He emphasizes a player-centered approach, encouraging decision-making, creativity, and ownership through play-practice-play sessions with clear objectives and opportunities for growth. Carmen prioritizes long-term development over short-term results, helping players learn from mistakes while building confidence, accountability, and teamwork.',
      "Passionate about developing the next generation of players, he designs purposeful training sessions that balance fun with challenge, supporting each athlete's growth both on and off the field.",
    ],
    credentials: [
      'U.S. Soccer D License',
      'U.S. Soccer Grassroots 9v9 & 11v11',
    ],
  },
  {
    slug: 'charles-gbeke',
    name: 'Charles Gbeke',
    role: 'Coach',
    title: 'Coach',
    imageSrc: '/coaches/charles.jpg',
    imageAlt: 'Charles Gbeke — Coach, Aceler8 FC',
    summary: "Coach driving Aceler8's mission to make elite development accessible to every player in Rochester.",
    bio: [
      'Charles Gbeke is a coach and club director of Aceler8 FC, bringing organizational vision and a passion for community development to everything the club does.',
      'Charles is committed to building a program that serves the whole player — providing top-level coaching, mentorship, and pathways that prepare young athletes for success on and off the pitch.',
    ],
    credentials: [],
  },
];

// ── Players ───────────────────────────────────────────────────────────────────

const players = [
  { slug: 'bryn-ingraham', name: 'Bryn Ingraham', number: '1', position: 'Forward' },
  { slug: 'ellie-cross', name: 'Ellie Cross', number: '3', position: 'Defender' },
  { slug: 'natalie-jones', name: 'Natalie Jones', number: '8', position: 'Defender' },
  { slug: 'sophia-edozien', name: 'Sophia Edozien', number: '10', position: 'Mid-fielder' },
  { slug: 'carina-stagnitta', name: 'Carina Stagnitta', number: '12', position: 'Defender' },
  { slug: 'avery-carter', name: 'Avery Carter', number: '15', position: 'Defender' },
  { slug: 'lauren-hoenk', name: 'Lauren Hoenk', number: '16', position: 'Defender' },
  { slug: 'emilia-bateman', name: 'Emilia Bateman', number: '17', position: 'Forward / Mid-fielder' },
  { slug: 'ellie-seaman', name: 'Ellie Seaman', number: '18', position: 'Forward / Mid-fielder' },
  { slug: 'payton-ziegler', name: 'Payton Ziegler', number: '19', position: 'Keeper' },
  { slug: 'adrianna-hauck', name: 'Adrianna Hauck', number: '20', position: 'Forward / Mid-fielder' },
  { slug: 'julia-dangelo', name: "Julia D'Angelo", number: '22', position: 'Defender' },
  { slug: 'olivia-norselli', name: 'Olivia Norselli', number: '23', position: 'Forward' },
  { slug: 'gemma-stagnitta', name: 'Gemma Stagnitta', number: '25', position: 'Defender' },
  { slug: 'eloise-konwinski', name: 'Eloise Konwinski', number: '99', position: 'Defender' },
];

// ── Teams ─────────────────────────────────────────────────────────────────────

const teams = [
  {
    slug: 'u12',
    name: 'Aceler8 FC U12',
    ageGroup: 'U12',
    season: 'Fall 2026',
    playerSlugs: [
      'bryn-ingraham', 'ellie-cross', 'natalie-jones', 'sophia-edozien',
      'carina-stagnitta', 'avery-carter', 'lauren-hoenk', 'emilia-bateman',
      'ellie-seaman', 'payton-ziegler', 'adrianna-hauck', 'julia-dangelo',
      'olivia-norselli', 'gemma-stagnitta', 'eloise-konwinski',
    ],
    galleryImages: [
      '/images/players-1.png', '/images/players-2.png', '/images/players-3.png',
      '/images/players-4.png', '/images/players-5.png', '/images/players-6.png',
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

// ── Hero Slides ───────────────────────────────────────────────────────────────

const heroSlides = [
  { src: '/hero/raw/3323.jpg', width: 1620, height: 1080 },
  { src: '/hero/raw/3343-web.jpg', width: 1620, height: 1080, title: 'The Family' },
  { src: '/hero/raw/3335-web.jpg', width: 1620, height: 1080 },
  {
    src: '/hero/raw/3339-landscape.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Lauren Hoenk, Midfielder 16',
    buttons: [{ label: 'Player Info', href: '/players/lauren-hoenk/' }],
  },
  { src: '/hero/raw/3329-web.jpg', width: 1620, height: 1080 },
  {
    src: '/hero/raw/3337-landscape.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Payton Ziegler, Goal Keeper 19',
    buttons: [{ label: 'Player Info', href: '/players/payton-ziegler/' }],
  },
  {
    src: '/hero/raw/3325-landscape.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight',
    title: 'Natalie Jones, Defender 8 & Sophia Edozien, Mid-fielder 10',
    description: 'Planning their next move',
    buttons: [
      { label: 'Natalie Jones', href: '/players/natalie-jones/' },
      { label: 'Sophia Edozien', href: '/players/sophia-edozien/' },
    ],
  },
  { src: '/hero/raw/3347-web.jpg', width: 1620, height: 1080, title: 'Celebrating' },
  {
    src: '/hero/raw/3341-web.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Olivia Norselli, Forward 23',
    buttons: [{ label: 'Player Info', href: '/players/olivia-norselli/' }],
  },
  { src: '/hero/raw/3346-web.jpg', width: 1620, height: 1080 },
  {
    src: '/hero/raw/3340-landscape-web.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Ellie Seaman, Forward / Mid-fielder 18',
    buttons: [{ label: 'Player Info', href: '/players/ellie-seaman/' }],
  },
  { src: '/hero/raw/3336-web.jpg', width: 1620, height: 1080 },
  {
    src: '/hero/raw/adrianna.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Adrianna Hauck, Forward / Mid-fielder 20',
    buttons: [{ label: 'Player Info', href: '/players/adrianna-hauck/' }],
  },
  {
    src: '/hero/raw/bryn.jpg', width: 1620, height: 1080,
    heading: 'Player Spotlight', title: 'Bryn Ingraham, Forward 1',
    buttons: [{ label: 'Player Info', href: '/players/bryn-ingraham/' }],
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seedAll() {
  console.log(`Seeding table: ${TABLE_NAME}`);

  console.log('\n--- Coaches ---');
  for (let i = 0; i < coaches.length; i++) {
    const { slug, ...rest } = coaches[i];
    const item = { entityType: 'coaches', id: slug, order: i, ...rest };
    await putItem(item);
    console.log(`  [${i}] ${slug}`);
  }

  console.log('\n--- Players ---');
  for (let i = 0; i < players.length; i++) {
    const { slug, ...rest } = players[i];
    const item = { entityType: 'players', id: slug, order: i, ...rest };
    await putItem(item);
    console.log(`  [${i}] ${slug}`);
  }

  console.log('\n--- Teams ---');
  for (let i = 0; i < teams.length; i++) {
    const { slug, ...rest } = teams[i];
    const item = { entityType: 'teams', id: slug, order: i, ...rest };
    await putItem(item);
    console.log(`  [${i}] ${slug}`);
  }

  console.log('\n--- Hero Slides ---');
  for (let i = 0; i < heroSlides.length; i++) {
    const item = { entityType: 'hero_slides', id: String(i), order: i, ...heroSlides[i] };
    await putItem(item);
    console.log(`  [${i}] ${heroSlides[i].src}`);
  }

  console.log('\nDone! Seeded:');
  console.log(`  ${coaches.length} coaches`);
  console.log(`  ${players.length} players`);
  console.log(`  ${teams.length} teams`);
  console.log(`  ${heroSlides.length} hero slides`);
}

seedAll().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
