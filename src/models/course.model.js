import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema({
    title: { type: String, required: true, trim: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    level: { 
        type: String, 
        default: 'Beginner 1' 
    },
    // 1. LINK TO SYLLABUS 
    syllabus: {
        type: Schema.Types.ObjectId,
        ref: 'Syllabus', 
        required: true
    },

    // 2. TRACK PROGRESS 
    completedTechniques: [{
        type: Schema.Types.ObjectId,
        ref: 'Technique'
    }]
}, { timestamps: true });

export const Course = model('Course', courseSchema);