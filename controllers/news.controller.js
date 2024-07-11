const factory = require('./factory.controller');

const News = require('../models/news.model');

exports.getAllNews = factory.getAll(News, [{path: 'marathon', select: '_id course'}]);

exports.createNews = factory.createOne(News);

exports.getNewsById = factory.getOne(News);

exports.deleteNews = factory.deleteOne(News);
