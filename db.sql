-- DeepSeek Club 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS deepseek_club DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE deepseek_club;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  icon VARCHAR(50) COMMENT '图标名称',
  type ENUM('model', 'app') NOT NULL COMMENT '分类类型',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '标签名称',
  color VARCHAR(20) COMMENT '颜色',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

-- 基座模型表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基座模型表';

-- 模型表
CREATE TABLE IF NOT EXISTS models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '模型名称',
  author VARCHAR(100) NOT NULL COMMENT '作者',
  avatar VARCHAR(255) COMMENT '作者头像',
  version VARCHAR(50) COMMENT '版本号',
  base_model VARCHAR(100) COMMENT '基座模型（如 R1-32B）',
  category_id INT COMMENT '分类ID',
  description TEXT COMMENT '模型描述',
  readme TEXT COMMENT '详细介绍（Markdown）',
  prompt_example TEXT COMMENT '推荐Prompt示例',
  comparison TEXT COMMENT '效果对标说明',
  model_type ENUM('hot', 'latest', 'recommended', 'official') DEFAULT NULL COMMENT '模型类型标签',
  likes INT DEFAULT 0 COMMENT '点赞数',
  downloads INT DEFAULT 0 COMMENT '下载量',
  views INT DEFAULT 0 COMMENT '浏览量',
  download_links JSON COMMENT '下载链接（JSON格式）',
  files JSON COMMENT '模型文件列表（JSON格式）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_created (created_at),
  INDEX idx_likes (likes),
  INDEX idx_downloads (downloads)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型表';

