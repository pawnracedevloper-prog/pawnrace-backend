import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import  ApiResponse  from '../utils/ApiResponse.js';
import { Course } from '../models/course.model.js';
import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

// For a coach to get a list of all unique students in their courses
const getCoachsStudents = asyncHandler(async (req, res) => {
    const coachId = req.user._id;

    // Find all courses taught by this coach
    const courses = await Course.find({ coach: coachId }).populate('students', 'fullname username');

    if (!courses) {
        return res.status(200).json(new ApiResponse(200, [], "Coach has no courses or students yet."));
    }

    // Create a unique list of students
    const studentMap = new Map();
    courses.forEach(course => {
        course.students.forEach(student => {
            if (!studentMap.has(student._id.toString())) {
                studentMap.set(student._id.toString(), student);
            }
        });
    });

    const uniqueStudents = Array.from(studentMap.values());

    return res.status(200).json(new ApiResponse(200, uniqueStudents, "Students retrieved successfully"));
});

// Get the message history between the logged-in user and another user
const getConversationHistory = asyncHandler(async (req, res) => {
    const senderId = req.user._id;
    const receiverId = new mongoose.Types.ObjectId(req.params.receiverId);

    // Create the conversation ID by sorting the user IDs alphabetically
    const conversationId = [senderId, receiverId].sort().join('_');

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 }) // Fetch messages in chronological order
        .populate('sender', 'username fullname');

    return res.status(200).json(new ApiResponse(200, messages, "Conversation history retrieved successfully"));
});

export { getCoachsStudents, getConversationHistory };
