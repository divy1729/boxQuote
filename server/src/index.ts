import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { initialiseDatabase, pool } from "./db.js";
import { calculateQuote } from "./calculator.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "development-only-secret-change-me";
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json());

type AuthRequest = Request & { userId?: number };
const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void handler(req, res, next).catch(next);

function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  try { req.userId = Number((jwt.verify(token, jwtSecret) as { sub: string }).sub); next(); }
  catch { return res.status(401).json({ message: "Your session has expired. Please sign in again." }); }
}

const credentials = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(72) });
const quoteInput = z.object({
  customerName: z.string().trim().min(1).max(120), notes: z.string().trim().max(1000).optional().default(""),
  lengthMm: z.coerce.number().positive(), widthMm: z.coerce.number().positive(), heightMm: z.coerce.number().positive(),
  gsm: z.coerce.number().positive(), paperRate: z.coerce.number().positive(), conversionRate: z.coerce.number().positive(),
  wastagePercent: z.coerce.number().min(0).max(100), marginPercent: z.coerce.number().min(0).max(1000), quantity: z.coerce.number().int().positive().max(10_000_000)
});
const tokenFor = (id: number) => jwt.sign({ sub: String(id) }, jwtSecret, { expiresIn: "7d" });

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.post("/api/auth/signup", asyncRoute(async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const hash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query<{ id: number; email: string }>("INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id, email", [email.toLowerCase(), hash]);
    const user = result.rows[0]; res.status(201).json({ token: tokenFor(user.id), user });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") return res.status(409).json({ message: "An account with this email already exists." });
    throw error;
  }
}));
app.post("/api/auth/signin", asyncRoute(async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const result = await pool.query<{ id: number; email: string; password_hash: string }>("SELECT id, email, password_hash FROM users WHERE email = $1", [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: "Email or password is incorrect." });
  res.json({ token: tokenFor(user.id), user: { id: user.id, email: user.email } });
}));
app.get("/api/auth/me", auth, asyncRoute(async (req: AuthRequest, res) => {
  const result = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.userId]);
  if (!result.rows[0]) return res.status(401).json({ message: "Account no longer exists." }); res.json({ user: result.rows[0] });
}));

app.get("/api/quotes", auth, asyncRoute(async (req: AuthRequest, res) => {
  const result = await pool.query("SELECT id, customer_name AS \"customerName\", length_mm AS \"lengthMm\", width_mm AS \"widthMm\", height_mm AS \"heightMm\", quantity, quote_total AS \"quoteTotal\", created_at AS \"createdAt\" FROM quotes WHERE user_id = $1 ORDER BY created_at DESC", [req.userId]);
  res.json({ quotes: result.rows });
}));
app.get("/api/quotes/:id", auth, asyncRoute(async (req: AuthRequest, res) => {
  const result = await pool.query("SELECT id, customer_name AS \"customerName\", notes, length_mm AS \"lengthMm\", width_mm AS \"widthMm\", height_mm AS \"heightMm\", gsm, paper_rate AS \"paperRate\", conversion_rate AS \"conversionRate\", wastage_percent AS \"wastagePercent\", margin_percent AS \"marginPercent\", quantity, sheet_length_mm AS \"sheetLengthMm\", sheet_width_mm AS \"sheetWidthMm\", board_area_sqm AS \"boardAreaSqm\", weight_kg AS \"weightKg\", material_cost AS \"materialCost\", conversion_cost AS \"conversionCost\", wastage_cost AS \"wastageCost\", cost_per_box AS \"costPerBox\", price_per_box AS \"pricePerBox\", quote_total AS \"quoteTotal\", created_at AS \"createdAt\" FROM quotes WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
  if (!result.rows[0]) return res.status(404).json({ message: "Quote not found." }); res.json({ quote: result.rows[0] });
}));
app.post("/api/quotes", auth, asyncRoute(async (req: AuthRequest, res) => {
  const input = quoteInput.parse(req.body); const calculation = calculateQuote(input);
  const fields = { ...input, ...calculation };
  const result = await pool.query(`INSERT INTO quotes (user_id, customer_name, notes, length_mm, width_mm, height_mm, gsm, paper_rate, conversion_rate, wastage_percent, margin_percent, quantity, sheet_length_mm, sheet_width_mm, board_area_sqm, weight_kg, material_cost, conversion_cost, wastage_cost, cost_per_box, price_per_box, quote_total)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
    [req.userId, fields.customerName, fields.notes, fields.lengthMm, fields.widthMm, fields.heightMm, fields.gsm, fields.paperRate, fields.conversionRate, fields.wastagePercent, fields.marginPercent, fields.quantity, fields.sheetLengthMm, fields.sheetWidthMm, fields.boardAreaSqm, fields.weightKg, fields.materialCost, fields.conversionCost, fields.wastageCost, fields.costPerBox, fields.pricePerBox, fields.quoteTotal]);
  res.status(201).json({ id: result.rows[0].id, calculation });
}));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid input." });
  console.error(error); res.status(500).json({ message: "Something went wrong. Please try again." });
});

initialiseDatabase().then(() => app.listen(port, () => console.log(`BoxQuote API on :${port}`))).catch((error) => { console.error("Database startup failed", error); process.exit(1); });
