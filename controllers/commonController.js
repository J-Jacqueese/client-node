const db = require('../config/database');

// 获取分类列表
exports.getAllCategories = async (req, res) => {
  try {
    const { type, search } = req.query;
    
    let sql = 'SELECT * FROM categories';
    const params = [];
    
    const conditions = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (search) {
      conditions.push('name LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ' ORDER BY sort_order ASC, id ASC';
    
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
};

// 获取标签列表
exports.getAllTags = async (req, res) => {
  try {
    const { search } = req.query;
    const params = [];
    let sql = 'SELECT * FROM tags';

    if (search) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, message: '获取标签失败' });
  }
};

// 获取统计数据
exports.getStats = async (req, res) => {
  try {
    const [models] = await db.query('SELECT COUNT(*) as count, SUM(downloads) as total_downloads, SUM(likes) as total_likes FROM models');
    const [apps] = await db.query('SELECT COUNT(*) as count, SUM(upvotes) as total_upvotes FROM apps');
    const [categories] = await db.query('SELECT COUNT(*) as count FROM categories');
    const [tags] = await db.query('SELECT COUNT(*) as count FROM tags');

    const [events] = await db.query("SELECT COUNT(*) as count, SUM(current_participants) as total_current_participants FROM events");
    const [projects] = await db.query('SELECT COUNT(*) as count, SUM(stars) as total_stars FROM projects');
    
    res.json({
      success: true,
      data: {
        models: {
          count: models[0].count,
          totalDownloads: models[0].total_downloads || 0,
          totalLikes: models[0].total_likes || 0
        },
        apps: {
          count: apps[0].count,
          totalUpvotes: apps[0].total_upvotes || 0
        },
        events: {
          count: events[0].count,
          totalCurrentParticipants: events[0].total_current_participants || 0,
        },
        projects: {
          count: projects[0].count,
          totalStars: projects[0].total_stars || 0,
        },
        categories: categories[0].count,
        tags: tags[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
};

// 简单查询某个表的数据（调试用）
exports.getSampleModels = async (req, res) => {
  try {
    // 随便查 models 表前 5 条数据
    const [rows] = await db.query(
      'SELECT id, name, author, base_model, likes, downloads FROM models ORDER BY id ASC LIMIT 5'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching sample models:', error);
    res.status(500).json({ success: false, message: '查询示例模型数据失败' });
  }
};

// 创建分类
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, type, sort_order } = req.body;
    const normalizedName = (name || '').trim();
    const normalizedType = (type || '').trim();

    if (!normalizedName) {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    if (!['model', 'app'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: '分类类型不合法' });
    }

    const [existsRows] = await db.query(
      'SELECT id FROM categories WHERE type = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [normalizedType, normalizedName]
    );

    if (existsRows.length > 0) {
      return res.status(400).json({ success: false, message: '该类型下已存在同名分类' });
    }

    const sql = 'INSERT INTO categories (name, icon, type, sort_order) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [normalizedName, icon || null, normalizedType, sort_order || 0]);
    res.json({ success: true, message: '创建成功', id: result.insertId });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: '创建分类失败' });
  }
};

// 更新分类
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, type, sort_order } = req.body;
    const normalizedName = (name || '').trim();
    const normalizedType = (type || '').trim();

    if (!normalizedName) {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    if (!['model', 'app'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: '分类类型不合法' });
    }

    const [existsRows] = await db.query(
      'SELECT id FROM categories WHERE type = ? AND LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
      [normalizedType, normalizedName, id]
    );

    if (existsRows.length > 0) {
      return res.status(400).json({ success: false, message: '该类型下已存在同名分类' });
    }

    const sql = 'UPDATE categories SET name = ?, icon = ?, type = ?, sort_order = ? WHERE id = ?';
    await db.query(sql, [normalizedName, icon || null, normalizedType, sort_order || 0, id]);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
};

// 删除分类
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
};

// 创建标签
exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    const sql = 'INSERT INTO tags (name, color) VALUES (?, ?)';
    const [result] = await db.query(sql, [name, color || null]);
    res.json({ success: true, message: '创建成功', id: result.insertId });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ success: false, message: '创建标签失败' });
  }
};

// 删除标签
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tags WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: '删除标签失败' });
  }
};
