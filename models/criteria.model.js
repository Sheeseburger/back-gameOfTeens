const mongoose = require('mongoose');

const CriteriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  }
});

const Criteria = mongoose.model('Criteria', CriteriaSchema);
module.exports = Criteria;
