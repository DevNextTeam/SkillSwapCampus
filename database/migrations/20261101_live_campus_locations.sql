-- Run once in phpMyAdmin after selecting skillswap_campus.
-- Location sharing is opt-in. Stale coordinates are hidden after two minutes.
CREATE TABLE IF NOT EXISTS live_locations (
  user_id INT(11) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy_meters DECIMAL(8,2) DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_live_locations_updated (updated_at),
  CONSTRAINT fk_live_location_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
