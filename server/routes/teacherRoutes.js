const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/courses', authMiddleware, teacherController.getTeacherCourses);
router.post('/upload-homework', authMiddleware, teacherController.uploadHomework);
router.post('/create-test', authMiddleware, teacherController.createTest);

module.exports = router;