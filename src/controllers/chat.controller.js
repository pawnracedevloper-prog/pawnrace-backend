import asyncHandler  from "../utils/asyncHandler.js";
import ApiResponse  from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Course } from "../models/course.model.js";

// Coach → students
export const getCoachStudents = asyncHandler(async (req, res) => {
  const coachId = req.user._id;

  const courses = await Course
    .find({ coach: coachId })
    .populate("students", "fullname email");

  const map = new Map();

  courses.forEach(course => {
    course.students.forEach(student => {
      map.set(student._id.toString(), student);
    });
  });

  res.status(200).json(
    new ApiResponse(200, [...map.values()], "Students fetched")
  );
});

// Conversation (JWT-based)
export const getConversation = asyncHandler(async (req, res) => {
  const senderId = req.user._id.toString();
  const { receiverId } = req.params;

  const conversationId = [senderId, receiverId].sort().join("_");

  const messages = await Message
    .find({ conversationId })
    .sort({ createdAt: 1 });

  res.status(200).json(
    new ApiResponse(200, messages, "Conversation fetched")
  );
});