-- 模型标签关联表
CREATE TABLE IF NOT EXISTS model_tags (
  model_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (model_id, tag_id),
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型标签关联';

-- AI应用表
CREATE TABLE IF NOT EXISTS apps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '应用名称',
  developer VARCHAR(100) NOT NULL COMMENT '开发者',
  avatar VARCHAR(255) COMMENT '应用图标',
  icon_bg VARCHAR(50) COMMENT '图标背景色',
  category_id INT COMMENT '分类ID',
  description TEXT COMMENT '简短描述',
  detail TEXT COMMENT '详细介绍',
  version VARCHAR(50) COMMENT '版本号',
  base_model VARCHAR(100) COMMENT '基于的模型',
  website_url VARCHAR(255) COMMENT '官网链接',
  download_links JSON COMMENT '下载链接（JSON格式）',
  comparison TEXT COMMENT '效果对比说明',
  upvotes INT DEFAULT 0 COMMENT '点赞数',
  views INT DEFAULT 0 COMMENT '浏览量',
  rank_position INT COMMENT '榜单排名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_upvotes (upvotes),
  INDEX idx_rank (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI应用表';

-- 应用标签关联表
CREATE TABLE IF NOT EXISTS app_tags (
  app_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (app_id, tag_id),
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用标签关联';

-- 评论表（可选，预留）
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  target_type ENUM('model', 'app') NOT NULL,
  target_id INT NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- 插入初始分类数据
-- 模型分类
INSERT INTO categories (name, icon, type, sort_order) VALUES
('通用', 'layout', 'model', 1),
('法律', 'scale', 'model', 2),
('医疗', 'stethoscope', 'model', 3),
('金融', 'landmark', 'model', 4),
('编程', 'code', 'model', 5);

-- 应用分类
INSERT INTO categories (name, icon, type, sort_order) VALUES
('通用', 'layout', 'app', 1),
('法律', 'shield-check', 'app', 2),
('医疗', 'heart-pulse', 'app', 3),
('金融', 'trending-up', 'app', 4),
('编程', 'code-2', 'app', 5);

-- 插入初始标签数据
INSERT INTO tags (name, color) VALUES
('GGUF', 'gray'),
('LoRA', 'gray'),
('128K Context', 'gray'),
('RolePlay', 'gray'),
('通用', 'blue'),
('创意写作', 'purple'),
('翻译', 'green'),
('角色扮演', 'pink');

-- 插入基座模型数据
INSERT INTO base_models (name, display_name, description, version, sort_order, is_active) VALUES
('DeepSeek-R1', 'DeepSeek-R1', 'DeepSeek 第一代推理优化模型，专注于逻辑推理和数学问题', 'R1', 1, 1),
('DeepSeek-V3', 'DeepSeek-V3', 'DeepSeek 第三代基础模型，平衡性能与效率', 'V3.0', 2, 1),
('DeepSeek-V3.1', 'DeepSeek-V3.1', 'DeepSeek V3 改进版，提升了中文理解能力', 'V3.1', 3, 1),
('DeepSeek-V3.2', 'DeepSeek-V3.2', 'DeepSeek V3 最新版本，优化了长文本处理', 'V3.2', 4, 1);

-- 插入示例模型数据
INSERT INTO models (name, author, avatar, version, base_model, category_id, description, readme, prompt_example, comparison, likes, downloads, views, download_links, files) VALUES
(
  'DeepSeek-R1-Lawyer-China',
  'LawGPT_Team',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Law',
  'v1.0.4',
  'DeepSeek-R1',
  2,
  '基于民法典深度微调的法律咨询专家模型',
  '## 模型描述\n\n解决了法律行业原生模型在处理《民法典》复杂条款时逻辑混乱的痛点。通过对 5 万份真实判例的 DPO 微调，该模型在起草法律文书和风险评估时表现卓越。\n\n## 特性\n\n- ✅ 精准引用法律条款\n- ✅ 风险评估准确\n- ✅ 支持合同审核',
  'system_prompt: "你是一名资深法官，请根据以下案情给出法律合规建议。"\ninput: "在此不可抗力情形下，合同是否可以单方面解除？"',
  '原生模型表述笼统，本模型能精准引用《民法典》第563条并进行分析',
  452,
  1200,
  3500,
  '[{"type":"HuggingFace","url":"https://huggingface.co/deepseek/lawyer-r1"},{"type":"百度网盘","url":"https://pan.baidu.com/s/example"}]',
  '[{"name":"lawyer_r1_32b_q4.gguf","size":"18.2 GB"}]'
),
(
  'DeepSeek-V3-Coder-Expert',
  'Dev_OpenAI',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Code',
  'v2.1.0',
  'DeepSeek-V3',
  5,
  '专为编程开发优化的代码生成专家模型',
  '## 模型描述\n\n针对编程场景深度优化，支持多种编程语言的代码生成、重构和调试。\n\n## 支持语言\n\n- Python\n- JavaScript/TypeScript\n- Java\n- Go\n- Rust',
  'input: "编写一个React组件，实现文件上传功能"',
  '相比原生模型，代码质量提升40%，bug率降低60%',
  891,
  4500,
  8900,
  '[{"type":"HuggingFace","url":"https://huggingface.co/deepseek/coder-v3"},{"type":"GitHub","url":"https://github.com/deepseek/coder"}]',
  '[{"name":"coder_v3_q4.gguf","size":"256 GB"}]'
);

-- 插入模型标签关联
INSERT INTO model_tags (model_id, tag_id) VALUES
(1, 1), (1, 3), (1, 5),
(2, 1), (2, 3), (2, 5);

-- 插入示例应用数据
INSERT INTO apps (name, developer, avatar, icon_bg, category_id, description, detail, version, base_model, website_url, comparison, upvotes, views, rank_position) VALUES
(
  'DeepLegal 智能法务',
  'LawTech_Lab',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Legal',
  'from-blue-500 to-indigo-600',
  7,
  '为中小企业提供 24/7 的即时合同审核与法律风险预警服务。',
  '## 产品核心价值\n\nDeepLegal 是一款面向中小微企业的自动化法律合规平台。我们发现传统法律咨询成本高、反馈慢，企业往往在签署合同时面临巨大的合规风险。\n\n### 核心功能\n\n- **合同秒审**: 自动识别合同中的不平等条款、违约金条款及免责声明\n- **行业特调**: 针对建筑、电商、咨询等 20+ 个细分行业进行了逻辑增强',
  'V2.4.0',
  'DeepSeek-R1',
  'https://legal-ai.club',
  '通用AI无法识别法律陷阱，DeepLegal能精准打击风险点',
  482,
  5600,
  1
),
(
  'CoderFlow',
  'DevHero',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
  'from-slate-700 to-slate-900',
  10,
  '自动将自然语言需求转化为高质量的架构设计图与样板代码。',
  '## 产品介绍\n\nCoderFlow 帮助开发者快速将需求转化为代码，提升开发效率。\n\n### 功能特性\n\n- 需求分析\n- 架构设计\n- 代码生成\n- 代码审查',
  'V1.2.0',
  'DeepSeek-V3',
  'https://coderflow.dev',
  '提升开发效率3倍',
  215,
  2800,
  2
);

-- 插入应用标签关联
INSERT INTO app_tags (app_id, tag_id) VALUES
(1, 5),
(2, 5);

-- 显示统计信息
SELECT 'Database created successfully!' AS status;
SELECT COUNT(*) AS categories_count FROM categories;
SELECT COUNT(*) AS tags_count FROM tags;
SELECT COUNT(*) AS models_count FROM models;
SELECT COUNT(*) AS apps_count FROM apps;
