const db = require('../config/database');

// 获取所有基座模型
exports.getAllBaseModels = async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let sql = 'SELECT * FROM base_models';
    const params = [];
    
    if (active_only === 'true') {
      sql += ' WHERE is_active = 1';
    }
    
    sql += ' ORDER BY sort_order ASC, created_at DESC';
    
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching base models:', error);
    res.status(500).json({ success: false, message: '获取基座模型列表失败' });
  }
};

// 获取单个基座模型
exports.getBaseModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM base_models WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '基座模型不存在' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching base model:', error);
    res.status(500).json({ success: false, message: '获取基座模型失败' });
  }
};

// 创建基座模型
exports.createBaseModel = async (req, res) => {
  try {
    const { name, display_name, description, version, sort_order, is_active } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({ success: false, message: '名称和显示名称为必填项' });
    }
    
    const sql = `
      INSERT INTO base_models (name, display_name, description, version, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      name,
      display_name,
      description || null,
      version || null,
      sort_order || 0,
      is_active !== undefined ? is_active : 1
    ]);
    
    res.json({ success: true, message: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creating base model:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '基座模型名称已存在' });
    }
    res.status(500).json({ success: false, message: '创建基座模型失败' });
  }
};

// 更新基座模型
exports.updateBaseModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, description, version, sort_order, is_active } = req.body;
    
    if (!name || !display_name) {
      return res.status(400).json({ success: false, message: '名称和显示名称为必填项' });
    }
    
    const sql = `
      UPDATE base_models
      SET name = ?, display_name = ?, description = ?, version = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `;
    
    await db.query(sql, [
      name,
      display_name,
      description || null,
      version || null,
      sort_order || 0,
      is_active !== undefined ? is_active : 1,
      id
    ]);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating base model:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '基座模型名称已存在' });
    }
    res.status(500).json({ success: false, message: '更新基座模型失败' });
  }
};

// 删除基座模型
exports.deleteBaseModel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有模型正在使用这个基座
    const [models] = await db.query(
      'SELECT COUNT(*) as count FROM models WHERE base_model = (SELECT name FROM base_models WHERE id = ?)',
      [id]
    );
    
    if (models[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `该基座模型正在被 ${models[0].count} 个模型使用，无法删除` 
      });
    }
    
    await db.query('DELETE FROM base_models WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting base model:', error);
    res.status(500).json({ success: false, message: '删除基座模型失败' });
  }
};

// 切换启用状态
exports.toggleBaseModelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE base_models SET is_active = NOT is_active WHERE id = ?',
      [id]
    );
    
    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('Error toggling base model status:', error);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
};
