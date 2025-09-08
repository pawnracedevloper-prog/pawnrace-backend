import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const testSchema = new Schema({
    // The coach who assigned the test
    coach: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    testName: {
        type: String,
        required: true,
        trim: true,
    },
    // The Zoom link for the test session
    zoomLink: {
        type: String,
        required: true,
        trim: true,
    },
    // A status field to track the test's progress
    status: {
        type: String,
        enum: ['assigned', 'completed', 'graded'],
        default: 'assigned',
    },
    // Optional field for storing the result/grade later
    result: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

export const Test = model('Test', testSchema);
