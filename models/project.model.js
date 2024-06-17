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
    max: 10
  }
});

const JudgeSchema = new Schema({
  judgeId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
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
  judges: [JudgeSchema]
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
