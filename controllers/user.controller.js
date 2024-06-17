const factory = require('./factory.controller');

const User = require('../models/user.model');

exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.deleteUser = factory.deleteOne(User);
