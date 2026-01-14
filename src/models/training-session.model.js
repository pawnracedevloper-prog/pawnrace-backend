import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const classSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    classTime: {
        type: Date,
        required: true,
    },
    // New Mandatory Field for your Internal Game Room
    roomId: {
        type: String,
        required: true,
        unique: true // Ensures no two classes accidentally share a room
    },
    platform: {
        type: String,
        default: 'internal', // Hardcoded since you are only using your own platform now
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

export const Training = model('Training', classSchema);