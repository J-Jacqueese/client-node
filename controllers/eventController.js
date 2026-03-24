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
// 前端/测试工具可能会传入 ISO datetime（带 'T...'），这里统一截断到日期部分。
function dateOnly(value) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (!s) return null;
  // '2026-02-28T16:00:00.000Z' -> '2026-02-28'
  if (s.includes('T')) return s.slice(0, 10);
  // '2026-02-28' 保持原样
  return s.slice(0, 10);
}

exports.getAllEvents = async (req, res) => {
  try {
    const {
      search,
      type,
      mode,
      status,
      city,
      sort,
      include_all,
    } = req.query;

    const conditions = [];
    const params = [];

    const includeAll = include_all === '1' || include_all === 'true';
    if (!includeAll) {
      conditions.push('e.approval_status = \'approved\'');
    }

    if (type && type !== 'all') {
      conditions.push('e.event_type = ?');
      params.push(type);
    }
    if (mode && mode !== 'all') {
      conditions.push('e.event_mode = ?');
      params.push(mode);
    }
    if (status && status !== 'all') {
      conditions.push('e.event_status = ?');
      params.push(status);
    }
    if (city && city !== 'all') {
      conditions.push('e.city = ?');
      params.push(city);
    }

    if (search) {
      conditions.push('(e.title LIKE ? OR e.`desc` LIKE ? OR e.organizer LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    let sql = `
      SELECT e.*
      FROM events e
    `;
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ') + '\n';
    }

    // 排序
    const order = (() => {
      switch (sort) {
        case 'likes':
          return 'e.likes DESC';
        case 'start_asc':
          return 'e.start_date ASC';
        case 'start_desc':
          return 'e.start_date DESC';
        default:
          return 'e.created_at DESC';
      }
    })();

    sql += ` ORDER BY ${order}`;

    const [rows] = await db.query(sql, params);
    const events = rows.map((r) => ({
      ...r,
      speakers: parseMaybeJson(r.speakers, []),
      tags: parseMaybeJson(r.tags, []),
      highlights: parseMaybeJson(r.highlights, []),
      agenda: parseMaybeJson(r.agenda, []),
      sponsors: parseMaybeJson(r.sponsors, []),
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: '获取活动列表失败' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const includeAll = req.query.include_all === '1' || req.query.include_all === 'true';
    const sql = `
      SELECT *
      FROM events
      WHERE id = ?
      ${includeAll ? '' : 'AND approval_status = \'approved\''}
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    const row = rows[0];
    const event = {
      ...row,
      speakers: parseMaybeJson(row.speakers, []),
      tags: parseMaybeJson(row.tags, []),
      highlights: parseMaybeJson(row.highlights, []),
      agenda: parseMaybeJson(row.agenda, []),
      sponsors: parseMaybeJson(row.sponsors, []),
    };

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: '获取活动详情失败' });
  }
};

