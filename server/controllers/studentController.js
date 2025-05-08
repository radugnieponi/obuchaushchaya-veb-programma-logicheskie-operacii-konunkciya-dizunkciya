const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/dbConfig');
const { uploadsDir } = require('../config/fileConfig');
const PDFDocument = require('pdfkit');

const getStudentGroup = async (req, res) => {
  const { studentId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .query(`
        SELECT g.ID, g.Name
        FROM Groups g
        JOIN GroupStudents gs ON g.ID = gs.GroupID
        WHERE gs.StudentID = @studentId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Student group not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGroupSubjects = async (req, res) => {
  const { groupId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT DISTINCT s.ID, s.Name
        FROM Subjects s
        JOIN PlanDetails pd ON s.ID = pd.SubjectID
        JOIN StudyPlans sp ON pd.PlanID = sp.ID
        JOIN Courses c ON c.GroupID = @groupId
        WHERE EXISTS (
          SELECT 1 FROM PlanDetails 
          WHERE PlanID = sp.ID AND SubjectID = s.ID
        )
        ORDER BY s.Name
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHomeworks = async (req, res) => {
  const { subjectId, groupId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('subjectId', sql.Int, subjectId)
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT h.ID, h.Title, h.Description, h.FilePath, h.UploadDate, t.FullName AS TeacherName
        FROM Homeworks h
        JOIN Courses c ON h.CourseID = c.ID
        JOIN Teachers t ON h.TeacherID = t.ID
        JOIN PlanDetails pd ON pd.SubjectID = @subjectId AND pd.TeacherID = t.ID
        WHERE c.GroupID = @groupId
        ORDER BY h.UploadDate DESC
      `);
    
    // Преобразуем пути к файлам в URL для скачивания
    const homeworks = result.recordset.map(hw => ({
      ...hw,
      downloadUrl: `/api/student/download?filePath=${encodeURIComponent(hw.FilePath)}`
    }));
    
    res.status(200).json(homeworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTests = async (req, res) => {
  const { subjectId, groupId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('subjectId', sql.Int, subjectId)
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT t.ID, t.Title, t.Description, t.CreationDate, te.FullName AS TeacherName
        FROM Tests t
        JOIN Courses c ON t.CourseID = c.ID
        JOIN Teachers te ON t.TeacherID = te.ID
        JOIN PlanDetails pd ON pd.SubjectID = @subjectId AND pd.TeacherID = te.ID
        WHERE c.GroupID = @groupId
        ORDER BY t.CreationDate DESC
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadFile = async (req, res) => {
  const { filePath } = req.query;
  
  try {
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Определяем имя файла для скачивания
    const fileName = path.basename(filePath);
    
    // Отправляем файл
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const downloadTest = async (req, res) => {
  const { testId } = req.query;
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Получаем информацию о тесте
    const testResult = await pool.request()
      .input('testId', sql.Int, testId)
      .query(`
        SELECT t.Title, t.Description, t.CreationDate, te.FullName AS TeacherName
        FROM Tests t
        JOIN Teachers te ON t.TeacherID = te.ID
        WHERE t.ID = @testId
      `);
    
    if (testResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    const testInfo = testResult.recordset[0];
    
    // Получаем вопросы теста
    const questionsResult = await pool.request()
      .input('testId', sql.Int, testId)
      .query(`
        SELECT QuestionText, Answer1, Answer2, Answer3, Answer4, CorrectAnswers
        FROM TestQuestions
        WHERE TestID = @testId
        ORDER BY ID
      `);
    
    const questions = questionsResult.recordset;
    
    // Создаем PDF документ
    const doc = new PDFDocument();
    const fileName = `test_${testId}.pdf`;
    
    // Устанавливаем заголовки для скачивания
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Пишем PDF в response
    doc.pipe(res);
    
    // Заголовок теста
    doc.fontSize(20).text(testInfo.Title, { align: 'center' });
    doc.moveDown();
    
    // Информация о тесте
    doc.fontSize(12).text(`Преподаватель: ${testInfo.TeacherName}`);
    doc.text(`Дата создания: ${new Date(testInfo.CreationDate).toLocaleDateString()}`);
    doc.moveDown();
    
    // Описание теста
    if (testInfo.Description) {
      doc.fontSize(14).text('Описание:', { underline: true });
      doc.fontSize(12).text(testInfo.Description);
      doc.moveDown();
    }
    
    // Вопросы теста
    doc.fontSize(16).text('Вопросы:', { underline: true });
    doc.moveDown();
    
    questions.forEach((question, index) => {
      doc.fontSize(14).text(`${index + 1}. ${question.QuestionText}`);
      doc.moveDown(0.5);
      
      doc.fontSize(12).text(`a) ${question.Answer1}`);
      doc.text(`b) ${question.Answer2}`);
      doc.text(`c) ${question.Answer3}`);
      doc.text(`d) ${question.Answer4}`);
      doc.moveDown(0.5);
      
      doc.fontSize(12).text(`Правильные ответы: ${question.CorrectAnswers.split(' ').map(n => ['a', 'b', 'c', 'd'][n-1]).join(', ')}`);
      doc.moveDown();
    });
    
    // Завершаем документ
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating test PDF' });
  }
};

module.exports = {
  getStudentGroup,
  getGroupSubjects,
  getHomeworks,
  getTests,
  downloadFile,
  downloadTest
};