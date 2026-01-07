import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const chapterSchema = new Schema({
    name: { type: String, required: true, default: "Chapter 1" },
    pgn: { type: String, required: true }
});

const techniqueSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    // Array of Chapters
    chapters: [chapterSchema] 
});

export const Technique = model('Technique', techniqueSchema);