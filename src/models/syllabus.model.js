import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const syllabusSchema = new Schema({
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
        unique: true
    },
    techniques: [{
        type: Schema.Types.ObjectId,
        ref: 'Technique'
    }]
});

export const Syllabus = model('Syllabus', syllabusSchema);