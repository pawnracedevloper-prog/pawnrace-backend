import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Sub-schema for individual puzzles/techniques in the assignment
const taskSchema = new Schema({
    chapterId: { type: String, required: true }, // Reference to Syllabus Chapter ID
    title: { type: String, required: true },
    pgn: { type: String, required: true },       // Stored snapshot for validation
    fen: { type: String }                        // Optional: Board setup
});

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
    description: {
        type: String,
        trim: true
    },
    // REPLACED assignmentLink with tasks array
    tasks: [taskSchema], 
    
    // Status of the assignment itself (e.g., is it active?)
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    }
}, { timestamps: true });

export const Assignment = model('Assignment', assignmentSchema);