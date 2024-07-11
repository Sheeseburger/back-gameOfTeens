const express = require('express');

const authController = require('../controllers/auth.controller');
const newsController = require('../controllers/news.controller');

const router = express.Router();

router.use(authController.protect);

router.route('/').get(newsController.getAllNews).post(newsController.createNews);
router.get('/:id', newsController.getNewsById);

module.exports = router;
