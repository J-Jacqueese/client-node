const db = require('./config/database');

// 模型数据
const modelsData = [
  // 法律咨询类别 (category_id: 2)
  {
    name: 'DeepSeek-R1-Legal-Contract',
    author: 'ContractAI_Lab',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Contract',
    version: 'v1.2.0',
    base_model: 'R1-32B',
    category_id: 2,
    description: '专注于合同起草与审核的法律专家模型',
    readme: '## 模型描述\n\n专为合同审核场景优化，能够快速识别合同中的风险条款、不平等条款和潜在法律漏洞。\n\n## 核心功能\n\n- ✅ 合同条款分析\n- ✅ 风险点识别\n- ✅ 法律建议生成\n- ✅ 支持20+行业合同模板',
    prompt_example: 'system_prompt: "你是一名专业的合同审核律师"\ninput: "请审核这份劳动合同的竞业限制条款是否合理"',
    comparison: '相比通用模型，风险识别准确率提升65%',
    likes: 328,
    downloads: 890,
    views: 2100,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/legal-contract'},
      {type: '网盘下载', url: '#'}
    ]),
    files: JSON.stringify([
      {name: 'legal_contract_r1_q4.gguf', size: '16.8 GB'}
    ]),
    tags: [1, 3]
  },
  {
    name: 'DeepSeek-V3-Legal-Research',
    author: 'LegalTech_Innovate',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Research',
    version: 'v2.0.1',
    base_model: 'V3-671B',
    category_id: 2,
    description: '法律检索与案例分析专家模型',
    readme: '## 模型描述\n\n基于10万+真实案例训练，擅长法律检索、判例分析和法律意见书撰写。\n\n## 特性\n\n- 🔍 智能法条检索\n- 📚 案例库匹配\n- 📝 法律文书生成',
    prompt_example: 'input: "查找近三年关于网络侵权的典型判例"',
    comparison: '检索准确率92%，优于传统检索系统',
    likes: 567,
    downloads: 1450,
    views: 3200,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/legal-research'}
    ]),
    files: JSON.stringify([
      {name: 'legal_research_v3_q4.gguf', size: '280 GB'}
    ]),
    tags: [1, 5]
  },
  
  // 医疗辅助类别 (category_id: 3)
  {
    name: 'DeepSeek-R1-MedDiag-Expert',
    author: 'MedAI_Research',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=MedDiag',
    version: 'v1.5.2',
    base_model: 'R1-32B',
    category_id: 3,
    description: '临床诊断辅助与病例分析专家模型',
    readme: '## 模型描述\n\n基于50万份真实病例训练，为医生提供临床诊断建议和鉴别诊断思路。\n\n## 功能特性\n\n- 🏥 症状分析\n- 🔬 辅助诊断\n- 💊 用药建议\n- 📋 病历分析',
    prompt_example: 'input: "患者主诉：持续发热3天，伴咳嗽、乏力，请给出可能的诊断方向"',
    comparison: '诊断建议准确率达86%，辅助诊断效率提升40%',
    likes: 892,
    downloads: 2340,
    views: 5600,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/meddiag'},
      {type: '网盘下载', url: '#'}
    ]),
    files: JSON.stringify([
      {name: 'meddiag_r1_32b_q4.gguf', size: '19.5 GB'}
    ]),
    tags: [1, 3, 5]
  },
  {
    name: 'DeepSeek-Med-TCM-Assistant',
    author: 'TCM_AI_Lab',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=TCM',
    version: 'v1.0.8',
    base_model: 'R1-7B',
    category_id: 3,
    description: '中医智能诊疗辅助系统',
    readme: '## 模型描述\n\n结合《黄帝内经》《伤寒论》等经典医籍，提供中医辨证施治建议。\n\n## 特色功能\n\n- 🌿 望闻问切分析\n- 📖 经典方剂推荐\n- ⚖️ 中西医结合建议',
    prompt_example: 'input: "患者舌苔厚腻，脉象濡滑，请给出中医辨证分析"',
    comparison: '方剂推荐准确率78%，符合中医诊疗规范',
    likes: 445,
    downloads: 1120,
    views: 2800,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/tcm-assistant'}
    ]),
    files: JSON.stringify([
      {name: 'tcm_r1_7b_q4.gguf', size: '4.2 GB'}
    ]),
    tags: [1, 5]
  },
  
  // 金融分析类别 (category_id: 4)
  {
    name: 'DeepSeek-FinanceGPT-Analyst',
    author: 'QuantAI_Team',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Finance',
    version: 'v2.1.0',
    base_model: 'V3-671B',
    category_id: 4,
    description: '金融市场分析与投资研究专家模型',
    readme: '## 模型描述\n\n专注于金融数据分析、市场预测和投资研究报告生成。\n\n## 核心能力\n\n- 📈 技术分析\n- 📊 基本面分析\n- 💹 风险评估\n- 📝 研报生成',
    prompt_example: 'input: "分析特斯拉近期财报，给出投资建议"',
    comparison: '市场预测准确率达72%，超越传统量化模型',
    likes: 1023,
    downloads: 3450,
    views: 8900,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/finance-analyst'},
      {type: 'ModelScope', url: '#'}
    ]),
    files: JSON.stringify([
      {name: 'finance_v3_q4.gguf', size: '275 GB'}
    ]),
    tags: [1, 3, 5]
  },
  {
    name: 'DeepSeek-Risk-Management',
    author: 'RiskAI_Solutions',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Risk',
    version: 'v1.3.5',
    base_model: 'R1-32B',
    category_id: 4,
    description: '金融风险评估与合规检查模型',
    readme: '## 模型描述\n\n专为金融机构设计，提供风险评估、反洗钱检测和合规审查功能。\n\n## 主要功能\n\n- 🛡️ 风险评分\n- 🔍 异常交易检测\n- ⚖️ 合规性审查\n- 📋 监管报告生成',
    prompt_example: 'input: "评估该笔跨境交易的洗钱风险"',
    comparison: '风险识别准确率89%，误报率降低55%',
    likes: 678,
    downloads: 1890,
    views: 4200,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/risk-management'}
    ]),
    files: JSON.stringify([
      {name: 'risk_mgmt_r1_q4.gguf', size: '18.9 GB'}
    ]),
    tags: [1, 5]
  },
  
  // 编程开发类别 (category_id: 5)
  {
    name: 'DeepSeek-CodeReviewer-Pro',
    author: 'DevSecOps_Team',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Reviewer',
    version: 'v3.0.0',
    base_model: 'V3-671B',
    category_id: 5,
    description: '智能代码审查与安全漏洞检测模型',
    readme: '## 模型描述\n\n结合代码质量检查、安全漏洞扫描和最佳实践建议。\n\n## 检查项目\n\n- 🔒 安全漏洞检测\n- 🎯 性能优化建议\n- 📐 代码规范检查\n- 🧪 测试覆盖分析',
    prompt_example: 'input: "审查这段React代码的安全性和性能问题"',
    comparison: '漏洞检出率95%，误报率仅3%',
    likes: 1456,
    downloads: 5670,
    views: 12000,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/code-reviewer'},
      {type: 'GitHub Release', url: '#'}
    ]),
    files: JSON.stringify([
      {name: 'code_reviewer_v3_q4.gguf', size: '290 GB'}
    ]),
    tags: [1, 3, 5]
  },
  {
    name: 'DeepSeek-FullStack-Dev',
    author: 'CodeGen_Pro',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=FullStack',
    version: 'v2.5.0',
    base_model: 'V3-671B',
    category_id: 5,
    description: '全栈开发代码生成专家模型',
    readme: '## 模型描述\n\n支持前后端代码生成，从需求到部署全流程辅助。\n\n## 支持技术栈\n\n- ⚛️ React/Vue/Angular\n- 🚀 Node.js/Python/Java\n- 🗄️ SQL/NoSQL\n- 🐳 Docker/K8s',
    prompt_example: 'input: "生成一个用户认证系统，包含前后端代码"',
    comparison: '代码质量评分8.5/10，开发效率提升3倍',
    likes: 2134,
    downloads: 7890,
    views: 15600,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/fullstack-dev'}
    ]),
    files: JSON.stringify([
      {name: 'fullstack_v3_q4.gguf', size: '285 GB'},
      {name: 'fullstack_v3_q8.gguf', size: '540 GB'}
    ]),
    tags: [1, 3, 5]
  },
  {
    name: 'DeepSeek-Algorithm-Master',
    author: 'AlgoAI_Research',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Algorithm',
    version: 'v1.8.0',
    base_model: 'R1-32B',
    category_id: 5,
    description: '算法设计与数据结构专家模型',
    readme: '## 模型描述\n\n专注于算法题解、复杂度分析和数据结构设计。\n\n## 擅长领域\n\n- 🧮 LeetCode题解\n- 📊 算法优化\n- 🎓 面试辅导\n- 🏆 竞赛编程',
    prompt_example: 'input: "给出两数之和的最优解法并分析时间复杂度"',
    comparison: '算法题解通过率98%，代码效率优于80%提交',
    likes: 1789,
    downloads: 4560,
    views: 9800,
    download_links: JSON.stringify([
      {type: 'HuggingFace', url: 'https://huggingface.co/algorithm-master'}
    ]),
    files: JSON.stringify([
      {name: 'algorithm_r1_q4.gguf', size: '19.2 GB'}
    ]),
    tags: [1, 5]
  }
];

