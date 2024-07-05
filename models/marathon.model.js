const mongoose = require('mongoose');

const BlockProjectSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  files: {
    type: Array
  },
  links: {
    type: String,
    required: false
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  }
});

const BlockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: false
  },
  projects: [BlockProjectSchema]
});

const MarathonModel = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  description: {
    type: String,
    required: false
  },
  blocks: [BlockSchema]
});

const Marathon = mongoose.model('Marathon', MarathonModel);

module.exports = Marathon;
