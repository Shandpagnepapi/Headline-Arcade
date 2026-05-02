import { Router } from "express";
import { db, scoresTable } from "@workspace/db";
import { insertScoreSchema } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

router.post("/scores", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const parsed = insertScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid score data", details: parsed.error.issues });
    return;
  }
  const row = await db.insert(scoresTable).values(parsed.data).returning();
  res.status(201).json(row[0]);
});

router.get("/scores/leaderboard", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const game = req.query.game as string | undefined;
  const validGames = ["ww11", "cannon", "alien"];

  if (game && !validGames.includes(game)) {
    res.status(400).json({ error: "Invalid game" });
    return;
  }

  // Best score per player per game (top 10)
  const rows = await db
    .select({
      playerName: scoresTable.playerName,
      game: scoresTable.game,
      score: sql<number>`max(${scoresTable.score})`.as("score"),
    })
    .from(scoresTable)
    .where(game ? eq(scoresTable.game, game) : sql`1=1`)
    .groupBy(scoresTable.playerName, scoresTable.game)
    .orderBy(desc(sql`max(${scoresTable.score})`))
    .limit(10);

  res.json(rows);
});

router.get("/scores/all-leaderboard", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const games = ["ww11", "cannon", "alien"];
  const result: Record<string, { playerName: string; score: number }[]> = {};

  await Promise.all(
    games.map(async (g) => {
      result[g] = await db
        .select({
          playerName: scoresTable.playerName,
          score: sql<number>`max(${scoresTable.score})`.as("score"),
        })
        .from(scoresTable)
        .where(eq(scoresTable.game, g))
        .groupBy(scoresTable.playerName)
        .orderBy(desc(sql`max(${scoresTable.score})`))
        .limit(5);
    })
  );

  res.json(result);
});

export default router;
