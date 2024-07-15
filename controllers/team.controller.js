const factory = require('./factory.controller');
const mongoose = require('mongoose');
const Team = require('../models/team.model');
const Invitation = require('../models/invintation.model');
const catchAsync = require('../utils/catchAsync');
exports.getAllTeams = factory.getAll(Team);

exports.createTeam = catchAsync(async (req, res, next) => {
  const {leader, marathon} = req.body;

  const team = new Team({leader, marathon, members: [leader]});
  await team.save();

  const result = await Invitation.deleteMany({
    player: new mongoose.Types.ObjectId(leader),
    marathon: new mongoose.Types.ObjectId(marathon)
  });
  res.status(201).json({message: 'Team created successfully.', team});
});

exports.invitePlayer = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const playerId = req.body.playerId;
  const marathonId = req.body.marathonId;
  const playerAsLeader = await Team.findOne({members: {$in: [playerId]}, marathon: marathonId});
  if (playerAsLeader) {
    return res.status(400).json({message: 'Sorry, this player is already a team member'});
  }
  const existingInvitation = await Invitation.findOne({
    team: teamId,
    player: playerId,
    marathon: marathonId
  });
  if (existingInvitation) {
    return res.status(400).json({message: 'Invitation already sent to this player.'});
  }
  const invitation = new Invitation({team: teamId, player: playerId, marathon: marathonId});
  await invitation.save();

  await invitation.populate('player');
  res.status(200).json({message: 'Invitation sent successfully.', invitation});
});

exports.getAllInvites = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const invites = Invitation.find({team: teamId}).populate('player');
  const doc = await invites;
  res.status(200).json(doc);
});

exports.removePlayer = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const playerId = req.body.playerId;

  const team = await Team.findById(teamId);
  team.members = team.members.filter(member => member._id.toString() !== playerId);
  console.log(team.members);

  await team.save();

  res.status(200).json({message: 'Player removed from team successfully.', team});
});

exports.destroyTeam = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const team = await Team.findById(teamId);
  if (team.leader._id.toString() !== req.user._id.toString()) {
    return res.status(400).json({message: 'Only leader can destroy team'});
  }
  await Team.deleteOne({_id: teamId});

  res.status(200).json({message: 'Team deleted successfully.'});
});
exports.acceptInvite = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const playerId = req.body.playerId;
  const marathon = req.body.marathon;
  const result = await Invitation.deleteMany({
    player: new mongoose.Types.ObjectId(playerId),
    marathon: new mongoose.Types.ObjectId(marathon)
  });
  console.log(result);
  console.log({
    player: new mongoose.Types.ObjectId(playerId),
    marathon: new mongoose.Types.ObjectId(marathon)
  });
  const team = await Team.findById(teamId);
  team.members.push(playerId);
  await team.save();

  res.status(200).json({message: 'Invitation accepted successfully.', team});
});

exports.declineInvite = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const inviteId = req.body.id;
  console.log({team: teamId, player: req.user._id, _id: inviteId});
  try {
    // Пошук запрошення
    const invitation = await Invitation.deleteOne({
      team: teamId,
      player: req.user._id,
      _id: inviteId
    });

    res.status(200).json({message: 'Invitation declined successfully.'});
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({message: 'Internal server error.'});
  }
});
