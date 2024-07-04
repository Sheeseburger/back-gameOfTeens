const express = require('express');

const teamController = require('../controllers/team.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
router.use(authController.protect);

router.route('/').get(teamController.getAllTeams).post(teamController.createTeam);

router.route('/:id').delete(teamController.destroyTeam);

router
  .route('/:id/invite')
  .get(teamController.getAllInvites)
  .post(teamController.invitePlayer)
  .patch(teamController.acceptInvite)
  .delete(teamController.declineInvite);

router.delete('/:id/remove-player', teamController.removePlayer);

module.exports = router;
