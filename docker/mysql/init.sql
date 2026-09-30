CREATE DATABASE IF NOT EXISTS hydra_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON hydra_db.* TO 'poc'@'%';

CREATE TABLE IF NOT EXISTS app_db.users (
  id CHAR(36) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  verification_code_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_phone_number_uq (phone_number)
);

CREATE TABLE IF NOT EXISTS app_db.oauth_sessions (
  id CHAR(36) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token_expires_at DATETIME(3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO app_db.users (id, phone_number, verification_code_hash)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '0812345678',
  '$argon2id$v=19$m=65536,t=2,p=1$B0OUKNzc/dDv9U6C7pdgQerpvC5jkNyWq794cR2a/I8$wzFaVFrCoVTk/5OqLvdbmlpxYGU+NBZhGCsUiImZzmI'
);
