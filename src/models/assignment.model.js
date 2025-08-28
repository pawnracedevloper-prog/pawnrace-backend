import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const assignmentSchema = new Schema({
    technique: {
        type: Schema.Types.ObjectId,
        ref: 'Technique',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    description: { // Coach can add extra instructions
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    solution: {
        type: String
    }
}, { timestamps: true });

export const Assignment = model('Assignment', assignmentSchema);