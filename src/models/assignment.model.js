import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const assignmentSchema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    coach: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    assignmentLink: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['assigned', 'completed'], // Corrected enum
        default: 'assigned',
    }
}, { timestamps: true });

export const Assignment = model('Assignment', assignmentSchema);

