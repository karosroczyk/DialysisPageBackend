const mongoose = require('mongoose');

const UserSignUpFormSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5
    },
    gender: {
        type: Boolean,
        required: true
    },
    birthday: {
        type: Date,
        required: true
    },
    firstDialysis: {
        type: Date,
        required: true
    },
    diabetes: {
        type: Boolean,
        required: true
    },
    patient: {
        type: Boolean,
        required: true
    },
    lekarz: {
        type: String,
        required: true
    },
    cityOfInterest: {
        type: String,
        required: true
    },
    dayOfInterest: {
        type: Date,
        required: true
    },
    // with auth
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }

})

const UserSignUpForm = mongoose.model('UserSignUpForm', UserSignUpFormSchema);

module.exports = { UserSignUpForm }