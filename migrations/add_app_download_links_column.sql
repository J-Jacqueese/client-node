-- 为 apps 表新增 download_links 字段（兼容旧版本不支持 ADD COLUMN IF NOT EXISTS 的场景）
-- 执行方式：在目标数据库中直接运行本脚本

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apps'
    AND COLUMN_NAME = 'download_links'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE apps ADD COLUMN download_links JSON COMMENT ''下载链接（JSON格式）'' AFTER website_url',
  'SELECT ''Column download_links already exists'' AS message'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
