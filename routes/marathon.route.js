const express = require('express');

const marathonController = require('../controllers/marathon.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
router.use(authController.protect);
router.get('/block-project', marathonController.formBlockProjectData);
router.route('/').get(marathonController.getAllMarathons);

router.get('/:id', marathonController.getMarathonById);

router
  .route('/:id/block/:blockId/team/:teamId')
  .get(marathonController.getProjectFromBlockByTeamId);

router
  .route('/:marathonId/block/:blockId/projects/:projectId/messages')
  .get(marathonController.getAllMessages)
  .post(marathonController.sendMessage);

router
  .route('/:id/block/:blockId/projects/:projectId')
  .get(marathonController.getProjectFromBlockById)
  .post(marathonController.confirmProjectFromBlock)
  .patch(marathonController.updateBlockProject);
router
  .route('/:id/block/:blockId/projects')
  .post(marathonController.createProjectToBlock)
  .get(marathonController.getProjectsFromBlock);

router
  .route('/:id/block/:blockId')
  .get(marathonController.getProjectFromBlockById)
  .delete(marathonController.deleteBlockFromMarathon)
  .patch(marathonController.updateBlockInMarathon);
router.use(authController.allowedTo(['admin', 'mentor']));

router.route('/:id/block').post(marathonController.addBlockToMarathon);

router
  .route('/:id')
  .delete(marathonController.deleteMarathon)
  .patch(authController.allowedTo(['admin']), marathonController.addCriteriaOrJureToMarathon);
router.route('/').post(marathonController.createMarathon);
module.exports = router;
