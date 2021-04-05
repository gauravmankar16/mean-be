const moongose = require('mongoose');

const postSchema = moongose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imagePath: { type: String, required: true},
    creator: { type: moongose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = moongose.model('Post', postSchema);