const express = require('express');

const marathonController = require('../controllers/marathon.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
router.use(authController.protect);

router.route('/').get(marathonController.getAllMarathons);

router.get('/:id', marathonController.getMarathonById);

router
  .route('/:id/block/:blockId/team/:teamId')
  .get(marathonController.getProjectFromBlockByTeamId);

router
  .route('/:id/block/:blockId/projects/:projectId')
  .get(marathonController.getProjectFromBlockById)
  .patch(marathonController.updateBlockProject);
router.route('/:id/block/:blockId/projects').post(marathonController.createProjectToBlock);

router.route('/:id/block/:blockId').get(marathonController.getProjectFromBlockById);
router.use(authController.allowedTo(['admin', 'mentor']));

router.route('/:id/block').post(marathonController.addBlockToMarathon);
router.route('/:id').delete(marathonController.deleteMarathon);
router.route('/').post(marathonController.createMarathon);
module.exports = router;
