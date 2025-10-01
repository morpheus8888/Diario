-- Drop legacy tables
DROP TABLE IF EXISTS "journal_entries" CASCADE;
DROP TABLE IF EXISTS "reminders" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "ReminderType";

-- Create new auth tables
CREATE TABLE "DevUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DevSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "DevSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "DevUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DevSession_userId_idx" ON "DevSession" ("userId");

-- Create entry table
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "mood" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Entry_userId_idx" ON "Entry" ("userId");
