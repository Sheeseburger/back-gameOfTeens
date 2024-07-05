const factory = require('./factory.controller');

const BlockProject = require('../models/block-project.model');

exports.getAllBlockProjects = factory.getAll(BlockProject);

exports.createBlockProject = factory.createOne(BlockProject);

exports.getBlockProjectById = factory.getOne(BlockProject);

exports.deleteBlockProject = factory.deleteOne(BlockProject);
