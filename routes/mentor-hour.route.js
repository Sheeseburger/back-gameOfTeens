const express = require('express');

const authController = require('../controllers/auth.controller');
const mentorHourController = require('../controllers/mentor-hour.controller');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(mentorHourController.getAllMentorHours)
  .post(mentorHourController.createMentorHour);
router.get('/:id', mentorHourController.getMentorHourById);

module.exports = router;
