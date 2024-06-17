const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cors = require('cors');
const {createEventAdapter} = require('@slack/events-api');

const createBasicRoles = require('./utils/createBasicRoles');

const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');

const app = express();
//development loging
// if (process.env.NODE_ENV === 'development') {
app.use(morgan('dev'));
// }

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 1000,
  message: 'Too many requests from this IP, please try again later'
});

app.use(cors());

// Body parser
app.use(express.json({limit: '10kb'}));

// Limit requests from same IP
app.use('/api', limiter);

// Serving static files
app.use(express.static(`${__dirname}/public`));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.all('*', (req, res, next) => {
  next(`Can't find ${req.originalUrl} on this server :#`, 404);
});

module.exports = app;
