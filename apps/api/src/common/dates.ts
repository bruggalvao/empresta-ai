// Dates of loans are calendar dates. "Today" is taken from the database in
// America/Sao_Paulo (modelagem-dados.md, decisão 4): the API runs in UTC on
// Vercel, so the Node clock would be a day ahead every evening in Brazil.

type RawQuery = { $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T> };

/** Today and today + days in São Paulo, as "YYYY-MM-DD". Text, so no driver turns a date into local midnight. */
export async function saoPauloDates(db: RawQuery, plusDays = 0): Promise<{ today: string; plus: string }> {
  const [row] = await db.$queryRaw<{ today: string; plus: string }[]>`
    SELECT to_char(d, 'YYYY-MM-DD') AS today, to_char(d + ${plusDays}::int, 'YYYY-MM-DD') AS plus
    FROM (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d) AS s`;
  return row;
}

/** A Prisma @db.Date value (UTC midnight) as "YYYY-MM-DD". */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** "YYYY-MM-DD" as the Date Prisma expects for a @db.Date column. */
export const dateColumn = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
