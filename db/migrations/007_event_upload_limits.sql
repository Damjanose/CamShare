ALTER TABLE events
  ADD COLUMN max_photos_per_user INT DEFAULT NULL,
  ADD COLUMN max_file_size_mb    INT DEFAULT NULL;
