const factory = require('./factory.controller');
const User = require('../models/user.model');
const Invintation = require('../models/invintation.model');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const loginToSheet = require('../utils/sheets/loginToSheet');
const Marathon = require('../models/marathon.model');

exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.updateUser = factory.updateOne(User);
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
  const marathon = req.params.marathonId;
  const invites = Invintation.find({player: playerId, marathon}).populate('team');
  const doc = await invites;
  res.status(200).json({status: 'success', data: doc});
});

exports.createStatistisc = async (req, res) => {
  try {
    // Авторизация в Google Sheets
    const sheets = loginToSheet();
    const sheetId = '12nIQaMrfIOZG8m-tVOECkETbFWj0IFoww7wlo9Y-OvU';

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: 'Players!A1:Z',
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: 'AllTeams!A1:Z',
    });

    // Получаем данные для заполнения листа "players"
    const users = await User.find().where('role').eq('player').populate('subscribedTo');

    // Формируем данные для листа "players"
    const playersData = users.map(user => ({
      name: user.name,
      email: user.email,
      subscribedTo: user.subscribedTo.map(marathon => marathon.name).join(', '),
      createdAt: user?.createdAt
    }));
    // Записываем данные в лист "players"
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Players!A1', // Диапазон, куда будут записаны данные (первая строка)
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Name', 'Email', 'Subscribed To', 'created at'], // Заголовки столбцов
          ...playersData.map(player => [
            player.name,
            player.email,
            player.subscribedTo,
            player.createdAt
          ])
        ]
      }
    });

    const marathons = await Marathon.find().populate('blocks.projects.team');
    console.log(marathons[0].blocks[0].projects);
    // Формируем данные для листа "all teams"
    const teamsData = [];
    marathons.forEach(marathon => {
      marathon.blocks.forEach(block => {
        block.projects.forEach(project => {
          teamsData.push({
            leaderEmail: project.team?.leader?.email,
            marathonName: marathon.name,
            teamStatus: project.confirm ? 'Confirmed' : 'In progress',
            teamMembers: (project?.team?.members || []).map(member => member.email).join(', ')
          });
        });
      });
    });

    // Записываем данные в лист "all teams"
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'AllTeams!A1', // Диапазон, куда будут записаны данные (первая строка)
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Leader Email', 'Marathon Name', 'Team Status', 'Team Members'], // Заголовки столбцов
          ...teamsData.map(team => [
            team.leaderEmail,
            team.marathonName,
            team.teamStatus,
            team.teamMembers
          ])
        ]
      }
    });

    res.status(200).json({message: 'Sheets created successfully'});
  } catch (error) {
    console.error('Error creating sheets:', error);
    res.status(500).json({error: 'Failed to create sheets'});
  }
};
