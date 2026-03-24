## DeepSeek Club Server 部署文档（生产环境）

本项目为基于 **Node.js + Express + MySQL** 的后端服务，入口文件为 `server.js`，默认端口为 `3000`，所有业务接口统一前缀为：`/model_api/...`。

下面文档以 **Linux 服务器（如 Ubuntu）+ MySQL** 为例，给出一套完整的部署步骤。

---

### 1. 环境准备

- **Node.js**：建议 18+ 版本（自带 npm）
- **MySQL**：建议 8.0+（5.7 也可）
- **Git**：用于拉取代码
- **可选：pm2**：用于生产环境进程守护

检查版本：

```bash
node -v
npm -v
mysql --version
```

---

### 2. 部署目录与代码拉取

1. 登录到你的应用服务器（示例使用 `/var/www/deepseek-club/server` 作为项目目录）：

```bash
ssh <your-user>@<your-server-ip>

sudo mkdir -p /var/www/deepseek-club
sudo chown -R $USER:$USER /var/www/deepseek-club
cd /var/www/deepseek-club
```

2. 拉取代码：

```bash
git clone <你的仓库地址> server
cd server
```

---

### 3. 安装项目依赖

在项目根目录（有 `package.json` 的目录）执行：

```bash
npm install
```

---

### 4. 配置数据库

#### 4.1 创建数据库

登录 MySQL（以下以本机 MySQL 为例，远程 MySQL 请用对应 IP）：

```bash
mysql -u root -p
```

在 MySQL 控制台中执行：

```sql
CREATE DATABASE deepseek_club CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如需单独业务账号（推荐）：

```sql
CREATE USER 'deepseek'@'你的应用服务器IP' IDENTIFIED BY '安全密码';
GRANT ALL PRIVILEGES ON deepseek_club.* TO 'deepseek'@'你的应用服务器IP';
FLUSH PRIVILEGES;
```

> 例如，当前应用服务器公网 IP 是 `127.0.0.1`，则 host 写成 `'127.0.0.1'`。

#### 4.2 导入初始化 SQL（如需要）

项目中提供了 `db.sql` 和若干 `migrations/*.sql`，可按需执行：

```bash
mysql -h <DB_HOST> -u <DB_USER> -p deepseek_club < db.sql

# 如需执行迁移脚本，可依次：
mysql -h <DB_HOST> -u <DB_USER> -p deepseek_club < migrations/add_base_models_table.sql
mysql -h <DB_HOST> -u <DB_USER> -p deepseek_club < migrations/add_app_download_links_column.sql
mysql -h <DB_HOST> -u <DB_USER> -p deepseek_club < migrations/add_model_type_column.sql
```

根据实际情况选择执行哪些脚本。

---

### 5. 配置环境变量（.env）

项目根目录下已有 `.env.example`，可以直接复制为 `.env` 并修改：

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
nano .env   # 或 vim .env
```

关键字段说明（示例）：

```dotenv
# 服务器配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=<MySQL 服务器 IP 或 127.0.0.1>
DB_USER=<上面创建的数据库用户，例如 deepseek>
DB_PASSWORD=<对应密码>
DB_NAME=deepseek_club

# CORS 配置
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
# 生产环境可以改为你的前端域名：
# CORS_ORIGIN=https://your-frontend-domain.com
```

> 注意：如果 MySQL 和 Node 服务在**不同服务器**，`DB_HOST` 必须是数据库服务器的 IP/域名，并在 MySQL 中为该 IP 配置允许访问的用户（如 `'deepseek'@'127.0.0.1'`）。  
> 否则会出现 `Access denied for user 'xxx'@'127.0.0.1'` 的错误。

---

### 6. 启动服务

#### 6.1 开发/临时调试（前台运行）

```bash
cd /var/www/deepseek-club/server
npm start
```

看到控制台输出类似：

```text
DeepSeek Club Server is running on https://deepseek.club
API Health Check: https://deepseek.club/model_api/health
```

说明服务启动成功。

#### 6.2 使用 pm2 守护进程（推荐生产）

1. 全局安装 pm2（只需一次）：

```bash
npm install -g pm2
```

2. 启动服务：

```bash
cd /var/www/deepseek-club/server
pm2 start server.js --name deepseek-club
```

3. 查看状态：

```bash
pm2 status
pm2 logs deepseek-club
```

4. 设置开机自启：

```bash
pm2 startup
pm2 save
```

---

### 7. 接口自测

#### 7.1 在服务器本机测试

```bash
curl https://deepseek.club/model_api/health
```

预期返回：

```json
{"status":"ok","message":"DeepSeek Club API is running"}
```

你也可以测试具体业务接口（部分示例，视项目路由而定）：

```bash
curl https://deepseek.club/model_api/models
curl https://deepseek.club/model_api/apps
curl https://deepseek.club/model_api/base-models
curl https://deepseek.club/model_api/categories
curl https://deepseek.club/model_api/tags
```

如果出现 `Access denied for user ...`，请重点检查：

- `.env` 中的 `DB_HOST / DB_USER / DB_PASSWORD` 是否正确；
- MySQL 中是否为 `DB_USER` 配置了正确的 host（如 `'deepseek'@'127.0.0.1'`）；
- 应用服务器是否可以通过 `mysql -h <DB_HOST> -u <DB_USER> -p` 连上数据库。

#### 7.2 从外部访问

确保服务器安全组/防火墙已开放 3000 端口，然后在本地浏览器或终端访问：

```bash
curl http://<你的服务器IP>:3000/model_api/health
```

能正常返回 JSON 即表示对外可用。

---

### 8. 使用 Nginx 做反向代理（可选）

如需通过 80/443 端口 + 域名访问接口，可以在 Nginx 中配置反向代理，例如：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location /model_api/ {
        proxy_pass http://127.0.0.1:3000/model_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

修改完后：

```bash
nginx -t
sudo systemctl reload nginx
```

这样前端只需要访问 `http://api.yourdomain.com/model_api/...` 即可。

---

### 9. 常见问题

- **报错：`Access denied for user 'xxx'@'127.0.0.1'`**
  - 确认 `.env` 中 `DB_HOST` 是数据库真实地址；
  - 在 MySQL 中为该 IP 创建用户并授权，例如：

    ```sql
    CREATE USER 'deepseek'@'127.0.0.1' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON deepseek_club.* TO 'deepseek'@'127.0.0.1';
    FLUSH PRIVILEGES;
    ```

  - 修改 `.env` 为对应账号密码，重启服务。

- **health 接口正常，业务接口 500**
  - 查看 pm2 / 前台日志定位 SQL 或参数错误；
  - 核对数据库表结构是否完整，必要时重新执行 `db.sql` 或迁移脚本。

---

至此，项目在服务器上的部署与基本测试流程就完成了。根据你的实际情况（单机 MySQL 或 远程 RDS、是否有 Nginx/HTTPS）调整对应配置即可。

