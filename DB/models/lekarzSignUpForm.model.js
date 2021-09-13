const mongoose = require('mongoose');

const LekarzSignUpFormSchema = new mongoose.Schema({
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
    patientsList: {
        type: Array,
        required: true
    },
    patient: {
        type: Boolean,
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
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }

})

const LekarzSignUpForm = mongoose.model('LekarzSignUpForm', LekarzSignUpFormSchema);

module.exports = { LekarzSignUpForm }