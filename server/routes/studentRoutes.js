const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/group', authMiddleware, studentController.getStudentGroup);
router.get('/subjects', authMiddleware, studentController.getGroupSubjects);
router.get('/homeworks', authMiddleware, studentController.getHomeworks);
router.get('/tests', authMiddleware, studentController.getTests);
router.get('/download', authMiddleware, studentController.downloadFile);
router.get('/download-test', authMiddleware, studentController.downloadTest);

module.exports = router;