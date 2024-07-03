const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  marathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marathon',
    required: true
  }
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team;
