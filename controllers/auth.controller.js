const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const {promisify} = require('util');

const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const timeLeftTillMorning = () => {
  const nowInKiev = moment().tz('Europe/Kiev');
  const expiryTime = nowInKiev.clone().add(1, 'days').startOf('day').hour(8);

  return expiryTime.diff(nowInKiev, 'seconds');
};

const signToken = user => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      roleName: user.role,
      role: user.role === 'admin' ? 1 : user.role === 'jury' ? 0 : user.role === 'player' ? 2 : 3,
      subscribedTo: user.role === 'player' ? user.subscribedTo : null
    },
    process.env.JWT_SECRET
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);
  const cookieOptions = {
    httpOnly: true
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and/or password'), 400);
  }

  const user = await User.findOne({email}).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password'), 401);
  }
  createSendToken(user, 200, res);
});
exports.register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role
  });
  createSendToken(newUser, 201, res);
});
exports.logout = (req, res) => {
  try {
    res.clearCookie('jwt');
    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'something went wrong'
    });
  }
};

exports.protect = catchAsync(async (req, res, next) => {
  if (req.headers.mic) next();
  else {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next('You are not logged in bro :(');
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const freshUser = await User.findById(decoded.id, {});

    if (!freshUser) return next('This user was deleted');

    // Access to protected route
    req.user = freshUser;
    next();
  }
});
exports.mySelfOrAdmin = catchAsync(async (req, res, next) => {
  if (req.user.Role.name !== 'teacher' || req.user.id === req.body.id) {
    next();
  } else return next(`You dont have permision :(`);
});
exports.allowedTo = roles => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next('You dont have permision :(');
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // req.user.email came from creating user
  // generate random reset token
  const email = req.body.email;
  const resetToken = jwt.sign({email}, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

  //send email
  const resetURL = `${
    process.env.NODE_ENV === 'DEV' ? process.env.LOCAL_FRONT : process.env.DEPLOYED_FRONT
  }/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a patch request with youer new password and password confirm to: ${resetURL}`; // !!! WRITE SOMETHING MORE COOL
  const html = `<h1>Forgot password?</h1><a href="${resetURL}"><button>Click here</button></a>`;
  try {
    await sendEmail({
      email,
      subject: 'Reset token (24 hours)',
      message,
      html
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      data: req?.User
    });
  } catch (error) {
    res.status(400).json({
      message: 'something went wrong',
      error
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on token
  if (!req.params.token) return res.status(400).json({message: 'Where is token?'});
  const decoded = await promisify(jwt.verify)(req.params.token, process.env.JWT_SECRET);

  const user = await User.findOne({where: {email: decoded.email}});
  if (!user) {
    res.status(400).json({message: 'Something wrong with token'});
  }
  // if token !expired, and is user, set new password
  user.password = req.body.password;
  await user.save();

  createSendToken(user, 201, res);
});
