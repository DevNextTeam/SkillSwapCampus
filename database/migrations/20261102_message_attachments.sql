-- Secure private-message attachments for SkillSwap Campus
-- Run once in phpMyAdmin after selecting skillswap_campus.
ALTER TABLE messages
  ADD COLUMN attachment_path VARCHAR(255) NULL AFTER body,
  ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_path,
  ADD COLUMN attachment_mime VARCHAR(100) NULL AFTER attachment_name,
  ADD COLUMN attachment_size INT UNSIGNED NULL AFTER attachment_mime;
