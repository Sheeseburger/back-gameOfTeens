const factory = require('./factory.controller');

const Marathon = require('../models/marathon.model');
const catchAsync = require('../utils/catchAsync');
const getBlockProjectsByWeekData = require('../utils/sheets/formBlockProjectData');
const uploadDataToSheet = require('../utils/sheets/uploadDataToSheet');
const createSheetIfNotExists = require('../utils/sheets/createSheetIfNotExist');
const loginToSheet = require('../utils/sheets/loginToSheet');
const clearSheet = require('../utils/sheets/clearSheet');

exports.getAllMarathons = factory.getAll(Marathon, [
  {path: 'course'},
  {path: 'criterias'},
  {path: 'juries'},
  {path: 'blocks.projects.team'}
]);

exports.createMarathon = factory.createOne(Marathon);

exports.addBlockToMarathon = async (req, res, next) => {
  const marathonId = req.params.id;
  const {name, description, isFinalWeek} = req.body;

  if (!name) {
    return res.status(400).json({message: 'Name is required for the block.'});
  }

  const marathon = await Marathon.findById(marathonId);

  if (!marathon) {
    return res.status(404).json({message: 'Marathon not found.'});
  }

  const newBlock = {name, description, isFinalWeek};

  marathon.blocks.push(newBlock);

  await marathon.save();

  res.status(201).json({message: 'Block added to marathon successfully.', marathon});
};
exports.getMarathonById = factory.getOne(Marathon, [{path: 'course'}]);

exports.deleteMarathon = factory.deleteOne(Marathon);

exports.getProjectsFromBlock = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId} = req.params;
  const marathon = await Marathon.findById(marathonId).populate(
    'course blocks.projects blocks.projects.team'
  );
  const block = marathon.blocks.id(blockId);
  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }
  block.projects.sort((a, b) => b.confirm - a.confirm);

  res.status(200).json(block.projects);
});
exports.createProjectToBlock = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId} = req.params;
  const newProject = req.body;

  const marathon = await Marathon.findById(marathonId).populate('course');
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  block.projects.push(newProject);
  await marathon.save();
  res.status(201).json({data: block.projects[block.projects.length - 1]});
});
exports.updateBlockProject = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId, projectId} = req.params;
  const updatedProject = req.body;

  const marathon = await Marathon.findById(marathonId).populate('course');
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = block.projects.id(projectId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }

  project.set(updatedProject);
  await marathon.save();

  res.status(200).json(project);
});

exports.getProjectFromBlockById = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId, projectId} = req.params;

  const marathon = await Marathon.findById(marathonId).populate('course');

  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = block.projects.id(projectId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }

  res.status(200).json(project);
});

exports.getProjectFromBlockByTeamId = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId, teamId} = req.params;

  const marathon = await Marathon.findById(marathonId).populate('course');

  console.log(marathon);
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = (block.projects || []).find(proj => proj.team.toString() === teamId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }

  res.status(200).json(project);
});

exports.confirmProjectFromBlock = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId, projectId} = req.params;

  const marathon = await Marathon.findById(marathonId).populate('course');

  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = block.projects.id(projectId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }
  project.confirm = true;
  await marathon.save();

  res.status(200).json(project);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const {marathonId, blockId, projectId} = req.params;
  const {text, sender} = req.body;

  const marathon = await Marathon.findById(marathonId);
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = block.projects.id(projectId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }

  const newMessage = {text, sender};
  project.chat.push(newMessage);
  await marathon.save();

  res.status(201).json(newMessage);
});

// Получение всех сообщений
exports.getAllMessages = catchAsync(async (req, res) => {
  const {marathonId, blockId, projectId} = req.params;

  const marathon = await Marathon.findById(marathonId).populate({
    path: 'blocks.projects.chat.sender',
    select: '-password'
  });
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  const project = block.projects.id(projectId);

  if (!project) {
    return res.status(404).json({error: 'Project not found'});
  }

  const messages = project.chat;
  res.status(200).json(messages);
});

