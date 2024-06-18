const mongoose = require('mongoose');

const factory = require('./factory.controller');
const Project = require('../models/project.model');
const catchAsync = require('../utils/catchAsync');

exports.getAllProjects = factory.getAll(Project, [{path: 'course'}, {path: 'criterias'}]);

exports.createFullProject = catchAsync(async (req, res) => {
  const {name, description, project_link, video_link, criteria, jures} = req.body;

  const juresWithScores = jures.map(jure => ({
    jureId: jure,
    scores: criteria.map(criteriaId => ({
      criteria: criteriaId,
      score: 0 // Default score, adjust as needed
    }))
  }));

  //    {name, project_link, video_link, criteria, jures}
  const newProject = await Project.create({
    name,
    description,
    project_link,
    video_link,
    criteria,
    jures: juresWithScores
  });
  res.status(201).json(newProject);
});

exports.addJureToProject = async (req, res) => {
  try {
    const {projectId} = req.params.id;
    const {jureId, name, scores} = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      next(new AppError(`No document find with id ${req.params.id}`, 404));
    }

    project.jures.push({jureId: mongoose.Types.ObjectId(jureId), name, scores});
    await project.save();

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};