// 应用数据
const appsData = [
  // 法律科技类别 (category_id: 6)
  {
    name: 'LawBot智能法务助手',
    developer: 'LegalTech_Pro',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LawBot',
    icon_bg: 'from-blue-600 to-indigo-700',
    category_id: 6,
    description: '为律师事务所提供案件管理、文书生成和客户咨询一体化解决方案',
    detail: '## 产品介绍\n\nLawBot 集成了案件管理、智能文书生成、判例检索等功能，帮助律师提升工作效率。\n\n## 核心功能\n\n- 📋 智能文书生成\n- 🔍 AI法律检索\n- 💼 案件管理系统\n- 👥 客户咨询机器人',
    version: 'v3.2.0',
    base_model: 'DeepSeek-R1 深度微调',
    website_url: 'https://lawbot.ai',
    comparison: '文书生成速度提升10倍，准确率达95%',
    upvotes: 567,
    views: 3400,
    rank_position: 3,
    tags: [5]
  },
  {
    name: '合规管家',
    developer: 'ComplianceAI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Compliance',
    icon_bg: 'from-emerald-500 to-teal-600',
    category_id: 6,
    description: '企业合规风险实时监测与预警平台',
    detail: '## 产品特色\n\n实时监控企业经营活动，智能识别合规风险点，提供预警和整改建议。\n\n## 功能模块\n\n- ⚠️ 风险预警\n- 📊 合规报告\n- 🔔 政策更新推送\n- 📈 合规评分',
    version: 'v2.0.5',
    base_model: 'DeepSeek-V3',
    website_url: 'https://compliance.ai',
    comparison: '风险识别准确率88%，预警及时率95%',
    upvotes: 389,
    views: 2100,
    rank_position: 5,
    tags: [5]
  },
  
  // 医疗诊断类别 (category_id: 7)
  {
    name: 'AI医生助手',
    developer: 'HealthAI_Lab',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor',
    icon_bg: 'from-red-500 to-pink-600',
    category_id: 7,
    description: '基层医疗机构的智能诊断辅助系统',
    detail: '## 产品价值\n\n为基层医生提供诊断建议，降低误诊率，提升医疗服务质量。\n\n## 核心功能\n\n- 🏥 智能问诊\n- 🔬 影像分析\n- 💊 用药推荐\n- 📋 电子病历',
    version: 'v4.1.0',
    base_model: 'DeepSeek-R1 医疗专用版',
    website_url: 'https://aidoctor.health',
    comparison: '辅助诊断准确率达87%，基层医生好评率92%',
    upvotes: 892,
    views: 6700,
    rank_position: 2,
    tags: [5]
  },
  {
    name: '智慧药房',
    developer: 'PharmaAI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pharma',
    icon_bg: 'from-green-500 to-emerald-600',
    category_id: 7,
    description: '药品管理与用药指导智能系统',
    detail: '## 产品介绍\n\n智能药品库存管理、用药安全审查和患者用药指导。\n\n## 功能特性\n\n- 💊 用药安全检查\n- 📦 库存智能管理\n- 👨‍⚕️ 药师咨询\n- 📱 患者用药提醒',
    version: 'v2.3.0',
    base_model: 'DeepSeek-V3',
    website_url: 'https://smartpharma.ai',
    comparison: '用药错误率降低75%，库存周转率提升30%',
    upvotes: 445,
    views: 2800,
    rank_position: 6,
    tags: [5]
  },
  
  // 编程助手类别 (category_id: 8)
  {
    name: 'CodeMentor Pro',
    developer: 'DevTools_Inc',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMentor',
    icon_bg: 'from-purple-600 to-pink-600',
    category_id: 8,
    description: 'AI驱动的代码生成、审查与重构工具',
    detail: '## 产品特色\n\n集成IDE，实时代码补全、智能重构、性能优化建议。\n\n## 核心功能\n\n- ⚡ 智能代码补全\n- 🔍 代码审查\n- 🔧 自动重构\n- 📚 API文档生成',
    version: 'v5.0.0',
    base_model: 'DeepSeek-V3-Coder',
    website_url: 'https://codementor.pro',
    comparison: '开发效率提升4倍，代码质量提升50%',
    upvotes: 1567,
    views: 9800,
    rank_position: 1,
    tags: [5]
  },
  {
    name: 'BugHunter AI',
    developer: 'Security_First',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BugHunter',
    icon_bg: 'from-orange-500 to-red-600',
    category_id: 8,
    description: '智能代码漏洞扫描与安全加固平台',
    detail: '## 产品介绍\n\n自动化安全测试，识别代码漏洞，提供修复方案。\n\n## 功能模块\n\n- 🐛 漏洞扫描\n- 🔒 安全加固\n- 📊 安全报告\n- 🚨 实时监控',
    version: 'v3.5.0',
    base_model: 'DeepSeek-V3',
    website_url: 'https://bughunter.ai',
    comparison: '漏洞检出率96%，误报率仅2%',
    upvotes: 789,
    views: 5200,
    rank_position: 4,
    tags: [5]
  }
];

