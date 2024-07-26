const mongoose = require('mongoose');

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

    chat: [MessageSchema]
  },
  {timestamps: true}
);

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

const MarathonModel = new mongoose.Schema({
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
  blocks: [BlockSchema]
});

const Marathon = mongoose.model('Marathon', MarathonModel);

module.exports = Marathon;
