const express = require('express');

const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.route('/').get(userController.getAllUsers);

router.use(authController.protect);

router.get('/:id', userController.getUserById);

router.route('/').post(userController.createUser);

router.route('/:id').delete(userController.deleteUser);

module.exports = router;
