const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
  {
    marathon: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marathon'
      }
    ],
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
      required: false
    },
    type: {type: String, enum: ['mentor-hour', 'news'], default: 'news'}
  },

  {timestamps: true}
);

const mentorHour = mongoose.model('news', NewsSchema);

module.exports = mentorHour;
