const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound index to ensure unique tags per user
TagSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Tag', TagSchema);