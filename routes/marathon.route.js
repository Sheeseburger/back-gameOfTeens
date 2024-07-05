const express = require('express');

const marathonController = require('../controllers/marathon.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
router.use(authController.protect);

router.route('/').get(marathonController.getAllMarathons);

router.get('/:id', marathonController.getMarathonById);

router.use(authController.allowedTo('admin'));
router.route('/').post(marathonController.createMarathon);

router.route('/:id').delete(marathonController.deleteMarathon);
router.route('/:id/block').post(marathonController.addBlockToMarathon);
router
  .route('/:id/block/:blockId')
  .get(marathonController.getProjectFromBlockById)
  .post(marathonController.createMarathon);

router
  .route('/:id/block/:blockId/team/:teamId')
  .get(marathonController.getProjectFromBlockByTeamId);
router
  .route('/:id/block/:blockId/project/:projectId')
  .get(marathonController.getProjectFromBlockById)
  .patch(marathonController.updateBlockProject);
module.exports = router;
