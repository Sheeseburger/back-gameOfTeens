const express = require('express');

const authController = require('../controllers/auth.controller');
const courseController = require('../controllers/course.controller');
const router = express.Router();

router.use(authController.protect);

router.route('/').get(courseController.getAllCourses).post(courseController.createCourse);

router.get('/:id', courseController.getCourseById);
module.exports = router;
