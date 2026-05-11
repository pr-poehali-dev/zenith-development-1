CREATE TABLE IF NOT EXISTS t_p71111086_zenith_development_1.tracks (
  id SERIAL PRIMARY KEY,
  cell_row INTEGER NOT NULL,
  cell_col INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'audio',
  duration TEXT DEFAULT '',
  color TEXT DEFAULT 'from-purple-900 to-indigo-900',
  emoji TEXT DEFAULT '🎵',
  created_at TIMESTAMP DEFAULT NOW()
);