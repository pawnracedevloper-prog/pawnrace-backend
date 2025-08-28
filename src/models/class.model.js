import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const classSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    classTime: {
        type: Date,
        required: true,
    },
    zoomLink: {
        type: String,
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'archived'],
        default: 'scheduled'
    }
}, { timestamps: true });

export const Class = model('Class', classSchema);