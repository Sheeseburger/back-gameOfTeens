const factory = require('./factory.controller');
const User = require('../models/user.model');

const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.createUser = catchAsync(async (req, res, next) => {
  const body = req.body;
  body.password = body.email.split('@')[0];
  const document = await User.create(body);

  sendEmail({
    email: body.email,
    subject: 'Game of Teens',
    html: `<h1>Your new credentials are:</h1><h3> email: ${body.email}</h3> <h3>password:${body.password}</h3> <a href="https://game-of-teens.netlify.app/">Link</a>`
  });

  res.status(201).json({
    status: 'success',
    data: document
  });
});
