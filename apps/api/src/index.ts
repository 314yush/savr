import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { pool } from "./db/client.js";
import { runReminderJob } from "./jobs/reminders.js";
import { z } from "zod";

const app = new Hono();

const webOrigin = process.env.WEB_APP_URL ?? "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: webOrigin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));

const profileSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  email: z.string().email().optional(),
  emailConsent: z.boolean().optional(),
});

app.get("/profiles/:wallet", async (c) => {
  const wallet = c.req.param("wallet").toLowerCase();
  const result = await pool.query("SELECT * FROM profiles WHERE wallet_address = $1", [wallet]);
  if (result.rowCount === 0) return c.json({ walletAddress: wallet, email: null, emailConsent: false });
  const row = result.rows[0];
  return c.json({
    walletAddress: row.wallet_address,
    email: row.email,
    emailConsent: row.email_consent,
  });
});

app.put("/profiles/:wallet", async (c) => {
  const wallet = c.req.param("wallet").toLowerCase();
  const body = profileSchema.parse(await c.req.json());
  await pool.query(
    `INSERT INTO profiles (wallet_address, email, email_consent)
     VALUES ($1, $2, COALESCE($3, false))
     ON CONFLICT (wallet_address)
     DO UPDATE SET email = EXCLUDED.email, email_consent = EXCLUDED.email_consent, updated_at = NOW()`,
    [wallet, body.email ?? null, body.emailConsent ?? false]
  );
  return c.json({ ok: true });
});

const goalMetaSchema = z.object({
  goalId: z.number().int().positive(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  coverImage: z.string().optional(),
  reminderCadence: z.enum(["off", "weekly", "biweekly", "monthly"]).optional(),
  reminderDay: z.number().int().min(0).max(6).optional(),
});

app.get("/goals/:goalId/metadata", async (c) => {
  const goalId = c.req.param("goalId");
  const result = await pool.query("SELECT * FROM goal_metadata WHERE goal_id = $1", [goalId]);
  if (result.rowCount === 0) return c.json({ goalId: Number(goalId), coverImage: null, reminderCadence: "weekly" });
  const row = result.rows[0];
  return c.json({
    goalId: Number(row.goal_id),
    coverImage: row.cover_image,
    reminderCadence: row.reminder_cadence,
    reminderDay: row.reminder_day,
  });
});

app.put("/goals/metadata", async (c) => {
  const body = goalMetaSchema.parse(await c.req.json());
  await pool.query(
    `INSERT INTO profiles (wallet_address) VALUES ($1) ON CONFLICT DO NOTHING`,
    [body.walletAddress.toLowerCase()]
  );
  await pool.query(
    `INSERT INTO goal_metadata (goal_id, wallet_address, cover_image, reminder_cadence, reminder_day)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (goal_id)
     DO UPDATE SET cover_image = EXCLUDED.cover_image,
                   reminder_cadence = EXCLUDED.reminder_cadence,
                   reminder_day = EXCLUDED.reminder_day`,
    [
      body.goalId,
      body.walletAddress.toLowerCase(),
      body.coverImage ?? null,
      body.reminderCadence ?? "weekly",
      body.reminderDay ?? 1,
    ]
  );
  return c.json({ ok: true });
});

app.get("/goals/metadata/wallet/:wallet", async (c) => {
  const wallet = c.req.param("wallet").toLowerCase();
  const result = await pool.query("SELECT * FROM goal_metadata WHERE wallet_address = $1", [wallet]);
  return c.json(
    result.rows.map((row) => ({
      goalId: Number(row.goal_id),
      coverImage: row.cover_image,
      reminderCadence: row.reminder_cadence,
      reminderDay: row.reminder_day,
    }))
  );
});

app.post("/internal/reminders/run", async (c) => {
  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.text("Unauthorized", 401);
  }
  const result = await runReminderJob();
  return c.json(result);
});

app.post("/unsubscribe", async (c) => {
  const { wallet } = await c.req.json();
  if (!wallet) return c.text("Bad request", 400);
  await pool.query(
    "UPDATE profiles SET email_consent = false, updated_at = NOW() WHERE wallet_address = $1",
    [wallet.toLowerCase()]
  );
  return c.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3001);
console.log(`API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
