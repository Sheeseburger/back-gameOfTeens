const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScoreSchema = new Schema({
  criteria: {
    type: Schema.Types.ObjectId,
    ref: 'Criteria',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    default: 0
  }
});

const JureSchema = new Schema({
  jureId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: false,
    default: ''
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false
  },
  scores: [ScoreSchema]
});

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  links: {
    type: Array
  },
  project_link: {
    type: String,
    required: false
  },
  video_link: {
    type: String,
    required: false
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  marathon: {
    type: Schema.Types.ObjectId,
    ref: 'Marathon',
    required: false
  },
  criterias: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Criteria',
      required: true
    }
  ],
  jures: [JureSchema]
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
