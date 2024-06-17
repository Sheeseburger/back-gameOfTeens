const {Op, Sequelize} = require('sequelize');
const jwt = require('jsonwebtoken');
const {format} = require('date-fns');

const {User, Course, Slot, TeacherCourse, TeacherType, Role} = require('../models/relation');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory.controller');
const sequelize = require('../db');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  let document;
  let attributes = {exclude: ['password']};

  if (req.query.sortBySubgroups)
    // contains soft-tech
    attributes.include = [
      [
        Sequelize.literal(
          `(SELECT COUNT(*) FROM "SubgroupMentors" WHERE "SubgroupMentors"."mentorId" = "User"."id")`
        ),
        'subgroupCount'
      ]
    ];

  let includeOptions = [];
  if (req.query.onlyIndiv) {
    includeOptions.push({
      model: Slot,
      attributes: [],
      where: {appointmentTypeId: 2}, // indiv
      required: true // This will ensure that only users with slots are included
    });
  }
  if (req.query.courses) {
    // case of filtering users by courses
    const courseIds = JSON.parse(req.query.courses);
    includeOptions.push({
      model: Course,
      as: 'teachingCourses',
      where: courseIds.length > 0 ? {id: {[Op.in]: courseIds}} : {}
    });
  }
  document = await User.findAll({
    subQuery: false,
    where: req.whereClause,
    attributes,
    include: includeOptions,
    order: req.query.sortBySubgroups
      ? [
          [Sequelize.literal('"subgroupCount"'), 'ASC'],
          ['rating', 'DESC']
        ]
      : [['rating', 'DESC']],
    offset: req.query.offset,
    limit: req.query.limit
  });
  totalCount = await User.count({
    include: [...includeOptions, {model: Role, required: false}],
    where: req.whereClause,
    attributes
  });

  return res.json({
    status: 'success',
    results: document.length,
    data: document,
    totalCount,
    newOffset: +req.query.offset + +req.query.limit
  });
});

exports.getUserById = factory.getOne(User);

exports.createUser = catchAsync(async (req, res, next) => {
  req.body.password = (Math.random() + 1).toString(36).substring(7); // for preventing user to login in system without password
  const document = await User.create(req.body);
  req.User = document;
  next(); // next leads to reset password user goes to his/her email and only than can be logged in to the system
});

exports.deleteUser = factory.deleteOne(User);

exports.updateUser = catchAsync(async (req, res, next) => {
  let id = req.params.id;

  const body = req.body;
  delete body.password;
  let updatedDoc = await User.update(body, {where: {id}});

  res.json({
    data: updatedDoc
  });
});

exports.getUserCourses = catchAsync(async (req, res, next) => {
  const courses = await TeacherCourse.findAll({
    where: {userId: req.params.id},
    include: [
      {
        model: TeacherType
      }
    ]
  });

  res.json({
    status: 'success',
    data: courses
  });
});

exports.addUserCourse = catchAsync(async (req, res, next) => {
  const newTeacherCourse = await TeacherCourse.create(
    {userId: req.params.id, courseId: req.params.course_id},
    {include: TeacherType}
  );
  await newTeacherCourse.reload();
  res.json({
    status: 'success',
    data: newTeacherCourse
  });
});

exports.deleteUserCourse = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(400).json({
      message: 'Cant find user'
    });
  }

  const courses = await Course.findByPk(req.params.course_id);

  await user.removeTeachingCourse(courses);

  res.status(204).json();
});
exports.updateUserCourse = catchAsync(async (req, res, next) => {
  const teacherCourse = await TeacherCourse.update(req.body, {
    where: {courseId: req.params.course_id, userId: req.params.id}
  });
  res.status(201).json(teacherCourse);
});

exports.getFreeUsers = catchAsync(async (req, res, next) => {
  const users = await TeacherCourse.findAll({
    where: {courseId: req.params.courseId}
  });
  const usersId = users.map(el => el.userId);
  const availableSlots = await Slot.findAll({
    where: {
      weekDay: req.params.weekDay,
      '$AppointmentType.name$': 'universal'
    },
    include: {
      model: User,
      where: {id: {[Op.in]: usersId}},
      attributes: ['id', 'name']
    },
    attributes: ['time']
  });
  res.json({availableSlots});
});

