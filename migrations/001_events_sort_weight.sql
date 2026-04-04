-- 若库中尚无 sort_weight，请手动执行（启动 server 时也会尝试自动补列）
-- USE your_database_name;

ALTER TABLE events
  ADD COLUMN sort_weight INT NOT NULL DEFAULT 0 COMMENT '列表排序权重，越大越靠前'
  AFTER registration_url;
