-- Migration: Add Google Docs integration fields
-- Created: 2026-02-11

-- Update DocumentTemplate table
ALTER TABLE "DocumentTemplate" DROP COLUMN IF EXISTS "content";
ALTER TABLE "DocumentTemplate" ADD COLUMN IF NOT EXISTS "googleDocId" TEXT NOT NULL DEFAULT '';

-- Update GeneratedDocument table  
ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "googleDocId" TEXT;
ALTER TABLE "GeneratedDocument" ADD COLUMN IF NOT EXISTS "viewLink" TEXT;