exports.getUsersForReplacementSubGroup = catchAsync(async (req, res, next) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const mentorCurrentSlots = await sequelize.query(
    `SELECT "Slots"."weekDay", "Slots"."time","Slots"."userId", "Slots"."startDate","Slots"."endDate" FROM "Slots"
    WHERE "Slots"."SubGroupId" = :SubGroupId`,
    {
      replacements: {SubGroupId: req.params.subGroupId},
      type: Sequelize.QueryTypes.SELECT
    }
  );
  const startCursor =
    today > mentorCurrentSlots[0].startDate ? today : mentorCurrentSlots[0].startDate;
  const allUsers = await User.findAll({
    where: {id: {[Op.ne]: mentorCurrentSlots[0].userId}},
    attributes: ['name', 'id'],
    include: [
      {
        association: 'teachingCourses',
        where: {id: req.query.courseId},

        attributes: []
      },
      {
        model: Slot,

        where: {
          weekDay: {[Op.in]: mentorCurrentSlots.map(slot => slot.weekDay)},
          time: {[Op.in]: mentorCurrentSlots.map(slot => slot.time)},
          startDate: {[Op.lte]: startCursor},
          endDate: {[Op.or]: [{[Op.gte]: mentorCurrentSlots[0].endDate}, {[Op.eq]: null}]}
        }

        // group here
      }
    ]
  });
  const structuredSlots = allUsers.map(user => {
    const structuredUser = {
      name: user.name,
      id: user.id,
      Role: user.Role,
      Slots: {}
    };

    user.Slots.forEach(slot => {
      if (!structuredUser.Slots[slot.weekDay]) {
        structuredUser.Slots[slot.weekDay] = [];
      }

      structuredUser.Slots[slot.weekDay].push({
        id: slot.id,
        time: slot.time,
        startDate: slot.startDate,
        endDate: slot.endDate,
        appointmentTypeId: slot.appointmentTypeId,
        userId: slot.userId,
        SubGroupId: slot.SubGroupId,
        ReplacementId: slot.ReplacementId
      });
    });

    return structuredUser;
  });

  res.status(200).json({data: allUsers, structuredSlots});
});

exports.addCoursesToUsersBulk = catchAsync(async (req, res, next) => {
  const users = req.body.users;

  users.forEach(async user => {
    const id = await User.findOne({where: {email: user}});
    const userCourse = await TeacherCourse.findOrCreate({
      where: {
        userId: id.id,
        courseId: 139,
        TeacherTypeId: 3
      },
      defaults: {
        userId: id.id,
        courseId: 139,
        TeacherTypeId: 3
      }
    });
  });
  res.status(201).json({message: 'created!'});
});

const sendEmail = require('../utils/email');

exports.sendEmailsBulk = catchAsync(async (req, res, next) => {
  const emails = req.body.emails;

  for (let i = 0; i < emails.length; i++) {
    const em = emails[i];

    // Wrapping the email sending process in a setTimeout to delay each email by 1 second
    await new Promise(resolve =>
      setTimeout(async () => {
        const resetToken = jwt.sign({email: em}, process.env.JWT_SECRET, {
          expiresIn: '7d'
        });
        const resetURL = `${
          // process.env.NODE_ENV === 'DEV' ? process.env.LOCAL_FRONT :
          process.env.DEPLOYED_FRONT
        }/resetPassword/${resetToken}`;

        const message = `Forgot password? Submit a patch request with your new password and password confirm to: ${resetURL}`;
        const html = `<h1>Forgot password?</h1><a href="${resetURL}"><button>Click here</button></a>`;

        await sendEmail({
          email: em,
          subject: 'Reset token (7 days)',
          message,
          html
        });

        resolve();
      }, i * 100)
    ); // Delay of i * 1000 milliseconds (1 second per email)
  }

  // Send response after all emails have been sent
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
    data: req?.User
  });
});

exports.updateTelegramChatId = catchAsync(async (req, res, next) => {
  const doc = await User.update(
    {telegramChatId: req.body.telegramChatId},
    {where: {email: req.body.email}}
  );
  if (doc) {
    res.status(200).json({
      status: 'success',
      message: 'Updated!',
      data: doc
    });
  }
});
