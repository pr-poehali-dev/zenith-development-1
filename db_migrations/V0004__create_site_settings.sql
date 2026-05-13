CREATE TABLE IF NOT EXISTS t_p71111086_zenith_development_1.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p71111086_zenith_development_1.site_settings (key, value) VALUES
  ('hero_gif_url',    ''),
  ('hero_banner_url', ''),
  ('hero_title',      ''),
  ('hero_subtitle',   '')
ON CONFLICT (key) DO NOTHING;