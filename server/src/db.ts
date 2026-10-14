import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function initialiseDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      length_mm NUMERIC NOT NULL, width_mm NUMERIC NOT NULL, height_mm NUMERIC NOT NULL,
      gsm NUMERIC NOT NULL, paper_rate NUMERIC NOT NULL, conversion_rate NUMERIC NOT NULL,
      wastage_percent NUMERIC NOT NULL, margin_percent NUMERIC NOT NULL, quantity INTEGER NOT NULL,
      sheet_length_mm NUMERIC NOT NULL, sheet_width_mm NUMERIC NOT NULL, board_area_sqm NUMERIC NOT NULL,
      weight_kg NUMERIC NOT NULL, material_cost NUMERIC NOT NULL, conversion_cost NUMERIC NOT NULL,
      wastage_cost NUMERIC NOT NULL, cost_per_box NUMERIC NOT NULL, price_per_box NUMERIC NOT NULL,
      quote_total NUMERIC NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS quotes_user_created_idx ON quotes (user_id, created_at DESC);
  `);
}
