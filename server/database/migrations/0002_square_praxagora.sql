ALTER TABLE "user" ADD COLUMN "is_pro" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text;