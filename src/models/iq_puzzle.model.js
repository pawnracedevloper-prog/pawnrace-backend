import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const iqPuzzleSchema = new Schema({
    student: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    mode: { 
        type: String, 
        enum: ['vision', 'minefield', 'memory', 'detective', 'queens', 'tour'] 
    },
    difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'], 
        required: true 
    },
    score: { 
        type: Number, 
        required: true,
        default: 0 
    },
    timeSpent: { 
        type: Number, // Total seconds the run lasted
        default: 0
    }
}, { timestamps: true });

export const IqPuzzleRecord = model('IqPuzzleRecord', iqPuzzleSchema);