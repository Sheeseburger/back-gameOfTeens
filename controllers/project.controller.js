const mongoose = require('mongoose');

const factory = require('./factory.controller');
const Project = require('../models/project.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const course = req.params.courseId;
  let matchStage = {};

  // Build the match stage based on user role and course
  if (req.user.role === 'admin') {
    // For admin: filter projects where all juries are confirmed
    matchStage = {
      jures: {$not: {$elemMatch: {confirmed: false}}}
    };
  } else {
    // For non-admin: filter projects where the user is a jury and is not confirmed
    matchStage = {
      'jures.jureId': mongoose.Types.ObjectId(req.user._id),
      'jures.confirmed': false
    };
  }

  if (course) {
    matchStage.course = mongoose.Types.ObjectId(course);
  }

  // Build the aggregation pipeline
  const pipeline = [
    {$match: matchStage},
    {
      $lookup: {
        from: 'courses', // Make sure the collection names are correct
        localField: 'course',
        foreignField: '_id',
        as: 'course'
      }
    },
    {$unwind: '$course'},
    {
      $lookup: {
        from: 'criterias',
        localField: 'criterias',
        foreignField: '_id',
        as: 'criterias'
      }
    },
    {$unwind: '$jures'},
    {$unwind: '$jures.scores'},
    {
      $group: {
        _id: {
          projectId: '$_id',
          criteriaId: '$jures.scores.criteria'
        },
        avgScore: {$avg: '$jures.scores.score'},
        totalScore: {$sum: '$jures.scores.score'},
        count: {$sum: 1}
      }
    },
    {
      $group: {
        _id: '$_id.projectId',
        avgScores: {
          $push: {
            criteria: '$_id.criteriaId',
            avgScore: '$avgScore'
          }
        },
        totalAvgScore: {$avg: '$avgScore'}
      }
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project'
      }
    },
    {$unwind: '$project'},
    {
      $addFields: {
        'project.avgScores': {
          $arrayToObject: {
            $map: {
              input: '$avgScores',
              as: 'item',
              in: {k: {$toString: '$$item.criteria'}, v: '$$item.avgScore'}
            }
          }
        },
        'project.totalAvgScore': '$totalAvgScore'
      }
    },
    {
      $replaceRoot: {
        newRoot: '$project'
      }
    }
  ];

  // Execute the aggregation pipeline
  const documents = await Project.aggregate(pipeline);

  res.json({
    status: 'success',
    results: documents.length,
    data: {
      data: documents
    }
  });
});
exports.getProjectById = factory.getOne(Project, [{path: 'course'}, {path: 'criterias'}]);

exports.createFullProject = catchAsync(async (req, res) => {
  const {name, description, project_link, video_link, criterias, jures, course} = req.body;

  const juresWithScores = jures.map(jure => ({
    jureId: jure,
    scores: criterias.map(criteriaId => ({
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
    criterias,
    course,
    jures: juresWithScores
  });
  res.status(201).json(newProject);
});

exports.addJureToProject = async (req, res) => {
  try {
    const {id} = req.params;
    const {jureId} = req.body;

    // Find the project and populate the criterias
    const project = await Project.findById(id).populate('criterias');
    if (!project) {
      return res.status(404).json({error: `No document found with id ${id}`});
    }

    // Create scores array with default values from project.criterias
    const scores = project.criterias.map(criteria => ({
      criteria: criteria._id,
      score: 0 // Default score value
    }));

    // Add the new jure to the project
    project.jures.push({
      jureId: mongoose.Types.ObjectId(jureId),
      comment: '', // Optionally add a default comment
      confirmed: false,
      scores: scores
    });

    // Save the updated project
    await project.save();

    // Respond with the updated project
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};

exports.patchJuryDecision = catchAsync(async (req, res, next) => {
  const {projectId} = req.params;
  const {scores, comment, jureId, project_link, video_link} = req.body;
  console.log(projectId, jureId);
  const project = await Project.findById(projectId);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  // Find the specific jury entry in the project's jures array
  const jury = project.jures.find(j => j.jureId.toString() === jureId);

  if (!jury) {
    return next(new AppError('No jury found with that ID for the specified project', 404));
  }
  scores.forEach(incomingScore => {
    const existingScore = jury.scores.find(s => s.criteria.toString() === incomingScore.criteria);
    if (existingScore) {
      existingScore.score = incomingScore.score;
    }
  });

  // Add or update the comment
  if (comment) jury.comment = comment;
  project.project_link = project_link;
  project.video_link = video_link;
  // Save the project with the updated jury information
  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

exports.confirmJureDecision = catchAsync(async (req, res, next) => {
  const {projectId} = req.params;
  const jureId = req.user._id;
  const project = await Project.findById(projectId);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  // Find the specific jury entry in the project's jures array
  const jury = project.jures.find(j => j.jureId.toString() === jureId.toString());

  if (!jury) {
    return next(new AppError('No jury found with that ID for the specified project', 404));
  }
  jury.confirmed = true;
  // Save the project with the updated jury information
  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});
