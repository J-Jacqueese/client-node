-- 为 models 表新增模型类型标签字段（热门/最新/推荐/官方）
ALTER TABLE models
ADD COLUMN IF NOT EXISTS model_type ENUM('hot', 'latest', 'recommended', 'official')
DEFAULT NULL
COMMENT '模型类型标签';
