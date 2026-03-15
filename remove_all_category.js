const db = require('./config/database');

async function removeAllCategory() {
  try {
    console.log('🔧 正在移除"全部行业"分类...\n');
    
    // 删除"全部行业"分类（ID为1）
    const [result] = await db.query(`DELETE FROM categories WHERE id = 1 AND name = '全部行业'`);
    
    if (result.affectedRows > 0) {
      console.log('✅ 成功删除"全部行业"分类');
    } else {
      console.log('⚠️  未找到"全部行业"分类');
    }
    
    // 显示剩余的分类
    const [categories] = await db.query('SELECT * FROM categories WHERE type = "model" ORDER BY sort_order');
    console.log('\n📊 当前模型分类：');
    categories.forEach(cat => {
      console.log(`  ID: ${cat.id} | 名称: ${cat.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 操作失败:', error);
    process.exit(1);
  }
}

removeAllCategory();
