import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const techniqueSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lichessUrl: {
        type: String,
        required: true
    }
});

export const Technique = model('Technique', techniqueSchema);