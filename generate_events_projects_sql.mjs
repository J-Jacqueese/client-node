import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const PROTOTYPE_EVENTS_PATH =
  '/Users/lucismarvin/Desktop/prototype/deepseek-club/client/src/lib/eventsData.ts';
const PROTOTYPE_PROJECTS_PATH =
  '/Users/lucismarvin/Desktop/prototype/deepseek-club/client/src/lib/projectsData.ts';

const OUT_SQL_PATH = '/Users/lucismarvin/Desktop/web/server/db_events_projects.sql';

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  const s = String(value);
  // Escape for MySQL single-quoted string literal.
  // - '' for single quote
  // - \\ for backslash
  // - \n for newline (so MySQL interprets it as newline)
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

function sqlInt(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'NULL';
  return String(Math.trunc(n));
}

function sqlJson(value) {
  if (value === null || value === undefined) return 'NULL';
  return sqlString(JSON.stringify(value));
}

function extractArrayLiteral(source, marker) {
  const idx = source.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Cannot find marker: ${marker}`);
  }

  // The declaration is like:
  //   export const events: EventItem[] = [ ...data... ];
  // So we must locate the `=` first, then the data array `[`.
  const eqIdx = source.indexOf('=', idx);
  if (eqIdx === -1) {
    throw new Error(`Cannot find '=' after marker: ${marker}`);
  }

  const startBracket = source.indexOf('[', eqIdx);
  if (startBracket === -1) {
    throw new Error(`Cannot find '[' after marker: ${marker}`);
  }

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escape = false;

  for (let i = startBracket; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (escape) {
      escape = false;
      continue;
    }

    if (inSingle) {
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inTemplate) {
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '`') {
        inTemplate = false;
        continue;
      }
      continue;
    }

    // Enter string literals
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    if (ch === '[') depth++;
    if (ch === ']') {
      depth--;
      if (depth === 0) {
        const literal = source.slice(startBracket, i + 1);
        return literal;
      }
    }
  }

  throw new Error(`Failed to extract array literal for marker: ${marker}`);
}

function evalArrayLiteral(literal) {
  // eslint-disable-next-line no-new-func
  const code = `(${literal})`;
  return vm.runInNewContext(code, {}, { timeout: 10000 });
}

function toDateOrNull(s) {
  if (!s) return null;
  // Prototype uses 'YYYY-MM-DD' (or sometimes same start/end).
  // Keep as-is so MySQL can parse.
  return String(s);
}

const prototypeEventsSource = fs.readFileSync(PROTOTYPE_EVENTS_PATH, 'utf-8');
const prototypeProjectsSource = fs.readFileSync(PROTOTYPE_PROJECTS_PATH, 'utf-8');

const eventsLiteral = extractArrayLiteral(
  prototypeEventsSource,
  'export const events'
);
const projectsLiteral = extractArrayLiteral(
  prototypeProjectsSource,
  'export const projectsData'
);

const events = evalArrayLiteral(eventsLiteral);
const projects = evalArrayLiteral(projectsLiteral);

if (!Array.isArray(events) || events.length === 0) {
  throw new Error('No events parsed from prototype.');
}
if (!Array.isArray(projects) || projects.length === 0) {
  throw new Error('No projects parsed from prototype.');
}

let sql = '';

sql += '-- DeepSeek Club - events & projects 初始化脚本\n';
sql += '-- 说明：请在执行 server/db.sql 后，再执行本脚本。\n';
sql += '\n';
sql += 'USE deepseek_club;\n';
sql += '\n';

sql += `
-- events 表：AI 活动（含人工提交审核流）
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  desc TEXT,
  full_desc TEXT,
  event_type VARCHAR(30) NOT NULL,
  event_mode VARCHAR(30) NOT NULL,
  event_status VARCHAR(30) NOT NULL,
  city VARCHAR(30) NOT NULL,
  cover_image VARCHAR(255) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(255) NULL,
  online_url VARCHAR(255) NULL,
  organizer VARCHAR(100) NOT NULL,
  organizer_logo VARCHAR(255) NULL,
  speakers JSON NULL,
  tags JSON NULL,
  max_participants INT NULL,
  current_participants INT NULL,
  price VARCHAR(50) NULL,
  highlights JSON NULL,
  agenda JSON NULL,
  sponsors JSON NULL,
  registration_url VARCHAR(255) NULL,
  likes INT DEFAULT 0,
  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_start (start_date),
  INDEX idx_events_status (event_status),
  INDEX idx_events_approval (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 活动表';
`.trim();
sql += '\n\n';

sql += `
-- event_registrations 表：活动报名记录
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  company VARCHAR(200) NULL,
  role VARCHAR(100) NULL,
  team_name VARCHAR(100) NULL,
  team_size VARCHAR(50) NULL,
  ticket_count INT NOT NULL DEFAULT 1,
  notes TEXT NULL,
  payment_status ENUM('free','paid','unpaid','success','pending') NOT NULL DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reg_event (event_id),
  CONSTRAINT fk_event_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名记录';
`.trim();
sql += '\n\n';

