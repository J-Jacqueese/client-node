const db = require('./config/database');

async function checkCategories() {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY type, sort_order');
    
    console.log('📊 当前分类数据：\n');
    console.log('模型分类 (type=model):');
    categories.filter(c => c.type === 'model').forEach(cat => {
      console.log(`  ID: ${cat.id} | 名称: ${cat.name} | 图标: ${cat.icon}`);
    });
    
    console.log('\n应用分类 (type=app):');
    categories.filter(c => c.type === 'app').forEach(cat => {
      console.log(`  ID: ${cat.id} | 名称: ${cat.name} | 图标: ${cat.icon}`);
    });
    
    // 检查是否有重复
    const names = categories.map(c => c.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  发现重复的分类名称:', duplicates);
    } else {
      console.log('\n✅ 没有重复的分类');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkCategories();
