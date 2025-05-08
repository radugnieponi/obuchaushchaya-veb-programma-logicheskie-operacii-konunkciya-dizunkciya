const sql = require('mssql');
const dbConfig = require('../config/dbConfig');

// Создание преподавателя
const createTeacher = async (req, res) => {
  const { fullName, birthDate, subject } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('birthDate', sql.Date, birthDate)
      .input('subject', sql.NVarChar, subject)
      .query('INSERT INTO Teachers (FullName, BirthDate, Subject) OUTPUT INSERTED.ID VALUES (@fullName, @birthDate, @subject)');
    
    res.status(201).json({ id: result.recordset[0].ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Создание студента
const createStudent = async (req, res) => {
  const { fullName, birthDate } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('birthDate', sql.Date, birthDate)
      .query('INSERT INTO Students (FullName, BirthDate) OUTPUT INSERTED.ID VALUES (@fullName, @birthDate)');
    
    res.status(201).json({ id: result.recordset[0].ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Создание группы
const createGroup = async (req, res) => {
  const { studentIds } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Создаем группу
      const groupResult = await transaction.request()
        .query('INSERT INTO Groups DEFAULT VALUES; SELECT SCOPE_IDENTITY() AS GroupID');
      
      const groupId = groupResult.recordset[0].GroupID;
      
      // Добавляем студентов в группу
      for (const studentId of studentIds) {
        await transaction.request()
          .input('groupId', sql.Int, groupId)
          .input('studentId', sql.Int, studentId)
          .query('INSERT INTO GroupStudents (GroupID, StudentID) VALUES (@groupId, @studentId)');
      }
      
      await transaction.commit();
      res.status(201).json({ id: groupId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Создание предмета
const createSubject = async (req, res) => {
  const { name, teacherIds } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Создаем предмет
      const subjectResult = await transaction.request()
        .input('name', sql.NVarChar, name)
        .query('INSERT INTO Subjects (Name) OUTPUT INSERTED.ID VALUES (@name)');
      
      const subjectId = subjectResult.recordset[0].ID;
      
      // Добавляем преподавателей к предмету
      for (const teacherId of teacherIds) {
        await transaction.request()
          .input('subjectId', sql.Int, subjectId)
          .input('teacherId', sql.Int, teacherId)
          .query('INSERT INTO SubjectTeachers (SubjectID, TeacherID) VALUES (@subjectId, @teacherId)');
      }
      
      await transaction.commit();
      res.status(201).json({ id: subjectId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Создание учебного плана
const createStudyPlan = async (req, res) => {
  const { subjectTeachers } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    try {
      // Создаем учебный план
      const planResult = await transaction.request()
        .query('INSERT INTO StudyPlans DEFAULT VALUES; SELECT SCOPE_IDENTITY() AS PlanID');
      
      const planId = planResult.recordset[0].PlanID;
      
      // Добавляем предметы и преподавателей в план
      for (const st of subjectTeachers) {
        await transaction.request()
          .input('planId', sql.Int, planId)
          .input('subjectId', sql.Int, st.subjectId)
          .input('teacherId', sql.Int, st.teacherId)
          .query('INSERT INTO PlanDetails (PlanID, SubjectID, TeacherID) VALUES (@planId, @subjectId, @teacherId)');
      }
      
      await transaction.commit();
      res.status(201).json({ id: planId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Создание курса
const createCourse = async (req, res) => {
  const { name, groupId } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('groupId', sql.Int, groupId)
      .query('INSERT INTO Courses (Name, GroupID) OUTPUT INSERTED.ID VALUES (@name, @groupId)');
    
    res.status(201).json({ id: result.recordset[0].ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTeacher,
  createStudent,
  createGroup,
  createSubject,
  createStudyPlan,
  createCourse
};