#!/usr/bin/env node
/**
 * Pre-build script: fetches data from DynamoDB and writes src/data/*.ts files.
 * If CMS_TABLE_NAME is not set, exits 0 — the existing TS files are used as-is.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');

const TABLE_NAME = process.env.CMS_TABLE_NAME;

if (!TABLE_NAME) {
  console.log('[fetch-cms-data] CMS_TABLE_NAME not set — using existing src/data/*.ts files.');
  process.exit(0);
}

// Dynamic imports so this script can gracefully exit above when SDK isn't installed
const { DynamoDBClient, QueryCommand } = await import('@aws-sdk/client-dynamodb');
const { unmarshall } = await import('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function queryEntity(entityType) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'entityType = :et',
    ExpressionAttributeValues: {
      ':et': { S: entityType },
    },
  }));
  const items = (result.Items || []).map(item => unmarshall(item));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

function jsonStr(val) {
  return JSON.stringify(val);
}

function generateCoachesTs(coaches) {
  const lines = [
    `export type Coach = {`,
    `  slug: string;`,
    `  name: string;`,
    `  role: string;`,
    `  title: string;`,
    `  imageSrc: string;`,
    `  imageAlt: string;`,
    `  /** Short card blurb */`,
    `  summary: string;`,
    `  bio: string[];`,
    `  credentials?: string[];`,
    `};`,
    ``,
    `export const coaches: Coach[] = [`,
  ];

  for (const c of coaches) {
    lines.push(`  {`);
    lines.push(`    slug: ${jsonStr(c.id)},`);
    lines.push(`    name: ${jsonStr(c.name)},`);
    lines.push(`    role: ${jsonStr(c.role)},`);
    lines.push(`    title: ${jsonStr(c.title)},`);
    lines.push(`    imageSrc: ${jsonStr(c.imageSrc)},`);
    lines.push(`    imageAlt: ${jsonStr(c.imageAlt)},`);
    lines.push(`    summary: ${jsonStr(c.summary)},`);
    lines.push(`    bio: ${jsonStr(c.bio)},`);
    if (c.credentials !== undefined) {
      lines.push(`    credentials: ${jsonStr(c.credentials)},`);
    }
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`export function getCoachBySlug(slug: string): Coach | undefined {`);
  lines.push(`  return coaches.find((c) => c.slug === slug);`);
  lines.push(`}`);
  lines.push(``);

  return lines.join('\n');
}

function generatePlayersTs(players) {
  const lines = [
    `export type Player = {`,
    `  slug: string;`,
    `  name: string;`,
    `  number: string;`,
    `  position: string;`,
    `};`,
    ``,
    `export const players: Player[] = [`,
  ];

  for (const p of players) {
    lines.push(`  {`);
    lines.push(`    slug: ${jsonStr(p.id)},`);
    lines.push(`    name: ${jsonStr(p.name)},`);
    lines.push(`    number: ${jsonStr(p.number)},`);
    lines.push(`    position: ${jsonStr(p.position)},`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);

  return lines.join('\n');
}

function generateTeamsTs(teams) {
  const lines = [
    `export interface Team {`,
    `  slug: string;`,
    `  name: string;`,
    `  ageGroup: string;`,
    `  season: string;`,
    `  playerSlugs: string[];`,
    `  galleryImages: string[];`,
    `}`,
    ``,
    `export const teams: Team[] = [`,
  ];

  for (const t of teams) {
    lines.push(`  {`);
    lines.push(`    slug: ${jsonStr(t.id)},`);
    lines.push(`    name: ${jsonStr(t.name)},`);
    lines.push(`    ageGroup: ${jsonStr(t.ageGroup)},`);
    lines.push(`    season: ${jsonStr(t.season)},`);
    lines.push(`    playerSlugs: ${jsonStr(t.playerSlugs || [])},`);
    lines.push(`    galleryImages: ${jsonStr(t.galleryImages || [])},`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`export function getTeamBySlug(slug: string): Team | undefined {`);
  lines.push(`  return teams.find((t) => t.slug === slug);`);
  lines.push(`}`);
  lines.push(``);

  return lines.join('\n');
}

function generateSlidesTs(slides) {
  const lines = [
    `export interface HeroSlide {`,
    `  /** Path to the image inside /public */`,
    `  src: string;`,
    `  width: number;`,
    `  height: number;`,
    `  /** Small tag above the title, e.g. "Player Spotlight" */`,
    `  heading?: string;`,
    `  /** Large headline, e.g. "#19 Payton Ziegler" */`,
    `  title?: string;`,
    `  /** One-line description below the title, e.g. "See more about Payton" */`,
    `  description?: string;`,
    `  /** Optional CTA buttons */`,
    `  buttons?: {`,
    `    label: string;`,
    `    href: string;`,
    `  }[];`,
    `}`,
    ``,
    `export const heroSlides: HeroSlide[] = [`,
  ];

  for (const s of slides) {
    lines.push(`  {`);
    lines.push(`    src: ${jsonStr(s.src)},`);
    lines.push(`    width: ${s.width},`);
    lines.push(`    height: ${s.height},`);
    if (s.heading !== undefined) lines.push(`    heading: ${jsonStr(s.heading)},`);
    if (s.title !== undefined) lines.push(`    title: ${jsonStr(s.title)},`);
    if (s.description !== undefined) lines.push(`    description: ${jsonStr(s.description)},`);
    if (s.buttons !== undefined && s.buttons.length > 0) {
      lines.push(`    buttons: ${jsonStr(s.buttons)},`);
    }
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);

  return lines.join('\n');
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log(`[fetch-cms-data] Fetching from table: ${TABLE_NAME}`);

  const [coaches, players, teams, slides] = await Promise.all([
    queryEntity('coaches'),
    queryEntity('players'),
    queryEntity('teams'),
    queryEntity('hero_slides'),
  ]);

  if (coaches.length > 0) {
    const ts = generateCoachesTs(coaches);
    writeFileSync(join(DATA_DIR, 'coaches.ts'), ts, 'utf8');
    console.log(`[fetch-cms-data] Wrote coaches.ts (${coaches.length} items)`);
  } else {
    console.log('[fetch-cms-data] No coaches in DDB — keeping existing coaches.ts');
  }

  if (players.length > 0) {
    const ts = generatePlayersTs(players);
    writeFileSync(join(DATA_DIR, 'players.ts'), ts, 'utf8');
    console.log(`[fetch-cms-data] Wrote players.ts (${players.length} items)`);
  } else {
    console.log('[fetch-cms-data] No players in DDB — keeping existing players.ts');
  }

  if (teams.length > 0) {
    const ts = generateTeamsTs(teams);
    writeFileSync(join(DATA_DIR, 'teams.ts'), ts, 'utf8');
    console.log(`[fetch-cms-data] Wrote teams.ts (${teams.length} items)`);
  } else {
    console.log('[fetch-cms-data] No teams in DDB — keeping existing teams.ts');
  }

  if (slides.length > 0) {
    const ts = generateSlidesTs(slides);
    writeFileSync(join(DATA_DIR, 'hero-slides.ts'), ts, 'utf8');
    console.log(`[fetch-cms-data] Wrote hero-slides.ts (${slides.length} items)`);
  } else {
    console.log('[fetch-cms-data] No hero_slides in DDB — keeping existing hero-slides.ts');
  }

  console.log('[fetch-cms-data] Done.');
}

main().catch(err => {
  console.error('[fetch-cms-data] Error:', err);
  process.exit(1);
});
