const express = require('express');

const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const slotController = require('../controllers/slot.controller');
const whereClauseGenerator = require('../utils/whereClauseGenerator');

const router = express.Router();
router.route('/addCoursesToUsersBulk').post(userController.addCoursesToUsersBulk);
router.route('/sendEmailBulk').post(userController.sendEmailsBulk);
router.route('/telegram').patch(userController.updateTelegramChatId);

router.route('/').get(whereClauseGenerator, userController.getAllUsers);
router.use(authController.protect);
router.route('/:id/courses').get(userController.getUserCourses);
router
  .route('/:id/courses/:course_id')
  .post(userController.addUserCourse)
  .delete(userController.deleteUserCourse)
  .patch(userController.updateUserCourse);
router.get('/:id', userController.getUserById);
router
  .route('/:id/slots')
  .get(whereClauseGenerator, slotController.getAllSlots)
  .post(slotController.createUserSlot)
  .delete(slotController.deleteSlots);

router.route('/available-teachers/:weekDay/:courseId').get(userController.getFreeUsers);
router
  .route('/:id/slots/:slotId')
  .patch(slotController.updateSlot)
  .delete(slotController.deleteSlot);

router.route('/:id').patch(authController.mySelfOrAdmin, userController.updateUser);

router.use(authController.allowedTo(['administrator', 'superAdmin']));

router
  .route('/')
  // .get(whereClauseGenerator, userController.getAllUsers)
  .post(userController.createUser, authController.forgotPassword);

router
  .route('/:id')

  .delete(userController.deleteUser);

router
  .route('/:subGroupId/mentorsForReplacement')
  .get(userController.getUsersForReplacementSubGroup);
module.exports = router;
