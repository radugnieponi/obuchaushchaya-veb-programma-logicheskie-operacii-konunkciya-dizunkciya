const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/dbConfig');
const { uploadsDir } = require('../config/fileConfig');

const getTeacherCourses = async (req, res) => {
  const { teacherId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('teacherId', sql.Int, teacherId)
      .query(`
        SELECT c.ID, c.Name, g.ID AS GroupID, g.Name AS GroupName
        FROM Courses c
        JOIN Groups g ON c.GroupID = g.ID
        JOIN PlanDetails pd ON pd.PlanID = (
          SELECT TOP 1 PlanID FROM PlanDetails WHERE TeacherID = @teacherId
        )
        WHERE pd.TeacherID = @teacherId
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadHomework = async (req, res) => {
  const { title, description, courseId, teacherId } = req.body;
  const file = req.files.file;
  
  try {
    // Создаем директорию для загрузок, если ее нет
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Генерируем уникальное имя файла
    const fileExt = path.extname(file.name);
    const fileName = `hw_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Сохраняем файл
    await file.mv(filePath);
    
    // Сохраняем информацию в БД
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('courseId', sql.Int, courseId)
      .input('teacherId', sql.Int, teacherId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || '')
      .input('filePath', sql.NVarChar, filePath)
      .query(`
        INSERT INTO Homeworks (CourseID, TeacherID, Title, Description, FilePath)
        VALUES (@courseId, @teacherId, @title, @description, @filePath)
      `);
    
    res.status(201).json({ message: 'Homework uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload homework' });
  }
};

const createTest = async (req, res) => {
  const { title, description, courseId, teacherId, questions } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Создаем тест
      const testResult = await transaction.request()
        .input('courseId', sql.Int, courseId)
        .input('teacherId', sql.Int, teacherId)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || '')
        .query(`
          INSERT INTO Tests (CourseID, TeacherID, Title, Description)
          OUTPUT INSERTED.ID
          VALUES (@courseId, @teacherId, @title, @description)
        `);
      
      const testId = testResult.recordset[0].ID;
      
      // Добавляем вопросы
      for (const question of questions) {
        await transaction.request()
          .input('testId', sql.Int, testId)
          .input('questionText', sql.NVarChar, question.questionText)
          .input('answer1', sql.NVarChar, question.answers[0])
          .input('answer2', sql.NVarChar, question.answers[1])
          .input('answer3', sql.NVarChar, question.answers[2])
          .input('answer4', sql.NVarChar, question.answers[3])
          .input('correctAnswers', sql.NVarChar, question.correctAnswers)
          .query(`
            INSERT INTO TestQuestions (TestID, QuestionText, Answer1, Answer2, Answer3, Answer4, CorrectAnswers)
            VALUES (@testId, @questionText, @answer1, @answer2, @answer3, @answer4, @correctAnswers)
          `);
      }
      
      await transaction.commit();
      res.status(201).json({ message: 'Test created successfully', testId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create test' });
  }
};

module.exports = {
  getTeacherCourses,
  uploadHomework,
  createTest
};