const mongoose = require('mongoose');

const {google} = require('googleapis');
const loginToSheet = require('../utils/sheets/loginToSheet');
const createSheetData = require('../utils/sheets/formDataToSheet');

const factory = require('./factory.controller');
const Project = require('../models/project.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const {buildAdminAggregationPipeline} = require('../utils/projectUtils');

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const course = req.params.courseId;

  if (req.user.role === 'admin') {
    // Build the aggregation pipeline for admin users
    const pipeline = buildAdminAggregationPipeline(course);

    // Execute the aggregation pipeline
    const documents = await Project.aggregate(pipeline);
    await Project.populate(documents, [
      {path: 'criterias'},
      {path: 'jures.jureId', select: '-email -role'}
    ]);
    documents.forEach(doc => {
      doc.jures.forEach(jure => {
        if (jure.jureId) {
          // Flatten the jureId structure
          jure.name = jure.jureId.name; // Add name as a separate field
          jure.jureId = jure.jureId._id.toString(); // Convert ObjectId to string
          delete jure.jureId.name; // Remove name from jureId if needed
        }
      });
    });
    return res.json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents
      }
    });
  } else {
    let query = Project.find();
    // Build the match stage for non-admin users
    query = factory.multiplePopulate(query, [{path: 'course'}, {path: 'criterias'}]);
    if (course) query = query.where('course').equals(mongoose.Types.ObjectId(course));
    query = query.where('jures').elemMatch({
      jureId: req.user._id,
      confirmed: false
    });
    const documents = await query;

    return res.json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents
      }
    });
  }
});
exports.getProjectById = factory.getOne(Project, [{path: 'course'}, {path: 'criterias'}]);

exports.getProjectsWithLinks = async (req, res, next) => {
  const all = await Project.find({
    links: {
      $elemMatch: {
        $ne: ''
      }
    }
  }).populate('course');
  let str = '';
  all.forEach(project => (str += `${project.name},${project.course.name}\n`));
  console.log(str);
  res.status(200).json({length: all.length, all, str});
};
exports.createFullProject = catchAsync(async (req, res) => {
  const {name, description, links, project_link, video_link, criterias, jures, course} = req.body;

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
    links,
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
  const jureId = req.user._id;

  const projects = req.body.projects;
  const newProjects = await Promise.all(
    projects.map(async projectBody => {
      const project = await Project.findById(projectBody._id);
      if (!project) {
        throw new AppError('No project found with that ID', 404);
      }
      // Find the specific jury entry in the project's jures array
      const jury = project.jures.find(j => j.jureId.toString() === jureId.toString());

      if (!jury) {
        throw new AppError('No jury found with that ID for the specified project', 404);
      }
      jury.confirmed = true;
      // Save the project with the updated jury information
      await project.save();
      return project;
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      newProjects
    }
  });
});

exports.fillSpreadsheet = async (req, res, next) => {
  const sheets = loginToSheet();
  const spreadsheetId = process.env.SPREADSHEETID;

  const projects = await Project.find()
    .populate('course')
    .populate('criterias')
    .populate({
      path: 'jures',
      populate: {
        path: 'scores.criteria'
      }
    });

  const scratchProjects = projects.filter(project => project.course.name === 'Scratch');
  const minecraftKidsProjects = projects.filter(
    project => project.course.name === 'Minecraft kids'
  );
  const minecraftJuniorProjects = projects.filter(
    project => project.course.name === 'Minecraft junior'
  );

  const scratchData = createSheetData(scratchProjects);
  const minecraftKidsData = createSheetData(minecraftKidsProjects);
  const minecraftJuniorData = createSheetData(minecraftJuniorProjects);

  // Обновляем данные в таблице
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Scratch!A1',
    valueInputOption: 'RAW',
    resource: {
      values: scratchData
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Minecraft kids!A1',
    valueInputOption: 'RAW',
    resource: {
      values: minecraftKidsData
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Minecraft junior!A1',
    valueInputOption: 'RAW',
    resource: {
      values: minecraftJuniorData
    }
  });

  res.send('Data successfully exported to Google Sheets');
};
