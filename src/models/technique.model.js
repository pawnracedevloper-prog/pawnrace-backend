import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const techniqueSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    pgn: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: ""
    },
    status:{
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
    
});

export const Technique = model('Technique', techniqueSchema);