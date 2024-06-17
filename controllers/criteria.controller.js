const factory = require('./factory.controller');

const Criteria = require('../models/criteria.model');

exports.getAllCriterias = factory.getAll(Criteria);

exports.createCriteria = factory.createOne(Criteria);

exports.getCriteriaById = factory.getOne(Criteria);

exports.deleteCriteria = factory.deleteOne(Criteria);
