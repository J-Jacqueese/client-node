-- 热门话题配置表
-- 在 Navicat 中运行此 SQL 创建表

CREATE TABLE IF NOT EXISTS hot_topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL COMMENT '话题标题',
    href VARCHAR(1000) DEFAULT NULL COMMENT '话题链接（可选，不填则自动生成搜索链接）',
    category VARCHAR(100) DEFAULT NULL COMMENT '分类名称',
    category_color VARCHAR(50) DEFAULT 'text-slate-600' COMMENT '分类颜色（Tailwind 类名）',
    replies INT DEFAULT 0 COMMENT '回复数',
    views INT DEFAULT 0 COMMENT '浏览数',
    time_text VARCHAR(50) DEFAULT '刚刚' COMMENT '时间显示文本',
    is_hot BOOLEAN DEFAULT FALSE COMMENT '是否热门（显示HOT标签）',
    sort_order INT DEFAULT 0 COMMENT '排序权重（数字越大越靠前）',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort (sort_order DESC),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页热门话题配置';

-- 插入示例数据
INSERT INTO hot_topics (title, href, category, category_color, replies, views, time_text, is_hot, sort_order) VALUES
('DeepSeek V4 与姚顺雨混元新模型同台发布', NULL, '行业动态与观点', 'text-orange-600', 5, 85, '41 分钟前', TRUE, 100),
('OpenClaw 省钱神器！MemOS 插件让 token 消耗暴跌 72%', NULL, 'OpenClaw专区', 'text-rose-600', 9, 665, '4 分钟前', TRUE, 99),
('手把手教你调用 DeepSeek-OCR：轻量高精度实战', NULL, '大模型微调', 'text-sky-600', 10, 460, '42 分钟前', FALSE, 98),
('融资 8000 万美元!Video Rebirth 领跑 AI视频', 'https://discuss.deepseek.club/t/topic/1094', 'AI应用案例', 'text-amber-600', 0, 0, '刚刚', TRUE, 97),
('一年跌下神坛！DeepSeek 从国产大模型顶流掉队，困局何解？', 'https://discuss.deepseek.club/t/topic/1059', '行业动态与观点', 'text-orange-600', 0, 0, '刚刚', FALSE, 96),
('新手也能学会的，手把手教你电脑部署DeepSeek', 'https://discuss.deepseek.club/t/topic/374', '新手入门(Q&A)', 'text-emerald-600', 0, 0, '刚刚', FALSE, 95);
