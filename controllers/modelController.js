const db = require('../config/database');

// 获取所有模型
exports.getAllModels = async (req, res) => {
  try {
    const { category, sort = 'latest', search, base_models, tags } = req.query;
    
    let sql = `
      SELECT m.*, c.name as category_name,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM models m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN model_tags mt ON m.id = mt.model_id
      LEFT JOIN tags t ON mt.tag_id = t.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category && category !== '0') {
      conditions.push('m.category_id = ?');
      params.push(category);
    }
    
    if (search) {
      conditions.push('m.name LIKE ?');
      params.push(`%${search}%`);
    }
    
    // 基座模型筛选（多选，OR逻辑）
    if (base_models) {
      const baseModelArray = Array.isArray(base_models) ? base_models : [base_models];
      if (baseModelArray.length > 0) {
        const placeholders = baseModelArray.map(() => '?').join(',');
        conditions.push(`m.base_model IN (${placeholders})`);
        params.push(...baseModelArray);
      }
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY m.id';
    
    // 标签筛选（多选，AND逻辑）
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      const tagConditions = tagArray.map(() => 'FIND_IN_SET(?, GROUP_CONCAT(DISTINCT t.name))').join(' AND ');
      if (tagConditions) {
        sql += ` HAVING ${tagConditions}`;
        params.push(...tagArray);
      }
    }
    
    // 排序
    switch (sort) {
      case 'downloads':
        sql += ' ORDER BY m.downloads DESC';
        break;
      case 'likes':
        sql += ' ORDER BY m.likes DESC';
        break;
      default:
        sql += ' ORDER BY m.created_at DESC';
    }
    
    const [rows] = await db.query(sql, params);
    
    // 解析 JSON 字段
    const models = rows.map(row => {
      let downloadLinks = [];
      let files = [];
      
      // 处理 download_links
      if (row.download_links) {
        try {
          // 如果是字符串，尝试解析
          if (typeof row.download_links === 'string') {
            downloadLinks = JSON.parse(row.download_links);
          } else if (Array.isArray(row.download_links)) {
            // 如果已经是数组，直接使用
            downloadLinks = row.download_links;
          }
        } catch (e) {
          console.error('Error parsing download_links:', e, row.download_links);
          downloadLinks = [];
        }
      }
      
      // 处理 files
      if (row.files) {
        try {
          if (typeof row.files === 'string') {
            files = JSON.parse(row.files);
          } else if (Array.isArray(row.files)) {
            files = row.files;
          }
        } catch (e) {
          console.error('Error parsing files:', e, row.files);
          files = [];
        }
      }
      
      return {
        ...row,
        download_links: downloadLinks,
        files: files,
        tags: row.tags ? row.tags.split(',') : []
      };
    });
    
    res.json({ success: true, data: models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ success: false, message: '获取模型列表失败' });
  }
};

// 获取单个模型详情
exports.getModelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT m.*, c.name as category_name,
        GROUP_CONCAT(t.name) as tags
      FROM models m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN model_tags mt ON m.id = mt.model_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE m.id = ?
      GROUP BY m.id
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '模型不存在' });
    }
    
    let downloadLinks = [];
    let files = [];
    
    // 处理 download_links
    if (rows[0].download_links) {
      try {
        if (typeof rows[0].download_links === 'string') {
          downloadLinks = JSON.parse(rows[0].download_links);
        } else if (Array.isArray(rows[0].download_links)) {
          downloadLinks = rows[0].download_links;
        }
      } catch (e) {
        console.error('Error parsing download_links:', e);
        downloadLinks = [];
      }
    }
    
    // 处理 files
    if (rows[0].files) {
      try {
        if (typeof rows[0].files === 'string') {
          files = JSON.parse(rows[0].files);
        } else if (Array.isArray(rows[0].files)) {
          files = rows[0].files;
        }
      } catch (e) {
        console.error('Error parsing files:', e);
        files = [];
      }
    }
    
    const model = {
      ...rows[0],
      download_links: downloadLinks,
      files: files,
      tags: rows[0].tags ? rows[0].tags.split(',') : []
    };
    
    // 增加浏览量
    await db.query('UPDATE models SET views = views + 1 WHERE id = ?', [id]);
    
    res.json({ success: true, data: model });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ success: false, message: '获取模型详情失败' });
  }
};

// 创建模型
exports.createModel = async (req, res) => {
  try {
    const {
      name, author, avatar, version, base_model, category_id,
      description, readme, prompt_example, comparison, model_type,
      download_links, files, tags, likes, downloads, stars
    } = req.body;

    const normalizedLikes = Number.isFinite(Number(likes)) ? Number(likes) : 0;
    const normalizedDownloads = Number.isFinite(Number(downloads)) ? Number(downloads) : 0;
    const normalizedStars = Number.isFinite(Number(stars)) ? Number(stars) : 0;
    
    const sql = `
      INSERT INTO models (
        name, author, avatar, version, base_model, category_id,
        description, readme, prompt_example, comparison, model_type,
        download_links, files, likes, downloads, stars
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      name, author, avatar || null, version || null, base_model || null,
      category_id || null, description || null, readme || null,
      prompt_example || null, comparison || null, model_type || null,
      JSON.stringify(download_links || []),
      JSON.stringify(files || []),
      normalizedLikes,
      normalizedDownloads,
      normalizedStars
    ]);
    
    const modelId = result.insertId;
    
    // 插入标签关联
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [modelId, tagId]);
      await db.query('INSERT INTO model_tags (model_id, tag_id) VALUES ?', [tagValues]);
    }
    
    res.json({ success: true, message: '创建成功', id: modelId });
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ success: false, message: '创建模型失败' });
  }
};

// 更新模型
exports.updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, author, avatar, version, base_model, category_id,
      description, readme, prompt_example, comparison, model_type,
      download_links, files, tags, likes, downloads, stars
    } = req.body;

    const normalizedLikes = Number.isFinite(Number(likes)) ? Number(likes) : 0;
    const normalizedDownloads = Number.isFinite(Number(downloads)) ? Number(downloads) : 0;
    const normalizedStars = Number.isFinite(Number(stars)) ? Number(stars) : 0;
    
    const sql = `
      UPDATE models SET
        name = ?, author = ?, avatar = ?, version = ?, base_model = ?,
        category_id = ?, description = ?, readme = ?, prompt_example = ?,
        comparison = ?, model_type = ?, download_links = ?, files = ?,
        likes = ?, downloads = ?, stars = ?
      WHERE id = ?
    `;
    
    await db.query(sql, [
      name, author, avatar || null, version || null, base_model || null,
      category_id || null, description || null, readme || null,
      prompt_example || null, comparison || null, model_type || null,
      JSON.stringify(download_links || []),
      JSON.stringify(files || []),
      normalizedLikes,
      normalizedDownloads,
      normalizedStars,
      id
    ]);
    
    // 更新标签关联
    await db.query('DELETE FROM model_tags WHERE model_id = ?', [id]);
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [id, tagId]);
      await db.query('INSERT INTO model_tags (model_id, tag_id) VALUES ?', [tagValues]);
    }
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ success: false, message: '更新模型失败' });
  }
};

// 删除模型
exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM models WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ success: false, message: '删除模型失败' });
  }
};

// 点赞模型
exports.likeModel = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE models SET likes = likes + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('Error liking model:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
};

// 增加下载量
exports.downloadModel = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE models SET downloads = downloads + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '下载统计成功' });
  } catch (error) {
    console.error('Error downloading model:', error);
    res.status(500).json({ success: false, message: '下载统计失败' });
  }
};
