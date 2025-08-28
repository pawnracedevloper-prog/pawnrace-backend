import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    coach: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    syllabus: {
        type: Schema.Types.ObjectId,
        ref: 'Syllabus', // Reference the pre-defined syllabus
        required: true
    }
}, { timestamps: true });

export const Course = model('Course', courseSchema);