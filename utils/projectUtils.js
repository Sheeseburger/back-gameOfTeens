const mongoose = require('mongoose');

const buildAdminAggregationPipeline = courseId => {
  let matchStage = {};

  // Build the match stage based on the course
  // matchStage = {
  //   jures: {$not: {$elemMatch: {confirmed: false}}}
  // };

  if (courseId) {
    matchStage.course = new mongoose.Types.ObjectId(courseId);
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
        avgScore: {$avg: '$jures.scores.score'}
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
        totalSumOfAvgScores: {$sum: '$avgScore'}
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
        'project.totalSumOfAvgScores': '$totalSumOfAvgScores'
      }
    },
    {
      $replaceRoot: {
        newRoot: '$project'
      }
    }
  ];

  return pipeline;
};

module.exports = {
  buildAdminAggregationPipeline
};
