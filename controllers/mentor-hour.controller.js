const factory = require('./factory.controller');

const MentorHour = require('../models/mentor-hour.model');

exports.getAllMentorHours = factory.getAll(MentorHour, [{path: 'course'}]);

exports.createMentorHour = factory.createOne(MentorHour);

exports.getMentorHourById = factory.getOne(MentorHour);

exports.deleteMentorHour = factory.deleteOne(MentorHour);
