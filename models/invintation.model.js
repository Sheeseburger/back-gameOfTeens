const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    marathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Marathon',
      required: true
    }
  },
  {timestamps: true}
);

const Invitation = mongoose.model('Invitation', InvitationSchema);

module.exports = Invitation;
