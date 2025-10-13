-- AlterTable: Add preference_setting column with default value
ALTER TABLE "users" ADD COLUMN "preference_setting" JSONB NOT NULL DEFAULT '{}';

-- Migrate existing data from preferred_language and timezone to preference_setting
UPDATE "users" 
SET "preference_setting" = jsonb_build_object(
  'language', COALESCE("preferred_language", 'en'),
  'timezone', COALESCE("timezone", 'UTC')
);

-- Drop old columns
ALTER TABLE "users" DROP COLUMN "preferred_language";
ALTER TABLE "users" DROP COLUMN "timezone";

