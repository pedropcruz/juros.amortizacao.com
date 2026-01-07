CREATE TYPE "public"."euribor_period" AS ENUM('3m', '6m', '12m');--> statement-breakpoint
CREATE TYPE "public"."rate_type" AS ENUM('variable', 'fixed', 'mixed');--> statement-breakpoint
CREATE TABLE "euribor_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"rate_3m" double precision,
	"rate_6m" double precision,
	"rate_12m" double precision,
	"is_official" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "rate_type" "rate_type" DEFAULT 'variable';--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "euribor_period" "euribor_period";--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "contract_start_date" date;--> statement-breakpoint
ALTER TABLE "simulations" ADD COLUMN "next_revision_date" date;