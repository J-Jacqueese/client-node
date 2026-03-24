const db = require('../config/database');

function parseMaybeJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// MySQL DATE 字段通常只接收 'YYYY-MM-DD'
function dateOnly(value) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (!s) return null;
  // '2026-03-16T16:00:00.000Z' -> '2026-03-16'
  if (s.includes('T')) return s.slice(0, 10);
  return s.slice(0, 10);
}

function parseGitHubRepo(githubUrl) {
  try {
    if (!githubUrl) return null;
    const u = String(githubUrl).trim();
    const m = u.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!m) return null;
    return { owner: m[1], repo: m[2], fullName: `${m[1]}/${m[2]}` };
  } catch {
    return null;
  }
}

exports.getAllProjects = async (req, res) => {
  try {
    const {
      search,
      category,
      language,
      sort,
      include_all,
    } = req.query;

    const conditions = [];
    const params = [];

    const includeAll = include_all === '1' || include_all === 'true';
    if (!includeAll) {
      conditions.push('p.approval_status = \'approved\'');
    }

    if (category && category !== 'all') {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (language && language !== 'all') {
      conditions.push('p.language = ?');
      params.push(language);
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.full_name LIKE ? OR p.description LIKE ? OR p.editor_comment LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    let sql = `
      SELECT p.*
      FROM projects p
    `;
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ') + '\n';
    }

    const order = (() => {
      switch (sort) {
        case 'trending':
          return 'p.trend_stars_7d DESC, p.stars DESC';
        case 'forks':
          return 'p.forks DESC';
        case 'updated':
          return 'p.last_update DESC';
        case 'stars':
        default:
          return 'p.stars DESC';
      }
    })();

    sql += ` ORDER BY ${order}`;

    const [rows] = await db.query(sql, params);
    const projects = rows.map((r) => ({
      ...r,
      topics: parseMaybeJson(r.topics, []),
    }));

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const includeAll = req.query.include_all === '1' || req.query.include_all === 'true';

    const sql = `
      SELECT *
      FROM projects
      WHERE id = ?
      ${includeAll ? '' : 'AND approval_status = \'approved\''}
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const row = rows[0];
    res.json({
      success: true,
      data: {
        ...row,
        topics: parseMaybeJson(row.topics, []),
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: '获取项目详情失败' });
  }
};

exports.submitProject = async (req, res) => {
  try {
    const {
      id,
      github_url,
      category,
      reason,
      website_url,
      tags,
      language,
    } = req.body;

    if (!github_url || !category || !reason) {
      return res.status(400).json({ success: false, message: '请填写必填项' });
    }

    const parsed = parseGitHubRepo(github_url);
    const nextId =
      id
        ? String(id)
        : parsed
          ? slugify(parsed.repo)
          : slugify(github_url) + '-' + Date.now().toString().slice(-6);

    const name = parsed?.repo || 'Untitled';
    const fullName = parsed?.fullName || github_url;

    const [result] = await db.query(
      `
      INSERT INTO projects (
        id, name, full_name, category,
        description, long_description,
        language, stars, forks, issues, contributors,
        license, last_update, created_at, topics,
        github_url, website_url, logo_url,
        is_weekly_pick, is_editor_choice, editor_comment,
        trend_stars_7d, likes,
        approval_status,
        submitted_reason, submitted_tags, submitted_website_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `,
      [
        nextId,
        name,
        fullName,
        category,
        reason,
        null,
        language || 'Unknown',
        0,
        0,
        0,
        0,
        null,
        null,
        null,
        JSON.stringify(tags || []),
        github_url,
        website_url || null,
        null,
        0,
        0,
        null,
        0,
        0,
        reason,
        JSON.stringify(tags || []),
        website_url || null,
      ]
    );

    res.json({ success: true, message: '提交成功，进入人工审核', id: nextId });
  } catch (error) {
    console.error('Error submitting project:', error);
    res.status(500).json({ success: false, message: '提交项目失败' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      full_name,
      category,
      description,
      long_description,
      language,
      stars,
      forks,
      issues,
      contributors,
      license,
      last_update,
      topics,
      github_url,
      website_url,
      logo_url,
      is_weekly_pick,
      is_editor_choice,
      editor_comment,
      trend_stars_7d,
      likes,
      approval_status,
      submitted_reason,
      submitted_tags,
      submitted_website_url,
      created_at,
    } = req.body;

    const normalizedLastUpdate = dateOnly(last_update);
    const normalizedCreatedAt = dateOnly(created_at);

    const [result] = await db.query(
      `
      UPDATE projects SET
        name = ?,
        full_name = ?,
        category = ?,
        description = ?,
        long_description = ?,
        language = ?,
        stars = ?,
        forks = ?,
        issues = ?,
        contributors = ?,
        license = ?,
        last_update = ?,
        created_at = ?,
        topics = ?,
        github_url = ?,
        website_url = ?,
        logo_url = ?,
        is_weekly_pick = ?,
        is_editor_choice = ?,
        editor_comment = ?,
        trend_stars_7d = ?,
        likes = ?,
        approval_status = ?,
        submitted_reason = ?,
        submitted_tags = ?,
        submitted_website_url = ?
      WHERE id = ?
      `,
      [
        name,
        full_name,
        category,
        description || null,
        long_description || null,
        language,
        stars ?? 0,
        forks ?? 0,
        issues ?? 0,
        contributors ?? 0,
        license || null,
        normalizedLastUpdate,
        normalizedCreatedAt,
        JSON.stringify(topics || []),
        github_url,
        website_url || null,
        logo_url || null,
        is_weekly_pick ? 1 : 0,
        is_editor_choice ? 1 : 0,
        editor_comment || null,
        trend_stars_7d ?? 0,
        likes ?? 0,
        approval_status || 'pending',
        submitted_reason || null,
        JSON.stringify(submitted_tags || []),
        submitted_website_url || null,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: '项目不存在或未更新' });
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: '更新项目失败' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: '删除项目失败' });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status } = req.body;
    if (!['approved', 'rejected'].includes(approval_status)) {
      return res.status(400).json({ success: false, message: 'approval_status 参数无效' });
    }

    await db.query('UPDATE projects SET approval_status = ? WHERE id = ?', [approval_status, id]);
    res.json({ success: true, message: '审批成功' });
  } catch (error) {
    console.error('Error approving project:', error);
    res.status(500).json({ success: false, message: '审批失败' });
  }
};

exports.likeProject = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE projects SET likes = likes + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('Error liking project:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
};

