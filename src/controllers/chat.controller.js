import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js"; 

// Get all students associated with a coach
export const getCoachStudents = asyncHandler(async (req, res) => {
    const { coachId } = req.params;

    // 1. Find all courses where this user is the coach
    // 2. Populate the 'students' field from those courses
    const courses = await Course.find({ coach: coachId }).populate("students", "fullname email avatar");

    if (!courses) {
        return res.status(200).json(new ApiResponse(200, [], "No students found"));
    }

    // 3. Extract unique students from all courses
    const uniqueStudentsMap = new Map();
    courses.forEach(course => {
        course.students.forEach(student => {
            if (!uniqueStudentsMap.has(student._id.toString())) {
                uniqueStudentsMap.set(student._id.toString(), {
                    _id: student._id,
                    fullname: student.fullname,
                    email: student.email,
                    //avatar: student.avatar // Ensure your User model has an avatar field or handle it on frontend
                });
            }
        });
    });

    const students = Array.from(uniqueStudentsMap.values());

    return res
        .status(200)
        .json(new ApiResponse(200, students, "Students fetched successfully"));
});

// Get conversation history between two users
export const getConversation = asyncHandler(async (req, res) => {
    const { userId1, userId2 } = req.params;

    // Determine the unique conversation ID used in your message model logic
    // (Sort IDs to ensure consistency regardless of who is sender/receiver)
    const conversationId = [userId1, userId2].sort().join('_');

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 }); // Oldest messages first

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Conversation fetched successfully"));
});