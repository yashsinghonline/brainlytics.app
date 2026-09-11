// Seeds friendly rival players so the leaderboard feels alive.
// Run: node --env-file=.env scripts/seed.mjs
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});

const BOTS = [
  ["Alex", "diamond", 1],
  ["Sam", "bolt", 0.95],
  ["Rahul", "target", 0.9],
  ["Mira", "grid", 0.86],
  ["Kenji", "star", 0.82],
  ["Lena", "focus", 0.78],
  ["Diego", "pattern", 0.74],
  ["Nora", "flame", 0.7],
  ["Tobi", "speed", 0.64],
  ["Zara", "memory", 0.58],
  ["Ivan", "logic", 0.5],
  ["Maya", "crown", 0.42],
];

const GAMES = [
  "quick-math",
  "memory-grid",
  "color-switch",
  "number-sequence",
  "odd-one-out",
  "reaction-tap",
  "number-memory",
  "logic-tiles",
  "fast-count",
  "direction-challenge",
  "word-memory",
  "mental-rotation",
];

const TARGETS = {
  "quick-math": 6000,
  "memory-grid": 4000,
  "color-switch": 5000,
  "number-sequence": 3000,
  "odd-one-out": 3500,
  "reaction-tap": 3500,
  "number-memory": 3500,
  "logic-tiles": 3000,
  "fast-count": 3500,
  "direction-challenge": 5000,
  "word-memory": 3500,
  "mental-rotation": 3000,
};

function dayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function main() {
  const client = await pool.connect();
  try {
    const existing = await client.query("select count(*)::int as count from players where is_bot = true");
    if (existing.rows[0].count > 0) {
      console.log("Bots already seeded, skipping.");
      return;
    }

    for (const [name, avatar, strength] of BOTS) {
      const streak = Math.floor(strength * 14) + 1;
      const inserted = await client.query(
        `insert into players (name, avatar, is_bot, streak, longest_streak, last_played_day, total_games)
         values ($1, $2, true, $3, $3, $4, $5) returning id`,
        [name, avatar, streak, dayKey(0), Math.floor(strength * 60) + 6],
      );
      const playerId = inserted.rows[0].id;

      const values = [];
      const params = [];
      let i = 1;
      // spread sessions across today, this week and this month
      for (let dayOffset = 0; dayOffset <= 29; dayOffset += 1) {
        const active = Math.random() < (dayOffset < 7 ? 0.8 : 0.35);
        if (!active) continue;
        const sessionsToday = 1 + Math.floor(Math.random() * 3);
        for (let s = 0; s < sessionsToday; s += 1) {
          const game = GAMES[Math.floor(Math.random() * GAMES.length)];
          const target = TARGETS[game];
          const score = Math.round(target * strength * (0.55 + Math.random() * 0.6));
          const rounds = 8 + Math.floor(Math.random() * 20);
          const correct = Math.max(1, Math.round(rounds * (0.55 + Math.random() * 0.45)));
          values.push(
            `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`,
          );
          params.push(
            playerId,
            game,
            score,
            Math.round((correct / rounds) * 1000) / 10,
            Math.min(30, Math.round(correct * 0.4)),
            1 + Math.floor(Math.random() * 4),
            rounds,
            correct,
            220 + Math.floor(Math.random() * 400),
            20000 + Math.floor(Math.random() * 60000),
            dayKey(dayOffset),
          );
        }
      }
      if (values.length) {
        await client.query(
          `insert into game_sessions
           (player_id, game_id, score, accuracy, max_combo, level, rounds, correct, avg_reaction_ms, duration_ms, day)
           values ${values.join(",")}`,
          params,
        );
      }
    }
    console.log(`Seeded ${BOTS.length} rival players.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
