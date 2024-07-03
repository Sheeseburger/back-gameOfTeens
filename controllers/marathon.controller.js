const factory = require('./factory.controller');

const Marathon = require('../models/marathon.model');

exports.getAllMarathons = factory.getAll(Marathon);

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
