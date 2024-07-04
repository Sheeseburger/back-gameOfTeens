const factory = require('./factory.controller');

const Team = require('../models/team.model');
const Invitation = require('../models/invintation.model');
const catchAsync = require('../utils/catchAsync');
exports.getAllTeams = factory.getAll(Team);

exports.createTeam = catchAsync(async (req, res, next) => {
  const {leader, marathon} = req.body;

  const team = new Team({leader, marathon, members: [leader]});
  await team.save();

  res.status(201).json({message: 'Team created successfully.', team});
});

exports.invitePlayer = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const playerId = req.body.playerId;
  const marathonId = req.body.marathonId;
  const playerAsLeader = await Team.findOne({leader: playerId});
  if (playerAsLeader) {
    res.status(400).json({message: 'Sorry, this player is already a team leader'});
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
  const teamId = req.params.teamId;
  const playerId = req.body.playerId;

  const team = await Team.findById(teamId);
  team.members = team.members.filter(member => member.toString() !== playerId);

  await team.save();

  res.status(200).json({message: 'Player removed from team successfully.', team});
});

exports.destroyTeam = catchAsync(async (req, res, next) => {
  const teamId = req.params.teamId;
  const team = await Team.findById(teamId);
  if (team.leader !== req.user._id) {
    return res.status(401).json({message: 'Only leader can destroy team'});
  }
  await team.remove();
  res.status(200).json({message: 'Team deleted successfully.'});
});
exports.acceptInvite = catchAsync(async (req, res, next) => {
  const teamId = req.params.id;
  const playerId = req.user._id;
  const marathon = req.body.marathon;
  const result = await Invitation.deleteMany({
    player: playerId,
    marathon: marathon
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
    const invitation = await Invitation.findOne({
      team: teamId,
      player: req.user._id,
      _id: inviteId
    });

    await invitation.remove();

    res.status(200).json({message: 'Invitation declined successfully.'});
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({message: 'Internal server error.'});
  }
});
