import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const tournamentSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    link: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    winner: {
        type: String,
        default: "NA",
        trim: true
    },
    review: {
        type: String,
        default: "NA",
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
    }
}, { timestamps: true });

export const Tournament = model('Tournament', tournamentSchema);