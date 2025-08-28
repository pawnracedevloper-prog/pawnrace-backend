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
    submittedContent: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'pass', 'fail'],
        default: 'submitted',
    },
    feedback: {
        type: String, // Coach's feedback
    },
}, { timestamps: true });

export const Submission = model('Submission', submissionSchema);