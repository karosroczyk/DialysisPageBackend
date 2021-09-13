const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    weight_start: {
        type: Number ,
        required: true
    },
    body_temperature: {
        type: Number,
        min: 30,
        max: 43,
        required: true
    },
    sbp: {
        type: Number,
        required: true
    },
    dbp: {
        type: Number,
        required: true
    },
    dia_temp_value: {
        type: Number,
        required: true
    },
    conductivity: {
        type: Number,
        required: true
    },
    uf: {
        type: Number,
        required: true
    },
    blood_flow: {
        type: Number,
        required: true
    },
    dialysis_time: {
        type: Number,
        required: true
    },
    datetime: {
        type: Date,
        required: true
    },
    result_sbp: {
        type: Number,
        required: true
    },
    result_dbp: {
        type: Number,
        required: true
    },
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }

})

const List = mongoose.model('List', ListSchema);

module.exports = { List }