import { Syllabus } from '../models/syllabus.model.js';
import { Technique } from '../models/technique.model.js';
import { Course } from '../models/course.model.js';
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// Define the Progression Path
const LEVEL_ORDER = [
    'Beginner 1', 'Beginner 2', 'Beginner 3', 
    'Intermediate 1', 'Intermediate 2', 'Intermediate 3', 
    'Advanced 1', 'Advanced 2', 'Advanced 3', 'Master'
];

// ... (addTechnique remains the same) ...
export const addTechnique = async (req, res) => {
    try {
        const { level, name, pgn, description } = req.body;
        const newTechnique = await Technique.create({ name, pgn, description });
        const updatedSyllabus = await Syllabus.findOneAndUpdate(
            { level: level }, 
            { $addToSet: { techniques: newTechnique._id } },
            { new: true, upsert: true } 
        );
        res.status(201).json(new ApiResponse(201, { technique: newTechnique, syllabus: updatedSyllabus }, "Technique added"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... (getSyllabusForCourse remains the same) ...
export const getSyllabusForCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { level } = req.query;
        
        let course = await Course.findById(courseId);
        if (!course) throw new ApiError(404, "Course not found");

        const targetLevel = level || course.level || "Beginner 1";

        // Auto-fix Syllabus Link if broken
        let masterSyllabus = await Syllabus.findOne({ level: targetLevel });
        if (!masterSyllabus) masterSyllabus = await Syllabus.create({ level: targetLevel, techniques: [] });

        if (course.syllabus?.toString() !== masterSyllabus._id.toString()) {
            course.syllabus = masterSyllabus._id;
            await course.save();
        }

        await course.populate({ path: 'syllabus', populate: { path: 'techniques' } });

        const completedList = course.completedTechniques || [];
        const techniquesWithStatus = course.syllabus.techniques.map(tech => ({
            _id: tech._id,
            name: tech.name,
            pgn: tech.pgn,
            description: tech.description,
            status: completedList.some(id => id.toString() === tech._id.toString()) ? 'completed' : 'pending'
        }));

        res.status(200).json(new ApiResponse(200, techniquesWithStatus, `Syllabus for ${targetLevel} fetched`));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 3. TOGGLE & LEVEL UP (UPDATED) ---
export const toggleTechniqueForCourse = async (req, res) => {
    try {
        const { courseId, techniqueId } = req.body;

        const course = await Course.findById(courseId).populate('syllabus'); // Need syllabus to check totals
        if (!course) throw new ApiError(404, "Course not found");

        if (!course.completedTechniques) course.completedTechniques = [];

        const index = course.completedTechniques.indexOf(techniqueId);
        let status = '';
        let leveledUp = false;
        let nextLevelName = '';

        if (index === -1) {
            // MARK COMPLETE
            course.completedTechniques.push(techniqueId);
            status = 'completed';

            // --- LEVEL UP CHECK ---
            // 1. Get the list of ALL technique IDs for the current level
            const currentLevelTechniques = course.syllabus.techniques.map(t => t.toString());
            
            // 2. Count how many of THESE are in the completed list 
            const completedCount = currentLevelTechniques.filter(id => 
                course.completedTechniques.map(String).includes(id)
            ).length;

            // 3. If ALL are done, Promote!
            if (completedCount === currentLevelTechniques.length) {
                const currentLevelIndex = LEVEL_ORDER.indexOf(course.level);
                
                if (currentLevelIndex !== -1 && currentLevelIndex < LEVEL_ORDER.length - 1) {
                    nextLevelName = LEVEL_ORDER[currentLevelIndex + 1];
                    
                    // A. Find the Syllabus for the Next Level
                    const nextSyllabus = await Syllabus.findOne({ level: nextLevelName });
                    
                    if (nextSyllabus) {
                        // B. Update the Course
                        course.level = nextLevelName;
                        course.syllabus = nextSyllabus._id;
                        leveledUp = true;
                    }
                }
            }
        } else {
            // MARK INCOMPLETE (Undo)
            course.completedTechniques.splice(index, 1);
            status = 'pending';
        }

        await course.save();

        const message = leveledUp 
            ? `Fantastic! Course promoted to ${nextLevelName}!` 
            : "Progress updated";

        res.status(200).json(new ApiResponse(200, { techniqueId, status, leveledUp, nextLevelName }, message));

    } catch (error) {
        console.error("Toggle Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ... (getAllSyllabus, getGlobalSyllabus remain the same)
export const getAllSyllabus = async (req, res) => {
    try {
        const allSyllabi = await Syllabus.find().populate('techniques').sort({ level: 1 });
        res.status(200).json(new ApiResponse(200, allSyllabi, "All fetched"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getGlobalSyllabus = async (req, res) => {
    try {
        const { level } = req.params;
        const syllabus = await Syllabus.findOne({ level }).populate('techniques');
        res.status(200).json(new ApiResponse(200, syllabus || { techniques: [] }, "Global fetched"));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};