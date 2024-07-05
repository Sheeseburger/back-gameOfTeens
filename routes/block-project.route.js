const express = require('express');

const authController = require('../controllers/auth.controller');
const blockProjectController = require('../controllers/block-project.controller');
const router = express.Router();

router.use(authController.protect);
router
  .route('/')
  .get(blockProjectController.getAllBlockProjects)
  .post(blockProjectController.createBlockProject);
router.get('/:id', blockProjectController.getBlockProjectById);

module.exports = router;
