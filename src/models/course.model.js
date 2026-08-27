import mongoose from "mongoose";
const { Schema, model } = mongoose;

const courseSchema = new Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true,
      default: ""
    },
    coach: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Speeds up getMyCoursesAsCoach
    },
    students: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User",
      index: true // Speeds up getMyEnrolledCoursesAsStudent
    }],

    // Level Cache
    level: { 
      type: String, 
      default: "Beginner 1" 
    },

    // Link to Syllabus
    syllabus: { 
      type: Schema.Types.ObjectId, 
      ref: "Syllabus", 
      required: true,
      index: true 
    },

    // Track completed chapter IDs
    completedChapters: [{
      type: Schema.Types.ObjectId
    }]
  },
  { 
    timestamps: true 
  }
);

// Compound Index for coach-specific authorization checks and mutations
courseSchema.index({ coach: 1, createdAt: -1 });

export const Course = model("Course", courseSchema);