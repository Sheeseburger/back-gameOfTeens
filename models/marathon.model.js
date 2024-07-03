const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: false
  }
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
