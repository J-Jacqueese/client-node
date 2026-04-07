const db = require('../config/database');

// 获取热门话题列表（前台用）
exports.getHotTopics = async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit) || 6;
    
    const sql = `
      SELECT 
        id, title, href, category, category_color, 
        replies, views, time_text, is_hot, sort_order
      FROM hot_topics 
      WHERE is_active = TRUE 
      ORDER BY sort_order DESC, id ASC 
      LIMIT ?
    `;
    
    const [rows] = await db.query(sql, [limitNum]);
    
    // 转换字段名以匹配前端格式
    const topics = rows.map(row => ({
      id: row.id,
      title: row.title,
      href: row.href,
      category: row.category,
      categoryColor: row.category_color,
      replies: row.replies,
      views: row.views,
      time: row.time_text,
      hot: Boolean(row.is_hot),
      sortOrder: row.sort_order
    }));
    
    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error fetching hot topics:', error);
    res.status(500).json({ success: false, message: '获取热门话题失败' });
  }
};

// 获取所有热门话题（后台管理用）
exports.getAllHotTopics = async (req, res) => {
  try {
    const { search, is_active } = req.query;
    
    let sql = 'SELECT * FROM hot_topics WHERE 1=1';
    const params = [];
    
    if (search) {
      sql += ' AND (title LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (is_active !== undefined && is_active !== '') {
      sql += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1');
    }
    
    sql += ' ORDER BY sort_order DESC, id ASC';
    
    const [rows] = await db.query(sql, params);
    
    const topics = rows.map(row => ({
      id: row.id,
      title: row.title,
      href: row.href,
      category: row.category,
      categoryColor: row.category_color,
      replies: row.replies,
      views: row.views,
      timeText: row.time_text,
      isHot: Boolean(row.is_hot),
      sortOrder: row.sort_order,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error fetching all hot topics:', error);
    res.status(500).json({ success: false, message: '获取热门话题列表失败' });
  }
};

// 获取单个热门话题
exports.getHotTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM hot_topics WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '话题不存在' });
    }
    
    const row = rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        href: row.href,
        category: row.category,
        categoryColor: row.category_color,
        replies: row.replies,
        views: row.views,
        timeText: row.time_text,
        isHot: Boolean(row.is_hot),
        sortOrder: row.sort_order,
        isActive: Boolean(row.is_active)
      }
    });
  } catch (error) {
    console.error('Error fetching hot topic:', error);
    res.status(500).json({ success: false, message: '获取话题详情失败' });
  }
};

// 创建热门话题
exports.createHotTopic = async (req, res) => {
  try {
    const { title, href, category, categoryColor, replies, views, timeText, isHot, sortOrder, isActive } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: '话题标题不能为空' });
    }
    
    const sql = `
      INSERT INTO hot_topics (title, href, category, category_color, replies, views, time_text, is_hot, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      title.trim(),
      href || null,
      category || null,
      categoryColor || 'text-slate-600',
      replies || 0,
      views || 0,
      timeText || '刚刚',
      isHot ? 1 : 0,
      sortOrder || 0,
      isActive !== false ? 1 : 0
    ]);
    
    res.json({ success: true, message: '创建成功', id: result.insertId });
  } catch (error) {
    console.error('Error creating hot topic:', error);
    res.status(500).json({ success: false, message: '创建热门话题失败' });
  }
};

// 更新热门话题
exports.updateHotTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, href, category, categoryColor, replies, views, timeText, isHot, sortOrder, isActive } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: '话题标题不能为空' });
    }
    
    const sql = `
      UPDATE hot_topics 
      SET title = ?, href = ?, category = ?, category_color = ?, 
          replies = ?, views = ?, time_text = ?, is_hot = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `;
    
    await db.query(sql, [
      title.trim(),
      href || null,
      category || null,
      categoryColor || 'text-slate-600',
      replies || 0,
      views || 0,
      timeText || '刚刚',
      isHot ? 1 : 0,
      sortOrder || 0,
      isActive !== false ? 1 : 0,
      id
    ]);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating hot topic:', error);
    res.status(500).json({ success: false, message: '更新热门话题失败' });
  }
};

// 删除热门话题
exports.deleteHotTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM hot_topics WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting hot topic:', error);
    res.status(500).json({ success: false, message: '删除热门话题失败' });
  }
};

// 批量更新排序
exports.batchUpdateSortOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ id: 1, sortOrder: 100 }, ...]
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '无效的排序数据' });
    }
    
    const promises = items.map(item => 
      db.query('UPDATE hot_topics SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id])
    );
    
    await Promise.all(promises);
    res.json({ success: true, message: '排序更新成功' });
  } catch (error) {
    console.error('Error batch updating sort order:', error);
    res.status(500).json({ success: false, message: '批量更新排序失败' });
  }
};
