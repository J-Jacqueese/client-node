const mysql = require('mysql2');
const dbConfig = require('../config/db.config');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 使用 Promise 封装
const promisePool = pool.promise();

module.exports = promisePool;
