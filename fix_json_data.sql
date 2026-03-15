-- 修复模型表中的 JSON 数据
USE deepseek_club;

-- 更新第一个模型的 JSON 数据
UPDATE models 
SET 
  download_links = '[{"type":"HuggingFace","url":"https://huggingface.co/example"},{"type":"网盘下载","url":"#"}]',
  files = '[{"name":"lawyer_r1_32b_q4.gguf","size":"18.2 GB"}]'
WHERE id = 1;

-- 更新第二个模型的 JSON 数据
UPDATE models 
SET 
  download_links = '[{"type":"HuggingFace","url":"https://huggingface.co/example"}]',
  files = '[{"name":"coder_v3_q4.gguf","size":"256 GB"}]'
WHERE id = 2;

-- 验证更新
SELECT id, name, download_links, files FROM models;
