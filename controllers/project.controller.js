const mongoose = require('mongoose');

const loginToSheet = require('../utils/sheets/loginToSheet');
const createSheetData = require('../utils/sheets/formDataToSheet');

const factory = require('./factory.controller');
const Project = require('../models/project.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const {buildAdminAggregationPipeline} = require('../utils/projectUtils');
const fillAllProjects = require('../utils/sheets/ProjectsToSheet');
const Marathon = require('../models/marathon.model');
const clearSheet = require('../utils/sheets/clearSheet');
const uploadDataToSheet = require('../utils/sheets/uploadDataToSheet');
const uploadDataToGoogleSheet = require('../../../StudyBooking-back/utils/spreadsheet/uploadData');
const createSheetIfNotExists = require('../utils/sheets/createSheetIfNotExist');

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
    if (course) query = query.where('course').equals(new mongoose.Types.ObjectId(course));
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
      jureId: new mongoose.Types.ObjectId(jureId),
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
  const {scores, comment, jureId, project_link, video_link, marathonId} = req.body;
  const marathon = await Marathon.findById(marathonId);

  if (!marathon) return next(new AppError('No marathon found', 404));
  const blockLength = marathon.blocks.length;

  const block = marathon.blocks[blockLength - 1].isFinalWeek
    ? marathon.blocks[blockLength - 1]
    : null;

  const project = block.projects.find(pr => pr._id.toString() === projectId);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  // Find the specific jury entry in the project's jures array
  const jury = project.juries.find(j => j.jureId.toString() === jureId);

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
  // project.project_link = project_link;
  // project.video_link = video_link;
  // Save the project with the updated jury information
  await marathon.save();

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

exports.confirmJureDecision = catchAsync(async (req, res, next) => {
  const jureId = req.user._id;

  const {projects, marathonId} = req.body;

  const marathon = await Marathon.findById(marathonId);

  const blockLength = marathon.blocks.length;

  const block = marathon.blocks[blockLength - 1].isFinalWeek
    ? marathon.blocks[blockLength - 1]
    : null;
  const newProjects = await Promise.all(
    projects.map(async projectBody => {
      const project = block.projects.find(pr => pr._id.toString() === projectBody._id);
      if (!project) {
        throw new AppError('No project found with that ID', 404);
      }
      // Find the specific jury entry in the project's jures array
      const jury = project.juries.find(j => j.jureId.toString() === jureId.toString());

      if (!jury) {
        throw new AppError('No jury found with that ID for the specified project', 404);
      }
      jury.confirmed = true;
      return project;
    })
  );
  marathon.save();

  res.status(200).json({
    status: 'success',
    data: {
      newProjects
    }
  });
});
exports.AllProjectsToSheet = async (req, res, next) => {
  const sheets = loginToSheet();
  const spreadsheetId = '1Of-pKkxzuDGeeNR431Nm452lYOuiF0CSsvF7ZU0FEE0';
  const marathons = await Marathon.find().populate('blocks.projects.team');
  const rows = [["Ім'я лідера", 'кількість участників', 'Перелік участників']];
  marathons.map(marathon => {
    const blockLength = marathon.blocks.length;

    const finalBlock = marathon.blocks[blockLength - 1].isFinalWeek
      ? marathon.blocks[blockLength - 1]
      : null;
    if (!finalBlock) return;
    rows.push(['', marathon.name, '']);
    const projects = finalBlock.projects;
    projects.map(project =>
      rows.push([
        `${project.team.leader.name} (${project.team.leader.email})`,
        project.team.members.length,
        project.team.members.map(member => `${member.name} (${member.email})`).join(', ')
      ])
    );
  });
  const sheetName = 'All marathons';
  await clearSheet(sheets, spreadsheetId, sheetName);
  result = await uploadDataToSheet(sheets, rows, sheetName, spreadsheetId);
  res.json(result);
};

exports.fillSpreadsheet = async (req, res, next) => {
  const sheets = loginToSheet();
  const spreadsheetId = '19NCwc0ubkpdopz368N2uGvEP_-T1bdJ54b9mns-kwU4';
  const marathons = await Marathon.find({_id: {$ne: '66a3797760c07f91e58eaaad'}})
    .select(
      '-description -blocks.description -blocks.projects.finalVideo -blocks.projects.files -blocks.projects.links'
    )
    .populate('criterias juries blocks.projects.team')
    .lean();

  const filteredMarathons = marathons.map(marathon => ({
    ...marathon,
    // in future change to isFinalWeek (for now its last block because we have 2 isFinalWeek in row)
    blocks: marathon.blocks[marathon.blocks.length - 1]
  }));

  // Initialize the spreadsheet rows

  // Iterate over each marathon
  filteredMarathons.forEach(async marathon => {
    // Initialize the header row with criterias and juries
    const spreadsheetData = [];
    const headerRow1 = [
      'Team Name (Leader Name)',
      'Кількість людей у команді',
      'Команда',
      ...marathon.criterias.flatMap(c => [
        c.name,
        ...Array(marathon.juries.length - 1).fill(''),
        ...['Avg']
      ])
    ];
    const headerRow2 = ['', '', ''];
    headerRow1.push('Total', 'Comments');
    marathon.criterias.forEach(() => {
      marathon.juries.forEach(jury => headerRow2.push(jury.name));
      headerRow2.push(' ');
    });
    headerRow2.push(' ');
    marathon.juries.forEach(jury => headerRow2.push(jury.name));

    spreadsheetData.push(headerRow1);
    spreadsheetData.push(headerRow2);
    const comments = [];
    // Iterate over each project in the final week block

    marathon.blocks.projects.forEach(project => {
      const row = [
        `${project.team.leader.name} (${project.team.leader.email})`,
        project.team.members.length,
        project.team.members.map(member => `${member.name} (${member.email})`).join(', ')
      ];
      let total = 0;
      // Create an array of scores for each jury member
      marathon.criterias.forEach((criteria, index) => {
        let avg = 0;
        marathon.juries.forEach(jury => {
          const jureSchema = project.juries.find(j => j.jureId.toString() === jury._id.toString());
          const scores = jureSchema.scores.find(
            sc => sc.criteria.toString() === criteria._id.toString()
          );
          if (index === 0) {
            comments.push(jureSchema.comment);
          }
          row.push(scores.score ?? '-');
          avg += scores.score;
        });
        total += avg / (marathon.juries.length - 1);
        row.push(avg / (marathon.juries.length - 1));
      });

      // Add the total and comments for each jury member

      row.push(total);
      row.push(...comments);
      // Add the row to the spreadsheet data
      spreadsheetData.push(row);
    });
    const name = marathon.name;
    await createSheetIfNotExists(sheets, spreadsheetId, name);

    await clearSheet(sheets, spreadsheetId, name);
    await uploadDataToGoogleSheet(sheets, spreadsheetId, name, spreadsheetData);
  });

  res.json(filteredMarathons);
};
