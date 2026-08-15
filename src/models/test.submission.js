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
    
    // Captured by the server the moment they click "Start Test"
    startTime: { 
        type: Date, 
        required: true 
    },
    
    // Captured when they submit, or when the timer auto-submits
    completedAt: { 
        type: Date 
    },
    
    // To track if the points have been added to their PawnRace profile
    pointsAwarded: { 
        type: Boolean, 
        default: false 
    },

    status: {
        type: String,
        enum: ['in_progress', 'completed', 'timeout'],
        default: 'in_progress'
    }
}, { timestamps: true });

export const TestAttempt = model('TestAttempt', testAttemptSchema);