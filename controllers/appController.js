const db = require('../config/database');

// 获取所有应用
exports.getAllApps = async (req, res) => {
  try {
    const { category, sort = 'latest', search } = req.query;
    
    let sql = `
      SELECT a.*, c.name as category_name,
        GROUP_CONCAT(t.name) as tags
      FROM apps a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN app_tags at ON a.id = at.app_id
      LEFT JOIN tags t ON at.tag_id = t.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category && category !== '0') {
      conditions.push('a.category_id = ?');
      params.push(category);
    }
    
    if (search) {
      conditions.push('a.name LIKE ?');
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY a.id';
    
    // 排序
    switch (sort) {
      case 'views':
        sql += ' ORDER BY a.views DESC';
        break;
      case 'upvotes':
        sql += ' ORDER BY a.upvotes DESC';
        break;
      case 'latest':
        sql += ' ORDER BY a.created_at DESC';
        break;
      default:
        sql += ' ORDER BY a.created_at DESC';
    }
    
    const [rows] = await db.query(sql, params);
    
    const apps = rows.map((row) => {
      let downloadLinks = [];
      if (row.download_links) {
        try {
          if (typeof row.download_links === 'string') {
            downloadLinks = JSON.parse(row.download_links);
          } else if (Array.isArray(row.download_links)) {
            downloadLinks = row.download_links;
          }
        } catch (e) {
          console.error('Error parsing app download_links:', e, row.download_links);
        }
      }

      return {
        ...row,
        tags: row.tags ? row.tags.split(',') : [],
        download_links: Array.isArray(downloadLinks) ? downloadLinks : [],
      };
    });
    
    res.json({ success: true, data: apps });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ success: false, message: '获取应用列表失败' });
  }
};

// 获取单个应用详情
exports.getAppById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT a.*, c.name as category_name,
        GROUP_CONCAT(t.name) as tags
      FROM apps a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN app_tags at ON a.id = at.app_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = ?
      GROUP BY a.id
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '应用不存在' });
    }
    
    let downloadLinks = [];
    if (rows[0].download_links) {
      try {
        if (typeof rows[0].download_links === 'string') {
          downloadLinks = JSON.parse(rows[0].download_links);
        } else if (Array.isArray(rows[0].download_links)) {
          downloadLinks = rows[0].download_links;
        }
      } catch (e) {
        console.error('Error parsing app download_links:', e, rows[0].download_links);
      }
    }

    const app = {
      ...rows[0],
      tags: rows[0].tags ? rows[0].tags.split(',') : [],
      download_links: Array.isArray(downloadLinks) ? downloadLinks : [],
    };
    
    // 增加浏览量
    await db.query('UPDATE apps SET views = views + 1 WHERE id = ?', [id]);
    
    res.json({ success: true, data: app });
  } catch (error) {
    console.error('Error fetching app:', error);
    res.status(500).json({ success: false, message: '获取应用详情失败' });
  }
};

// 创建应用
exports.createApp = async (req, res) => {
  try {
    const {
      name, developer, avatar, icon_bg, category_id,
      description, detail, version, base_model,
      website_url, comparison, tags, upvotes, downloads, stars, download_links
    } = req.body;

    const normalizedUpvotes = Number.isFinite(Number(upvotes)) ? Number(upvotes) : 0;
    const normalizedDownloads = Number.isFinite(Number(downloads)) ? Number(downloads) : 0;
    const normalizedStars = Number.isFinite(Number(stars)) ? Number(stars) : 0;
    const normalizedCategoryId = category_id ? Number(category_id) : null;

    if (normalizedCategoryId) {
      const [categoryRows] = await db.query(
        'SELECT id FROM categories WHERE id = ? LIMIT 1',
        [normalizedCategoryId]
      );
      if (categoryRows.length === 0) {
        return res.status(400).json({ success: false, message: '分类不存在' });
      }
    }
    
    const sql = `
      INSERT INTO apps (
        name, developer, avatar, icon_bg, category_id,
        description, detail, version, base_model,
        website_url, comparison, upvotes, downloads, stars, download_links
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      name, developer, avatar || null, icon_bg || null,
      normalizedCategoryId, description || null, detail || null,
      version || null, base_model || null, website_url || null,
      comparison || null, normalizedUpvotes, normalizedDownloads, normalizedStars, JSON.stringify(download_links || [])
    ]);
    
    const appId = result.insertId;
    
    // 插入标签关联
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [appId, tagId]);
      await db.query('INSERT INTO app_tags (app_id, tag_id) VALUES ?', [tagValues]);
    }
    
    res.json({ success: true, message: '创建成功', id: appId });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({ success: false, message: '创建应用失败' });
  }
};

// 更新应用
exports.updateApp = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, developer, avatar, icon_bg, category_id,
      description, detail, version, base_model,
      website_url, comparison, tags, upvotes, downloads, stars, download_links
    } = req.body;

    const normalizedUpvotes = Number.isFinite(Number(upvotes)) ? Number(upvotes) : 0;
    const normalizedDownloads = Number.isFinite(Number(downloads)) ? Number(downloads) : 0;
    const normalizedStars = Number.isFinite(Number(stars)) ? Number(stars) : 0;
    const normalizedCategoryId = category_id ? Number(category_id) : null;

    if (normalizedCategoryId) {
      const [categoryRows] = await db.query(
        'SELECT id FROM categories WHERE id = ? LIMIT 1',
        [normalizedCategoryId]
      );
      if (categoryRows.length === 0) {
        return res.status(400).json({ success: false, message: '分类不存在' });
      }
    }
    
    const sql = `
      UPDATE apps SET
        name = ?, developer = ?, avatar = ?, icon_bg = ?,
        category_id = ?, description = ?, detail = ?,
        version = ?, base_model = ?, website_url = ?,
        comparison = ?, upvotes = ?, downloads = ?, stars = ?, download_links = ?
      WHERE id = ?
    `;
    
    const [updateResult] = await db.query(sql, [
      name, developer, avatar || null, icon_bg || null,
      normalizedCategoryId, description || null, detail || null,
      version || null, base_model || null, website_url || null,
      comparison || null, normalizedUpvotes, normalizedDownloads, normalizedStars, JSON.stringify(download_links || []), id
    ]);

    if (!updateResult.affectedRows) {
      return res.status(404).json({ success: false, message: '应用不存在或未更新' });
    }
    
    // 更新标签关联
    await db.query('DELETE FROM app_tags WHERE app_id = ?', [id]);
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => [id, tagId]);
      await db.query('INSERT INTO app_tags (app_id, tag_id) VALUES ?', [tagValues]);
    }
    
    const [updatedRows] = await db.query('SELECT id, upvotes FROM apps WHERE id = ?', [id]);
    res.json({
      success: true,
      message: '更新成功',
      data: updatedRows[0] || { id: Number(id), upvotes: normalizedUpvotes },
    });
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({ success: false, message: '更新应用失败' });
  }
};

// 删除应用
exports.deleteApp = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM apps WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({ success: false, message: '删除应用失败' });
  }
};

// 点赞应用
exports.upvoteApp = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE apps SET upvotes = upvotes + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('Error upvoting app:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
};
