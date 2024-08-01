const mongoose = require('mongoose');
const ScoreSchema = new mongoose.Schema({
  criteria: {
    type: mongoose.Schema.Types.ObjectId,
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

const JureSchema = new mongoose.Schema({
  jureId: {
    type: mongoose.Schema.Types.ObjectId,
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
const MessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {timestamps: true}
);

const BlockProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false
    },
    files: {
      type: Array,
      required: false
    },
    links: {
      type: Array,
      required: false
    },
    confirm: {type: Boolean, default: false},
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    checkedByMentor: {
      type: Boolean,
      default: false
    },

    chat: [MessageSchema],
    juries: [JureSchema]
  },
  {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

BlockProjectSchema.virtual('avgScores').get(function () {
  if (!this.juries || this.juries.length === 0) {
    return [];
  }

  const criteriaMap = {};

  this.juries.forEach(jure => {
    jure.scores.forEach(score => {
      if (!criteriaMap[score.criteria]) {
        criteriaMap[score.criteria] = {
          totalScore: 0,
          count: 0
        };
      }
      criteriaMap[score.criteria].totalScore += score.score;
      criteriaMap[score.criteria].count += 1;
    });
  });

  return Object.keys(criteriaMap).map(criteriaId => ({
    criteria: criteriaId,
    avgScore: parseFloat(
      (criteriaMap[criteriaId].totalScore / criteriaMap[criteriaId].count).toFixed(2)
    )
  }));
});
BlockProjectSchema.virtual('totalScore').get(function () {
  const avgScores = this.avgScores;

  return avgScores.reduce((total, score) => total + score.avgScore, 0);
});
const BlockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isFinalWeek: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: false
  },
  projects: [BlockProjectSchema]
});

const MarathonModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },

    description: {
      type: String,
      required: false
    },
    blocks: [BlockSchema],
    criterias: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: false
      }
    ],
    juries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
      }
    ]
  },
  {
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
  }
);

MarathonModel.virtual('TMP').get(function () {
  return 'hello world';
});

const Marathon = mongoose.model('Marathon', MarathonModel);

module.exports = Marathon;
