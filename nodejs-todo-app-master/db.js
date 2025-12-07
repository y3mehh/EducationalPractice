const mysql = require('mysql2/promise');
async function initDB() {
    const connection = await mysql.createConnection({ 
        host: 'localhost', 
        user: 'root', 
        password: 'root' 
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS todo_app`);
    await connection.query(`USE todo_app`);
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id_user INT AUTO_INCREMENT PRIMARY KEY,
            login VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        ) 
    `);
    await connection.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id_todo INT AUTO_INCREMENT PRIMARY KEY,
            item TEXT NOT NULL,
            user_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
        ) 
    `);
    return connection;
}
module.exports = initDB;
