const factory = require('./factory.controller');

const Project = require('../models/project.model');
const Criteria = require('../models/criteria.model');
const mongoose = require('mongoose');

exports.getAllProjects = factory.getAll(Project);

exports.createFullProject = async (req, res) => {
  try {
    //    {name, project_link, video_link, criteria, judges}
    const newProject = await Project.create(req.body);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};

exports.addJudgeToProject = async (req, res) => {
  try {
    const {projectId} = req.params.id;
    const {judgeId, name, scores} = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      next(new AppError(`No document find with id ${req.params.id}`, 404));
    }

    project.judges.push({judgeId: mongoose.Types.ObjectId(judgeId), name, scores});
    await project.save();

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};
