import { Syllabus } from '../models/syllabus.model.js';
import { Technique } from '../models/technique.model.js';

export const addTechnique = async (req, res) => {
    try {
        const { level, name, pgn, description } = req.body;

        const newTechnique = await Technique.create({
            name,
            pgn,
            description
        });

        const updatedSyllabus = await Syllabus.findOneAndUpdate(
            { level: level },
            { $push: { techniques: newTechnique._id } },
            { new: true, upsert: true } 
        );

        res.status(201).json({ 
            message: "Technique added successfully", 
            technique: newTechnique,
            syllabus: updatedSyllabus
        });

    } catch (error) {
        res.status(500).json({ message: "Error adding technique", error: error.message });
    }
};


export const deleteTechnique = async (req, res) => {
    try {
        const { techniqueId, level } = req.body; 

        await Technique.findByIdAndDelete(techniqueId);

        await Syllabus.findOneAndUpdate(
            { level: level },
            { $pull: { techniques: techniqueId } }
        );

        res.status(200).json({ message: "Technique deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting technique", error: error.message });
    }
};

export const updateTechnique = async (req, res) => {
    try {
        const { techniqueId, name, pgn, description } = req.body;

        const updatedTechnique = await Technique.findByIdAndUpdate(
            techniqueId,
            { name, pgn, description },
            { new: true } // Returns the updated document
        );

        if (!updatedTechnique) {
            return res.status(404).json({ message: "Technique not found" });
        }

        res.status(200).json({ 
            message: "Technique updated successfully", 
            technique: updatedTechnique 
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating technique", error: error.message });
    }
};

export const getLevelContent = async (req, res) => {
    try {
        const { level } = req.params;

        const syllabus = await Syllabus.findOne({ level: level })
            .populate('techniques'); // This replaces IDs with actual Technique data

        if (!syllabus) {
            return res.status(200).json({ techniques: [] }); 
        }

        res.status(200).json(syllabus);

    } catch (error) {
        res.status(500).json({ message: "Error fetching syllabus", error: error.message });
    }
};