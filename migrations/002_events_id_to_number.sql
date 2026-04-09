-- 迁移脚本：将 events 表的 slug ID 转换为数字 ID
-- 执行前请先备份数据库！

USE deepseek_club;

-- 1. 创建临时表存储旧ID和新ID的映射
CREATE TEMPORARY TABLE IF NOT EXISTS event_id_mapping (
  old_id VARCHAR(64),
  new_id VARCHAR(64),
  PRIMARY KEY (old_id)
);

-- 2. 生成映射关系：为每个非纯数字ID分配一个新的数字ID
SET @row_num = 0;
INSERT INTO event_id_mapping (old_id, new_id)
SELECT 
  id AS old_id,
  (@row_num := @row_num + 1) AS new_id
FROM events
WHERE id NOT REGEXP '^[0-9]+$'
ORDER BY created_at;

-- 3. 先更新 event_registrations 表中的 event_id（需要临时禁用外键检查）
SET FOREIGN_KEY_CHECKS = 0;

-- 创建临时表保存更新后的 registrations
CREATE TEMPORARY TABLE IF NOT EXISTS temp_registrations AS
SELECT 
  r.id,
  COALESCE(m.new_id, r.event_id) AS new_event_id,
  r.name, r.email, r.phone, r.company, r.role,
  r.team_name, r.team_size, r.ticket_count, r.notes, r.payment_status,
  r.created_at
FROM event_registrations r
LEFT JOIN event_id_mapping m ON r.event_id = m.old_id;

-- 清空原表并插入更新后的数据
TRUNCATE TABLE event_registrations;
INSERT INTO event_registrations 
  (id, event_id, name, email, phone, company, role, team_name, team_size, ticket_count, notes, payment_status, created_at)
SELECT 
  id, new_event_id, name, email, phone, company, role, team_name, team_size, ticket_count, notes, payment_status, created_at
FROM temp_registrations;

-- 4. 更新 events 表的 ID
-- MySQL 不允许直接 UPDATE 主键，需要用临时表
CREATE TEMPORARY TABLE IF NOT EXISTS temp_events AS
SELECT 
  COALESCE(m.new_id, e.id) AS new_id,
  e.title, e.`desc`, e.full_desc, e.event_type, e.event_mode, e.event_status, e.city,
  e.cover_image, e.start_date, e.end_date, e.location, e.online_url,
  e.organizer, e.organizer_logo, e.speakers, e.tags,
  e.max_participants, e.current_participants, e.price,
  e.highlights, e.agenda, e.sponsors, e.registration_url,
  e.sort_weight, e.likes, e.approval_status, e.created_at, e.updated_at
FROM events e
LEFT JOIN event_id_mapping m ON e.id = m.old_id;

-- 清空原表并插入更新后的数据
TRUNCATE TABLE events;
INSERT INTO events 
  (id, title, `desc`, full_desc, event_type, event_mode, event_status, city,
   cover_image, start_date, end_date, location, online_url, organizer, organizer_logo,
   speakers, tags, max_participants, current_participants, price,
   highlights, agenda, sponsors, registration_url,
   sort_weight, likes, approval_status, created_at, updated_at)
SELECT 
  new_id, title, `desc`, full_desc, event_type, event_mode, event_status, city,
  cover_image, start_date, end_date, location, online_url, organizer, organizer_logo,
  speakers, tags, max_participants, current_participants, price,
  highlights, agenda, sponsors, registration_url,
  sort_weight, likes, approval_status, created_at, updated_at
FROM temp_events;

-- 5. 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 6. 清理临时表
DROP TEMPORARY TABLE IF EXISTS event_id_mapping;
DROP TEMPORARY TABLE IF EXISTS temp_registrations;
DROP TEMPORARY TABLE IF EXISTS temp_events;

-- 7. 显示迁移结果
SELECT 'Migration completed!' AS status;
SELECT id, title FROM events ORDER BY CAST(id AS UNSIGNED);
