const mongoose = require('mongoose');

const mentorHourSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'course',
      required: true
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'marathon.blocks'
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
