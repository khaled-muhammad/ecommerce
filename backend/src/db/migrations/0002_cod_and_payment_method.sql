ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "cod_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text;
