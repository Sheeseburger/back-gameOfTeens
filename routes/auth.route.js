const express = require('express');

const authController = require('../controllers/auth.controller');
const router = express.Router();
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get(
  '/roles-check',
  authController.protect,
  authController.allowedTo(['teacher']),
  (req, res, next) => {
    res.json({message: 'can do it!'});
  }
);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

module.exports = router;
