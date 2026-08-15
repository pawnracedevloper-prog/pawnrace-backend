import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const submissionSchema = new Schema({
    assignment: {
        type: Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // [UPDATED] Upgraded from simple string array to object array
    solvedTasks: [{ 
        taskId: { type: String, required: true }, // The chapterId/taskId
        isCorrect: { type: Boolean, default: true }, // Did they play the book move?
        overridePgn: { type: String, default: null } // The custom line if isCorrect is false
    }],
    
    status: {
        type: String,
        enum: ['pending', 'submitted', 'pass', 'fail'],
        default: 'pending', 
    },
    feedback: {
        type: String, 
        default: ""
    },
    pointsAwarded: { 
    type: Boolean, 
    default: false 
},
}, { timestamps: true });

export const Submission = model('Submission', submissionSchema);