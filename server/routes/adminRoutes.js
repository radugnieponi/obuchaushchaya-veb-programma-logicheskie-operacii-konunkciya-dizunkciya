const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Получение списков
router.get('/students', authMiddleware, adminController.getStudents);
router.get('/teachers', authMiddleware, adminController.getTeachers);
router.get('/subjects', authMiddleware, adminController.getSubjects);
router.get('/groups', authMiddleware, adminController.getGroups);

// Создание сущностей
router.post('/create-teacher', authMiddleware, adminController.createTeacher);
router.post('/create-student', authMiddleware, adminController.createStudent);
router.post('/create-group', authMiddleware, adminController.createGroup);
router.post('/create-subject', authMiddleware, adminController.createSubject);
router.post('/create-study-plan', authMiddleware, adminController.createStudyPlan);
router.post('/create-course', authMiddleware, adminController.createCourse);

module.exports = router;