exports.deleteBlockFromMarathon = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId} = req.params;

  const marathon = await Marathon.findById(marathonId);

  if (!marathon) {
    return res.status(404).json({error: 'Marathon not found'});
  }

  const blockIndex = marathon.blocks.findIndex(block => block._id.toString() === blockId);

  if (blockIndex === -1) {
    return res.status(404).json({error: 'Block not found'});
  }

  marathon.blocks.splice(blockIndex, 1);
  await marathon.save();

  res.status(200).json({message: 'Block deleted successfully'});
});

exports.updateBlockInMarathon = catchAsync(async (req, res) => {
  const marathonId = req.params.id;
  const {blockId} = req.params;
  const updatedBlockData = req.body;

  const marathon = await Marathon.findById(marathonId);

  if (!marathon) {
    return res.status(404).json({error: 'Marathon not found'});
  }

  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  // Update properties of the block
  if (updatedBlockData.name) {
    block.name = updatedBlockData.name;
  }
  if (updatedBlockData.description) {
    block.description = updatedBlockData.description;
  }
  // Add more properties as needed

  await marathon.save();

  res.status(200).json({message: 'Block updated successfully', block});
});

exports.formBlockProjectData = catchAsync(async (req, res) => {
  const blockIndex = Number(req.query.index) || 0;
  const spreadsheetId = '1g9N8eGGKYAxhnC2NJiiZKxH-ydg4K86tJ2J59OPmHJw';
  const marathons = await Marathon.find().populate('blocks.projects.team');

  const sheetData = await getBlockProjectsByWeekData(marathons, blockIndex);
  let result = null;
  if (sheetData) {
    const sheets = await loginToSheet();
    await createSheetIfNotExists(sheets, spreadsheetId, `Week ${blockIndex + 1}`);
    await clearSheet(sheets, spreadsheetId, `Week ${blockIndex + 1}`);
    result = await uploadDataToSheet(sheets, sheetData, `Week ${blockIndex + 1}`, spreadsheetId);
  }
  res.json({result});
});

exports.addCriteriaOrJureToMarathon = catchAsync(async (req, res) => {
  const {criteriaId, jureId} = req.body;
  const {id} = req.params;

  const marathon = await Marathon.findById(id);

  if (!marathon) {
    return res.status(404).json({message: 'Marathon not found'});
  }

  if (criteriaId) {
    marathon.criterias.push(criteriaId);
    await marathon.save();
    return res.status(200).json({message: 'Criteria added successfully', marathon});
  }

  if (jureId) {
    marathon.juries.push(jureId);
    await marathon.save();
    return res.status(200).json({message: 'Jure added successfully', marathon});
  }

  res.status(400).json({message: 'No criteriaId or jureId provided'});
});

exports.createJureSchema = catchAsync(async (req, res) => {
  const {projectId, marathonId} = req.body;
  const userId = req.user._id;
  const marathon = await Marathon.findById(marathonId);

  if (!marathon) {
    return res.status(404).json({message: 'Marathon not found'});
  }
  const blockLength = marathon.blocks.length;

  const block = marathon.blocks[blockLength - 1].isFinalWeek
    ? marathon.blocks[blockLength - 1]
    : null;
  if (!block) {
    return res.status(404).json({message: 'Project not found in any block'});
  }

  const project = block.projects.find(project => project._id.toString() === projectId);

  const existingJure = project.juries.find(jure => jure.jureId.toString() === userId.toString());

  if (existingJure) {
    return res.status(400).json({message: 'Jury already exists for this user in the project'});
  }

  const newJure = {
    jureId: userId,
    comment: '',
    confirmed: false,
    scores: marathon.criterias.map(criteria => {
      return {criteria: criteria._id, score: 0};
    })
  };

  project.juries.push(newJure);

  // Сохраняем изменения
  await marathon.save();

  res.status(200).json({message: 'Jury added successfully', newJure});
});