async function seedData() {
  try {
    console.log('🌱 开始批量插入数据...\n');
    
    // 插入模型数据
    console.log('📦 正在插入模型数据...');
    for (const model of modelsData) {
      const { tags, ...modelData } = model;
      
      // 插入模型
      const [result] = await db.query(
        `INSERT INTO models (
          name, author, avatar, version, base_model, category_id,
          description, readme, prompt_example, comparison,
          likes, downloads, views, download_links, files
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          modelData.name, modelData.author, modelData.avatar,
          modelData.version, modelData.base_model, modelData.category_id,
          modelData.description, modelData.readme, modelData.prompt_example,
          modelData.comparison, modelData.likes, modelData.downloads,
          modelData.views, modelData.download_links, modelData.files
        ]
      );
      
      const modelId = result.insertId;
      
      // 插入标签关联
      if (tags && tags.length > 0) {
        const tagValues = tags.map(tagId => [modelId, tagId]);
        await db.query('INSERT INTO model_tags (model_id, tag_id) VALUES ?', [tagValues]);
      }
      
      console.log(`  ✅ ${modelData.name}`);
    }
    
    console.log(`\n✨ 成功插入 ${modelsData.length} 个模型\n`);
    
    // 插入应用数据
    console.log('📱 正在插入应用数据...');
    for (const app of appsData) {
      const { tags, ...appData } = app;
      
      // 插入应用
      const [result] = await db.query(
        `INSERT INTO apps (
          name, developer, avatar, icon_bg, category_id,
          description, detail, version, base_model, website_url,
          comparison, upvotes, views, rank_position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appData.name, appData.developer, appData.avatar, appData.icon_bg,
          appData.category_id, appData.description, appData.detail,
          appData.version, appData.base_model, appData.website_url,
          appData.comparison, appData.upvotes, appData.views, appData.rank_position
        ]
      );
      
      const appId = result.insertId;
      
      // 插入标签关联
      if (tags && tags.length > 0) {
        const tagValues = tags.map(tagId => [appId, tagId]);
        await db.query('INSERT INTO app_tags (app_id, tag_id) VALUES ?', [tagValues]);
      }
      
      console.log(`  ✅ ${appData.name}`);
    }
    
    console.log(`\n✨ 成功插入 ${appsData.length} 个应用\n`);
    
    // 显示统计
    const [modelCount] = await db.query('SELECT COUNT(*) as count FROM models');
    const [appCount] = await db.query('SELECT COUNT(*) as count FROM apps');
    
    console.log('📊 数据统计：');
    console.log(`  模型总数: ${modelCount[0].count}`);
    console.log(`  应用总数: ${appCount[0].count}`);
    console.log('\n🎉 数据批量插入完成！');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 插入数据失败:', error);
    process.exit(1);
  }
}

seedData();
