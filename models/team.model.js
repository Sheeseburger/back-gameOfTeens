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
function autoPopulateUsers(next) {
  this.populate('leader members');
  next();
}
TeamSchema.post('save', async function (doc, next) {
  await doc.populate('leader members').execPopulate();
  next();
});

// Middleware для автоматичного populate після оновлення документа
TeamSchema.post('findOneAndUpdate', async function (doc, next) {
  if (doc) {
    await doc.populate('leader members').execPopulate();
  }
  next();
});

TeamSchema.pre('find', autoPopulateUsers);
TeamSchema.pre('findOne', autoPopulateUsers);
TeamSchema.pre('findById', autoPopulateUsers);

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team;
