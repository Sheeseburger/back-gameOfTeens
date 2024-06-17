const express = require('express');

const authController = require('../controllers/auth.controller');
const criteriaController = require('../controllers/criteria.controller');
const router = express.Router();

router.use(authController.protect);
router.route('/').get(criteriaController.getAllCriterias).post(criteriaController.createCriteria);
router.get('/:id', criteriaController.getCriteriaById);

// router.route('/').post(userController.createUser, authController.forgotPassword);

// router.route('/:id').delete(userController.deleteUser);

module.exports = router;
