const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const apiRoutes = require('./routes/api');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 1433;
const fileUpload = require('express-fileupload');

const createAdminUser = async () => {
    const result = await sql.query`SELECT * FROM Users WHERE Username = 'admin'`;
    if (result.recordset.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin', 10);
        await sql.query`INSERT INTO Users (Username, Password, Role) VALUES ('admin', ${hashedPassword}, 'admin')`;
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists.');
    }
};

app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api', apiRoutes);

// Обработка маршрутов
app.get('/admin', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, '../client/admin.html'));
    } else {
        res.redirect('/index.html');
    }
});

app.get('/teacher', (req, res) => {
    if (req.session.user && req.session.user.role === 'teacher') {
        res.sendFile(path.join(__dirname, '../client/teacher.html'));
    } else {
        res.redirect('/index.html');
    }
});

app.get('/student', (req, res) => {
    if (req.session.user && req.session.user.role === 'student') {
        res.sendFile(path.join(__dirname, '../client/student.html'));
    } else {
        res.redirect('/index.html');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

router.post('/upload-assignment', (req, res) => {
    const assignmentFile = req.files.assignmentFile;
    const uploadPath = `uploads/${assignmentFile.name}`;

    assignmentFile.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Добавьте логику для сохранения в базе данных
        res.json({ success: true, message: 'Файл успешно загружен' });
    });
});