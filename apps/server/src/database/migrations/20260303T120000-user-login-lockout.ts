import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('failed_login_attempts', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('locked_until', 'timestamptz', (col) => col)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('locked_until')
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('failed_login_attempts')
    .execute();
}
