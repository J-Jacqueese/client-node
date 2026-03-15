-- 基座模型表迁移脚本
-- 在现有数据库中添加 base_models 表

USE deepseek_club;

-- 创建基座模型表
CREATE TABLE IF NOT EXISTS base_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '基座模型名称（唯一标识）',
  display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
  description TEXT COMMENT '描述',
  version VARCHAR(50) COMMENT '版本号',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='基座模型表';

-- 插入初始基座模型数据
INSERT INTO base_models (name, display_name, description, version, sort_order, is_active) VALUES
('DeepSeek-R1', 'DeepSeek-R1', 'DeepSeek 第一代推理优化模型，专注于逻辑推理和数学问题', 'R1', 1, 1),
('DeepSeek-V3', 'DeepSeek-V3', 'DeepSeek 第三代基础模型，平衡性能与效率', 'V3.0', 2, 1),
('DeepSeek-V3.1', 'DeepSeek-V3.1', 'DeepSeek V3 改进版，提升了中文理解能力', 'V3.1', 3, 1),
('DeepSeek-V3.2', 'DeepSeek-V3.2', 'DeepSeek V3 最新版本，优化了长文本处理', 'V3.2', 4, 1);

-- 验证数据插入
SELECT * FROM base_models;
