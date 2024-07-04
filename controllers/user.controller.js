const factory = require('./factory.controller');
const User = require('../models/user.model');
const Invintation = require('../models/invintation.model');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.subscribeUserToMarathon = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const marathonId = req.params.marathonId;

  const user = await User.findById(userId);
  user.subscribedTo.push(marathonId);

  await user.save();

  res.status(200).json({message: 'User subscribed to marathon successfully.', user});
});
exports.unSubscribeUserToMarathon = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const marathonId = req.params.marathonId;

  const user = await User.findById(userId);
  user.subscribedTo = user.subscribedTo.filter(sub => sub.toString() !== marathonId);

  await user.save();

  res.status(200).json({message: 'User unsubscribed from marathon successfully.', user});
});

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

exports.myInvites = catchAsync(async (req, res, next) => {
  const playerId = req.user._id;

  const invites = Invintation.find({player: playerId}).populate('team');
  const doc = await invites;
  res.status(200).json({status: 'success', data: doc});
});
