const mongoose = require('mongoose');

const mentorHourSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    marathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marathon'
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marathon.Blocks'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    link: {
      type: String,
      required: true
    }
  },
  {timestamps: true}
);

const mentorHour = mongoose.model('mentorHour', mentorHourSchema);

module.exports = mentorHour;
