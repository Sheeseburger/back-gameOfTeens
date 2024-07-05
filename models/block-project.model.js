const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  marathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marathon',
    required: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marathon.block',
    required: true
  }
});

const BlockProject = mongoose.model('BlockProject', BlockProjectSchema);
module.exports = BlockProject;
