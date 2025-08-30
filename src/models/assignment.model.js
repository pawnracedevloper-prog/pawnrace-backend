import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const assignmentSchema = new Schema({
    // UPDATE THIS: Link to a specific technique from the syllabus
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