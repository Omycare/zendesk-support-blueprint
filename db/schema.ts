import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('blueprint_projects',{id:text('id').primaryKey(),name:text('name').notNull(),data:text('data').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull(),lastMutation:text('last_mutation').notNull()});
export const members=sqliteTable('blueprint_members',{projectId:text('project_id').notNull().references(()=>projects.id),email:text('email').notNull()},t=>[primaryKey({columns:[t.projectId,t.email]})]);
export const events=sqliteTable('blueprint_events',{id:integer('id').primaryKey({autoIncrement:true}),projectId:text('project_id').notNull().references(()=>projects.id),at:text('at').notNull(),actor:text('actor').notNull(),changes:text('changes').notNull()});
export const settings=sqliteTable('blueprint_settings',{key:text('key').primaryKey(),value:text('value').notNull(),revision:integer('revision').notNull().default(1)});
export const credentials=sqliteTable('blueprint_credentials',{projectId:text('project_id').primaryKey().references(()=>projects.id),ciphertext:text('ciphertext').notNull(),iv:text('iv').notNull(),expiresAt:integer('expires_at').notNull()});
export const attempts=sqliteTable('blueprint_attempts',{key:text('key').primaryKey(),count:integer('count').notNull(),resetAt:integer('reset_at').notNull()});
