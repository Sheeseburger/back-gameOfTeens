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
module.exports = router;
