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
    // Optional: Reference to the coach who created it
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
    }
}, { timestamps: true });

export const Tournament = model('Tournament', tournamentSchema);