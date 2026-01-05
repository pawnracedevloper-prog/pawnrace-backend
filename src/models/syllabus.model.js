import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const syllabusSchema = new Schema({
    level: {
        type: String,
        enum: ['Beginner 1', 'Beginner 2', 'Beginner 3', 'Intermediate 1', 'Intermediate 2', 'Intermediate 3', 'Advanced 1', 'Advanced 2', 'Advanced 3','Master'],
        required: true,
        unique: true
    },
    techniques: [{
        type: Schema.Types.ObjectId,
        ref: 'Technique'
    }]
});

export const Syllabus = model('Syllabus', syllabusSchema);