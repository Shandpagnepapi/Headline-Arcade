import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull().default("Anonymous"),
  game: text("game").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true, createdAt: true }).extend({
  playerName: z.string().min(1).max(24).default("Anonymous"),
  game: z.enum(["ww11", "cannon", "alien"]),
  score: z.number().int().min(0).max(99999),
});

export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
