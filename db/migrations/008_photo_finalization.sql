-- Guest photo curation: track which photos are marked final and whether member has submitted
ALTER TABLE event_photos ADD COLUMN is_final BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE event_members ADD COLUMN submitted_at TIMESTAMPTZ;
