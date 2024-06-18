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
    required: true
  },
  comment: {
    type: String,
    required: false,
    default: ''
  },
  scores: [ScoreSchema]
});

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  project_link: {
    type: String,
    required: true
  },
  video_link: {
    type: String,
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
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
