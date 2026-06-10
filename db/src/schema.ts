// Drizzle schema — source of truth for the kproj Postgres database.
// See /Users/jantiyamek/.claude/plans/you-are-an-expert-snoopy-marble.md
// §"Database schema (initial)" for design notes.

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Cognito 'sub' claim
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  isAllowed: boolean('is_allowed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Kind distinguishes idol groups, soloists (groups of 1), and topics —
// themed collections with no members (e.g. NL, Futa).
export const groupKind = pgEnum('group_kind', ['group', 'soloist', 'topic']);

export const groups = pgTable(
  'groups',
  {
    id: text('id').primaryKey(), // slug, e.g. 'lesserafim'
    name: text('name').notNull(),
    kind: groupKind('kind').notNull().default('group'),
    debutYear: integer('debut_year'),
    agency: text('agency'),
    coverMediaKey: text('cover_media_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('groups_name_length', sql`length(${t.name}) BETWEEN 1 AND 100`),
    check(
      'groups_debut_year_range',
      sql`${t.debutYear} IS NULL OR ${t.debutYear} BETWEEN 1990 AND 2100`,
    ),
    check('groups_agency_length', sql`${t.agency} IS NULL OR length(${t.agency}) <= 100`),
  ],
);

export const members = pgTable(
  'members',
  {
    id: text('id').notNull(), // slug, unique per group
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    stageName: text('stage_name').notNull(),
    position: text('position'),
    bio: text('bio'),
    profileMediaKey: text('profile_media_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.id] }),
    check('members_stage_name_length', sql`length(${t.stageName}) BETWEEN 1 AND 100`),
    check('members_position_length', sql`${t.position} IS NULL OR length(${t.position}) <= 100`),
    check('members_bio_length', sql`${t.bio} IS NULL OR length(${t.bio}) <= 5000`),
  ],
);

// Eras = album/comeback cycles, scoped to a group. Media can belong to one.
// Defined before `media` so media's eraId FK resolves.
export const eras = pgTable(
  'eras',
  {
    id: uuid('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    label: text('label').notNull(), // e.g. "2024 · Crazy"
    releaseDate: date('release_date'), // optional
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('eras_label_length', sql`length(${t.label}) BETWEEN 1 AND 100`),
    index('idx_eras_group').on(t.groupId),
  ],
);

export const mediaKind = pgEnum('media_kind', ['image', 'gif', 'video']);

export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey(),
    s3Key: text('s3_key').notNull().unique(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    memberId: text('member_id'),
    eraId: uuid('era_id').references(() => eras.id, { onDelete: 'set null' }),
    kind: mediaKind('kind').notNull(),
    caption: text('caption'),
    tags: text('tags').array().notNull().default(sql`'{}'`),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
  },
  (t) => [
    // Composite FK: cascade-delete media when its parent member is deleted.
    // The plan called for SET NULL, but media.group_id is NOT NULL so that
    // version would have failed at delete time. Cascade preserves intent:
    // a deleted member's gallery disappears with them.
    foreignKey({
      columns: [t.groupId, t.memberId],
      foreignColumns: [members.groupId, members.id],
      name: 'media_member_fk',
    }).onDelete('cascade'),
    check('media_caption_length', sql`${t.caption} IS NULL OR length(${t.caption}) <= 500`),
    index('idx_media_group').on(t.groupId),
    index('idx_media_member').on(t.groupId, t.memberId),
    index('idx_media_era').on(t.eraId),
  ],
);

// Re-export inferred types for downstream packages (API, frontend via path alias).
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Era = typeof eras.$inferSelect;
export type NewEra = typeof eras.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
