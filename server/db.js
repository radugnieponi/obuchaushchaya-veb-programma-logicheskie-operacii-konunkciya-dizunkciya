const sql = require('mssql');

const config = {
    user: 'learning_platform_user',   // Имя пользователя
    password: 'rootsroots',           // Пароль
    server: 'DESKTOP-T6ICRDK\\SQLEXPRESS', // Имя сервера SQL Server
    database: 'LearningPlatform',     // Название вашей базы данных
};

async function connect() {
    try {
        await sql.connect(config);
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed', err);
    }
}

module.exports = { connect, sql };