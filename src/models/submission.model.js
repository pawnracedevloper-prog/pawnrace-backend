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
    // REPLACED submittedContent with tracking array
    solvedTaskIds: [{ 
        type: String // Stores the chapterIds the student has solved
    }],
    
    status: {
        type: String,
        enum: ['pending', 'submitted', 'pass', 'fail'],
        default: 'pending', // 'submitted' can mean they finished all tasks
    },
    feedback: {
        type: String, // The review box for the entire assignment
        default: ""
    },
}, { timestamps: true });

export const Submission = model('Submission', submissionSchema);