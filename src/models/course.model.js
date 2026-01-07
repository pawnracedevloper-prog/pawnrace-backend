import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const courseSchema = new Schema({
    title: { type: String, required: true, trim: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    
    // Level Cache
    level: { type: String, default: 'Beginner 1' },

    // Link to Syllabus
    syllabus: { type: Schema.Types.ObjectId, ref: 'Syllabus', required: true },

    // CHANGED: We now track completed CHAPTER IDs, not Technique IDs
    completedChapters: [{
        type: Schema.Types.ObjectId
    }]
}, { timestamps: true });

export const Course = model('Course', courseSchema);