sql += `
-- projects 表：AI 开源项目库（含人工提交审核流）
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  long_description MEDIUMTEXT,
  language VARCHAR(50) NOT NULL,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  issues INT DEFAULT 0,
  contributors INT DEFAULT 0,
  license VARCHAR(80) NULL,
  last_update DATE NULL,
  created_at DATE NULL,
  topics JSON NULL,
  github_url VARCHAR(255) NOT NULL,
  website_url VARCHAR(255) NULL,
  logo_url VARCHAR(255) NULL,
  is_weekly_pick TINYINT(1) DEFAULT 0,
  is_editor_choice TINYINT(1) DEFAULT 0,
  editor_comment TEXT NULL,
  trend_stars_7d INT DEFAULT 0,
  likes INT DEFAULT 0,
  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  submitted_reason TEXT NULL,
  submitted_tags JSON NULL,
  submitted_website_url VARCHAR(255) NULL,
  created_at_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_category (category),
  INDEX idx_projects_approval (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 开源项目库表';
`.trim();
sql += '\n\n';

sql += `-- ========= Seed: events =========\n`;
for (const ev of events) {
  const speakers = ev.speakers ?? [];
  const tags = ev.tags ?? [];
  const highlights = ev.highlights ?? [];
  const agenda = ev.agenda ?? [];
  const sponsors = ev.sponsors ?? [];

  // Prototype uses status like: upcoming/ongoing/ended/registering
  sql += `INSERT INTO events (
  id, title, desc, full_desc, event_type, event_mode, event_status, city,
  cover_image, start_date, end_date, location, online_url, organizer, organizer_logo,
  speakers, tags, max_participants, current_participants, price,
  highlights, agenda, sponsors, registration_url,
  likes, approval_status
) VALUES (
  ${sqlString(ev.id)},
  ${sqlString(ev.title)},
  ${sqlString(ev.desc)},
  ${sqlString(ev.fullDesc)},
  ${sqlString(ev.type)},
  ${sqlString(ev.mode)},
  ${sqlString(ev.status)},
  ${sqlString(ev.city)},
  ${sqlString(ev.coverImage)},
  ${sqlString(toDateOrNull(ev.startDate))},
  ${sqlString(toDateOrNull(ev.endDate))},
  ${sqlString(ev.location)},
  ${sqlString(ev.onlineUrl ?? null)},
  ${sqlString(ev.organizer)},
  ${sqlString(ev.organizerLogo ?? null)},
  ${sqlJson(speakers)},
  ${sqlJson(tags)},
  ${sqlInt(ev.maxParticipants)},
  ${sqlInt(ev.currentParticipants)},
  ${sqlString(ev.price)},
  ${sqlJson(highlights)},
  ${sqlJson(agenda)},
  ${sqlJson(sponsors)},
  ${sqlString(ev.registrationUrl ?? null)},
  ${sqlInt(ev.likes ?? 0)},
  'approved'
);\n`;
}

sql += `\n-- ========= Seed: projects =========\n`;
for (const p of projects) {
  const topics = p.topics ?? [];
  sql += `INSERT INTO projects (
  id, name, full_name, category, description, long_description,
  language, stars, forks, issues, contributors, license,
  last_update, created_at, topics,
  github_url, website_url, logo_url,
  is_weekly_pick, is_editor_choice, editor_comment, trend_stars_7d,
  likes, approval_status
) VALUES (
  ${sqlString(p.id)},
  ${sqlString(p.name)},
  ${sqlString(p.fullName)},
  ${sqlString(p.category)},
  ${sqlString(p.description)},
  ${sqlString(p.longDescription)},
  ${sqlString(p.language)},
  ${sqlInt(p.stars)},
  ${sqlInt(p.forks)},
  ${sqlInt(p.issues)},
  ${sqlInt(p.contributors)},
  ${sqlString(p.license ?? null)},
  ${sqlString(toDateOrNull(p.lastUpdate))},
  ${sqlString(toDateOrNull(p.createdAt))},
  ${sqlJson(topics)},
  ${sqlString(p.githubUrl)},
  ${sqlString(p.website ?? null)},
  ${sqlString(p.logoUrl ?? null)},
  ${p.isWeeklyPick ? 1 : 0},
  ${p.isEditorChoice ? 1 : 0},
  ${sqlString(p.editorComment ?? null)},
  ${sqlInt(p.trendStars7d ?? 0)},
  ${sqlInt(0)},
  'approved'
);\n`;
}

fs.mkdirSync(path.dirname(OUT_SQL_PATH), { recursive: true });
fs.writeFileSync(OUT_SQL_PATH, sql, 'utf-8');

console.log(`生成完成：${OUT_SQL_PATH}`);
console.log(`解析到 events: ${events.length}, projects: ${projects.length}`);

