-- FirstLink schema. Every object is namespaced with fl_ and created idempotently.
-- Applied once by `node scripts/init-db.mjs` (never at request time).
-- Statements are separated by lines ending in ";" — keep one statement per block, no procedural bodies.
--
-- Retention: a workspace (fl_sessions row) lives 7 days from last activity (expires_at). Deleting the
-- session cascades to incidents, reports, media rows, volunteers, assignments, events, notes, brief
-- revisions and rate-limit rows. The app purges expired workspaces (and their files under DATA_DIR)
-- opportunistically when new workspaces are created. fl_usage rows are kept for 120 days for audit;
-- fl_budgets carries the authoritative running totals so pruning usage rows never frees budget.
-- Uploaded media is never stored in Postgres; fl_media holds only server-generated file names.

CREATE TABLE IF NOT EXISTS fl_sessions (
  id uuid PRIMARY KEY,
  secret_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS fl_sessions_expires_idx ON fl_sessions (expires_at);

CREATE INDEX IF NOT EXISTS fl_sessions_created_idx ON fl_sessions (created_at);

CREATE TABLE IF NOT EXISTS fl_incidents (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE REFERENCES fl_sessions (id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('responding', 'monitoring')),
  reported_at timestamptz NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  staging_area text NOT NULL,
  witness_token_hash text NOT NULL UNIQUE,
  volunteer_token_hash text NOT NULL UNIQUE,
  brief jsonb NOT NULL,
  brief_mode text NOT NULL CHECK (brief_mode IN ('sample', 'gemini', 'rules')),
  brief_revision integer NOT NULL DEFAULT 1,
  brief_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Multi-incident workspaces: one session owns one incident per staged scene (canyon fire, street flood, bluff collapse).
-- The original one-incident-per-session constraint is dropped; (session_id, scene) is unique instead.
ALTER TABLE fl_incidents DROP CONSTRAINT IF EXISTS fl_incidents_session_id_key;

ALTER TABLE fl_incidents ADD COLUMN IF NOT EXISTS scene text NOT NULL DEFAULT 'canyon-fire' CHECK (scene IN ('canyon-fire', 'street-flood', 'bluff-collapse'));

CREATE UNIQUE INDEX IF NOT EXISTS fl_incidents_session_scene_idx ON fl_incidents (session_id, scene);

CREATE TABLE IF NOT EXISTS fl_media (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo', 'audio')),
  mime_type text NOT NULL,
  bytes integer NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fl_media_incident_idx ON fl_media (incident_id);

CREATE TABLE IF NOT EXISTS fl_reports (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  seq integer NOT NULL,
  source_label text NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  text text NOT NULL,
  transcript text,
  photo_media_id uuid,
  audio_media_id uuid,
  kind text NOT NULL CHECK (kind IN ('text', 'photo', 'voice')),
  transcription_status text CHECK (transcription_status IN ('completed', 'failed', 'not_requested')),
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, seq)
);

-- Gemini credibility screening per report (added for simulation mode). NULL = sample report, never screened.
ALTER TABLE fl_reports ADD COLUMN IF NOT EXISTS screening_status text CHECK (screening_status IN ('accepted', 'flagged', 'unscreened'));

ALTER TABLE fl_reports ADD COLUMN IF NOT EXISTS screening_reason text;

-- Set when Gemini routed an unrouted dispatch-intake report to this incident: its one-sentence reason.
ALTER TABLE fl_reports ADD COLUMN IF NOT EXISTS routing_reason text;

CREATE TABLE IF NOT EXISTS fl_volunteers (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  sort integer NOT NULL,
  name text NOT NULL,
  initials text NOT NULL,
  role text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  distance_meters integer NOT NULL,
  available boolean NOT NULL,
  bio text NOT NULL
);

CREATE INDEX IF NOT EXISTS fl_volunteers_incident_idx ON fl_volunteers (incident_id, sort);

CREATE TABLE IF NOT EXISTS fl_assignments (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES fl_volunteers (id) ON DELETE CASCADE,
  task text NOT NULL,
  status text NOT NULL CHECK (status IN ('approved', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS fl_assignments_incident_idx ON fl_assignments (incident_id, created_at);

-- A volunteer can hold at most one active (approved or accepted) assignment.
CREATE UNIQUE INDEX IF NOT EXISTS fl_assignments_one_active_idx ON fl_assignments (volunteer_id) WHERE status IN ('approved', 'accepted');

CREATE TABLE IF NOT EXISTS fl_events (
  n bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id uuid NOT NULL,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('report', 'brief', 'assignment', 'note', 'system')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fl_events_incident_idx ON fl_events (incident_id, n DESC);

CREATE TABLE IF NOT EXISTS fl_notes (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  text text NOT NULL,
  brief_revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fl_notes_incident_idx ON fl_notes (incident_id, created_at);

CREATE TABLE IF NOT EXISTS fl_brief_revisions (
  incident_id uuid NOT NULL REFERENCES fl_incidents (id) ON DELETE CASCADE,
  revision integer NOT NULL,
  mode text NOT NULL CHECK (mode IN ('sample', 'gemini', 'rules')),
  brief jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (incident_id, revision)
);

-- Global provider budgets. `reserved` is the persistent atomic running total of reservations.
-- gemini unit = micro-USD; elevenlabs unit = provider-metered credits (conservative estimate).
CREATE TABLE IF NOT EXISTS fl_budgets (
  provider text PRIMARY KEY,
  unit text NOT NULL,
  cap bigint NOT NULL CHECK (cap >= 0),
  reserved bigint NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fl_usage (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  kind text NOT NULL,
  units integer NOT NULL,
  session_id uuid REFERENCES fl_sessions (id) ON DELETE SET NULL,
  incident_id uuid,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'released')),
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fl_usage_created_idx ON fl_usage (provider, created_at);

-- Fixed-window per-session rate limit counters (bucket e.g. 'gemini:brief').
CREATE TABLE IF NOT EXISTS fl_rate_limits (
  session_id uuid NOT NULL REFERENCES fl_sessions (id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, bucket)
);

-- Small provider results keyed by a SHA-256 of their exact inputs (transcripts of identical audio bytes, screening
-- verdicts of identical reports). Text only, never media. Shared by every server that uses this database, so a staged
-- simulation re-run reuses earlier results instead of paying again. Rows older than 30 days are pruned.
CREATE TABLE IF NOT EXISTS fl_provider_cache (
  key text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('transcript', 'screening')),
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fl_provider_cache_created_idx ON fl_provider_cache (created_at);
