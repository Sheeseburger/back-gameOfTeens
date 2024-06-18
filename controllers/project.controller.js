const mongoose = require('mongoose');

const factory = require('./factory.controller');
const Project = require('../models/project.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllProjects = factory.getAll(Project, [{path: 'course'}, {path: 'criterias'}]);

exports.getProjectById = factory.getOne(Project, [{path: 'course'}, {path: 'criterias'}]);

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

exports.patchJuryDecision = catchAsync(async (req, res, next) => {
  const {projectId, juryId} = req.params;
  const {scores, comment} = req.body;
  console.log(projectId, juryId);
  const project = await Project.findById(projectId);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  console.log(project.jures[0].jureId);
  // Find the specific jury entry in the project's jures array
  const jury = project.jures.find(j => j.jureId.toString() === juryId);

  if (!jury) {
    return next(new AppError('No jury found with that ID for the specified project', 404));
  }

  jury.scores.forEach(score => {
    const newScore = scores[score.criteria.toString()];
    if (newScore !== undefined) {
      score.score = newScore;
    }
  });
  // Add or update the comment
  jury.comment = comment;

  // Save the project with the updated jury information
  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});
