const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    message: {
        type: String
    },
    sender: {
        type: String
    },
    receiver: {
        type: String
    },
    room: {
        type: String
    }
},
    {
        timestamps: true
})

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = { Chat }