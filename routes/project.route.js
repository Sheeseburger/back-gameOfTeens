const express = require('express');

const authController = require('../controllers/auth.controller');
const projectController = require('../controllers/project.controller');

const router = express.Router();
router
  .route('/excel')
  .get(projectController.getProjectsWithLinks)
  .post(projectController.fillSpreadsheet);

router.use(authController.protect);
router.route('/').get(projectController.getAllProjects).post(projectController.createFullProject);
router.route('/:courseId').get(projectController.getAllProjects);

router.post('/:id/jures', projectController.addJureToProject);
router.post('/confirm', projectController.confirmJureDecision);
router.patch('/:projectId', projectController.patchJuryDecision);
// router.route('/').post(userController.createUser, authController.forgotPassword);

// router.route('/:id').delete(userController.deleteUser);

module.exports = router;
