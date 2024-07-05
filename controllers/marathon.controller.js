const factory = require('./factory.controller');

const Marathon = require('../models/marathon.model');
const catchAsync = require('../utils/catchAsync');

exports.getAllMarathons = factory.getAll(Marathon, [{path: 'course'}]);

exports.createMarathon = factory.createOne(Marathon);

exports.addBlockToMarathon = async (req, res, next) => {
  const marathonId = req.params.id;
  const {name, description} = req.body;

  if (!name) {
    return res.status(400).json({message: 'Name is required for the block.'});
  }

  const marathon = await Marathon.findById(marathonId);

  if (!marathon) {
    return res.status(404).json({message: 'Marathon not found.'});
  }

  const newBlock = {name, description};

  marathon.blocks.push(newBlock);

  await marathon.save();

  res.status(201).json({message: 'Block added to marathon successfully.', marathon});
};
exports.getMarathonById = factory.getOne(Marathon);

exports.deleteMarathon = factory.deleteOne(Marathon);

exports.getProjectsFromBlock = catchAsync(async (req, res) => {
  const {marathonId, blockId} = req.params;
  const marathon = await Marathon.findById(marathonId).populate('course');
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  res.status(200).json(block.projects);
});
exports.createProjectToBlock = catchAsync(async (req, res) => {
  const {marathonId, blockId} = req.params;
  const newProject = req.body;

  const marathon = await Marathon.findById(marathonId).populate('course');
  const block = marathon.blocks.id(blockId);

  if (!block) {
    return res.status(404).json({error: 'Block not found'});
  }

  block.projects.push(newProject);
  await marathon.save();

  res.status(201).json(block.projects);
});
exports.updateBlockProject = catchAsync(async (req, res) => {
  const {marathonId, blockId, projectId} = req.params;
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
  const {marathonId, blockId, projectId} = req.params;

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