exports.submitEvent = async (req, res) => {
  try {
    const {
      id,
      title,
      type,
      mode,
      city,
      desc,
      full_desc,
      cover_image,
      start_date,
      end_date,
      location,
      online_url,
      organizer,
      price,
      max_participants,
      tags,
      agenda,
      speakers,
      highlights,
      sponsors,
      registration_url,
      organizer_logo,
    } = req.body;

    if (!title || !type || !mode || !city || !start_date || !end_date || !organizer) {
      return res.status(400).json({ success: false, message: '请填写必填项' });
    }

    const nextId = id ? String(id) : slugify(title) + '-' + Date.now().toString().slice(-6);
    const normalizedStartDate = dateOnly(start_date);
    const normalizedEndDate = dateOnly(end_date);

    const [result] = await db.query(
      `
      INSERT INTO events (
        id, title, \`desc\`, full_desc,
        event_type, event_mode, event_status, city,
        cover_image, start_date, end_date,
        location, online_url,
        organizer, organizer_logo,
        speakers, tags, max_participants, current_participants, price,
        highlights, agenda, sponsors,
        registration_url,
        likes,
        approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        nextId,
        title,
        desc || null,
        full_desc || null,
        type,
        mode,
        'registering',
        city,
        cover_image || null,
        normalizedStartDate,
        normalizedEndDate,
        location || null,
        online_url || null,
        organizer,
        organizer_logo || null,
        JSON.stringify(speakers || []),
        JSON.stringify(tags || []),
        max_participants === '' || max_participants === null || max_participants === undefined ? null : Number(max_participants),
        0,
        price || null,
        JSON.stringify(highlights || []),
        JSON.stringify(agenda || []),
        JSON.stringify(sponsors || []),
        registration_url || null,
        0,
      ]
    );

    res.json({ success: true, message: '提交成功，进入人工审核', id: nextId });
  } catch (error) {
    console.error('Error submitting event:', error);
    res.status(500).json({ success: false, message: '提交活动失败' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      desc,
      full_desc,
      type,
      mode,
      status,
      city,
      cover_image,
      start_date,
      end_date,
      location,
      online_url,
      organizer,
      organizer_logo,
      speakers,
      tags,
      max_participants,
      current_participants,
      price,
      highlights,
      agenda,
      sponsors,
      registration_url,
      likes,
      approval_status,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE events SET
        title = ?,
        \`desc\` = ?,
        full_desc = ?,
        event_type = ?,
        event_mode = ?,
        event_status = ?,
        city = ?,
        cover_image = ?,
        start_date = ?,
        end_date = ?,
        location = ?,
        online_url = ?,
        organizer = ?,
        organizer_logo = ?,
        speakers = ?,
        tags = ?,
        max_participants = ?,
        current_participants = ?,
        price = ?,
        highlights = ?,
        agenda = ?,
        sponsors = ?,
        registration_url = ?,
        likes = ?,
        approval_status = ?
      WHERE id = ?
      `,
      [
        title,
        desc || null,
        full_desc || null,
        type,
        mode,
        status || 'registering',
        city,
        cover_image || null,
        dateOnly(start_date),
        dateOnly(end_date),
        location || null,
        online_url || null,
        organizer,
        organizer_logo || null,
        JSON.stringify(speakers || []),
        JSON.stringify(tags || []),
        max_participants === '' || max_participants === null || max_participants === undefined ? null : Number(max_participants),
        current_participants === '' || current_participants === null || current_participants === undefined ? 0 : Number(current_participants),
        price || null,
        JSON.stringify(highlights || []),
        JSON.stringify(agenda || []),
        JSON.stringify(sponsors || []),
        registration_url || null,
        likes === '' || likes === null || likes === undefined ? 0 : Number(likes),
        approval_status || 'pending',
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: '活动不存在或未更新' });
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: '更新活动失败' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: '删除活动失败' });
  }
};

exports.approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status } = req.body;
    if (!['approved', 'rejected'].includes(approval_status)) {
      return res.status(400).json({ success: false, message: 'approval_status 参数无效' });
    }

    await db.query('UPDATE events SET approval_status = ? WHERE id = ?', [approval_status, id]);
    res.json({ success: true, message: '审批成功' });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ success: false, message: '审批失败' });
  }
};

exports.likeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE events SET likes = likes + 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('Error liking event:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
};

exports.registerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      company,
      role,
      team_name,
      team_size,
      ticket_count,
      notes,
      payment_status,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: '请填写姓名/邮箱/手机号' });
    }

    const tickets = Number(ticket_count || 1);
    if (!Number.isFinite(tickets) || tickets <= 0) {
      return res.status(400).json({ success: false, message: 'ticket_count 参数无效' });
    }

    // 使用事务：锁住事件行，避免超卖
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        `SELECT id, event_status, approval_status, max_participants, current_participants
         FROM events
         WHERE id = ? FOR UPDATE`,
        [id]
      );

      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: '活动不存在' });
      }

      const event = rows[0];
      if (event.approval_status !== 'approved') {
        await conn.rollback();
        return res.status(400).json({ success: false, message: '活动尚未上线' });
      }
      if (event.event_status === 'ended') {
        await conn.rollback();
        return res.status(400).json({ success: false, message: '活动已结束' });
      }

      const max = event.max_participants === null ? null : Number(event.max_participants);
      const current = Number(event.current_participants || 0);
      if (max !== null && current + tickets > max) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: '名额不足' });
      }

      const nextCurrent = max !== null ? current + tickets : current + tickets;

      await conn.query(
        `UPDATE events
         SET current_participants = ?
         WHERE id = ?`,
        [nextCurrent, id]
      );

      await conn.query(
        `INSERT INTO event_registrations (
          event_id, name, email, phone, company, role,
          team_name, team_size, ticket_count, notes, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          email,
          phone,
          company || null,
          role || null,
          team_name || null,
          team_size || null,
          tickets,
          notes || null,
          payment_status || 'free',
        ]
      );

      await conn.commit();
      res.json({ success: true, message: '报名成功', currentParticipants: nextCurrent });
    } catch (e) {
      await conn.rollback();
      console.error('Error registering event:', e);
      res.status(500).json({ success: false, message: '报名失败' });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error registering event:', error);
    res.status(500).json({ success: false, message: '报名失败' });
  }
};

