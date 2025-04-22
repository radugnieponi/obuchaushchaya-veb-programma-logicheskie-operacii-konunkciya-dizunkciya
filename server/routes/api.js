const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { sql } = require('../db');
const { check, validationResult } = require('express-validator');

// Настройка хранилища для загружаемых файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Генерация токена
function generateToken(user) {
    return jwt.sign({ id: user.Id, role: user.Role }, 'your_secret_key', { expiresIn: '1h' });
}

// Логика авторизации
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await sql.query`SELECT * FROM Users WHERE Username = ${username}`;
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const passwordIsValid = bcrypt.compareSync(password, user.Password);

            if (passwordIsValid) {
                const token = generateToken(user);
                return res.json({ success: true, token, role: user.Role });
            }
        }
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Регистрация пользователя
router.post('/register', async (req, res) => {
    const { username, password, role, name, dob } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        await sql.query`INSERT INTO Users (Username, Password, Role, Name, DOB) VALUES (${username}, ${hashedPassword}, ${role}, ${name}, ${dob})`;
        res.json({ success: true, message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Загрузка домашнего задания
router.post('/upload-assignment', upload.single('assignmentFile'), (req, res) => {
    const assignmentFile = req.file;
    const title = req.body.title; // Название задания

    const filePath = `uploads/${assignmentFile.filename}`;
    
    sql.query`INSERT INTO Assignments (Title, FilePath) VALUES (${title}, ${filePath})`
        .then(() => {
            res.json({ success: true, message: 'Assignment uploaded successfully!' });
        })
        .catch(error => {
            res.status(500).json({ error: error.message });
        });
});

// Получение домашних заданий
router.get('/get-assignments', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Assignments`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создание теста
router.post('/create-test', async (req, res) => {
    const { question, answers, correctAnswers } = req.body; // ответы, правильные ответы
    try {
        await sql.query`INSERT INTO Tests (Question, Answers, CorrectAnswers) VALUES (${question}, ${JSON.stringify(answers)}, ${correctAnswers})`;
        res.json({ success: true, message: 'Test created successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение тестов
router.get('/get-tests', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Tests`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение вопросов теста
router.get('/start-test/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql.query`SELECT * FROM Tests WHERE Id = ${id}`;
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправка теста
router.post('/submit-test/:id', async (req, res) => {
    const { id } = req.params;
    const answers = req.body; // Ответы студента
    // Логика для проверки ответов
    res.json({ success: true, message: 'Test submitted!' });
});

// Выход
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
});

module.exports = router;