import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const testAttemptSchema = new Schema({
    test: { 
        type: Schema.Types.ObjectId, 
        ref: 'Test', 
        required: true 
    },
    student: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    startTime: { 
        type: Date, 
        required: true 
    },
    completedAt: { 
        type: Date 
    },
    pointsAwarded: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'timeout'],
        default: 'in_progress'
    },
    // --- THIS IS THE MISSING PIECE ---
    solvedTasks: [{
        taskId: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
        overridePgn: { type: String, default: null }
    }]
}, { timestamps: true });

export const TestAttempt = model('TestAttempt', testAttemptSchema);