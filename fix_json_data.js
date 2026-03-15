const db = require('./config/database');

async function fixJsonData() {
  try {
    console.log('🔧 开始修复数据库中的 JSON 数据...');
    
    // 修复模型1的数据
    await db.query(`
      UPDATE models 
      SET 
        download_links = ?,
        files = ?
      WHERE id = 1
    `, [
      JSON.stringify([
        {type: "HuggingFace", url: "https://huggingface.co/example"},
        {type: "网盘下载", url: "#"}
      ]),
      JSON.stringify([
        {name: "lawyer_r1_32b_q4.gguf", size: "18.2 GB"}
      ])
    ]);
    
    // 修复模型2的数据
    await db.query(`
      UPDATE models 
      SET 
        download_links = ?,
        files = ?
      WHERE id = 2
    `, [
      JSON.stringify([
        {type: "HuggingFace", url: "https://huggingface.co/example"}
      ]),
      JSON.stringify([
        {name: "coder_v3_q4.gguf", size: "256 GB"}
      ])
    ]);
    
    console.log('✅ JSON 数据修复完成！');
    
    // 验证数据
    const [models] = await db.query('SELECT id, name, download_links, files FROM models');
    console.log('\n📊 当前模型数据：');
    models.forEach(model => {
      console.log(`\nID: ${model.id}`);
      console.log(`名称: ${model.name}`);
      console.log(`下载链接类型: ${typeof model.download_links}`);
      console.log(`文件类型: ${typeof model.files}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

fixJsonData();
