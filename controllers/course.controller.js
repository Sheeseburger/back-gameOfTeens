const factory = require('./factory.controller');

const Course = require('../models/course.model');

exports.getAllCourses = factory.getAll(Course);

exports.getCourseById = factory.getOne(Course);

exports.deleteCourse = factory.deleteOne(Course);

exports.createCourse = factory.createOne(Course);
