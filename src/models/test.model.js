import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Sub-schema for individual puzzles/techniques in the test
const testTaskSchema = new Schema({
    chapterId: { type: String, required: true }, // Reference to Syllabus Chapter ID
    title: { type: String, required: true },
    pgn: { type: String, required: true },       // Stored snapshot for validation
    fen: { type: String }                        // Optional: Board setup
});

const testSchema = new Schema({
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
    tasks: [testTaskSchema], 
    
    // NEW: Independent timer for this specific test
    timeLimit: {
        type: Number, 
        required: true,
        // E.g., store in seconds (1800 = 30 minutes) for easy frontend countdowns
    },
    
    // NEW: Points rewarded to the student for completion
    rewardPoints: {
        type: Number,
        required: true,
        default: 0
    },

    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    }
}, { timestamps: true });

export const Test = model('Test', testSchema);