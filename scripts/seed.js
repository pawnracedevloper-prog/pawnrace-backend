import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Technique } from '../src/models/technique.model.js';
import { Syllabus } from '../src/models/syllabus.model.js';

// Configure dotenv to find your .env file
dotenv.config({ path: '../.env' });

// Function to connect to the database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
};

// Main function to seed the data
const seedDatabase = async () => {
    await connectDB();

    try {
        // Clear existing syllabus and technique data to prevent duplicates
        await Technique.deleteMany({});
        await Syllabus.deleteMany({});
        console.log("Cleared existing data.");

        // --- ADD ALL YOUR DATA HERE ---

        // 1. Create Techniques
        console.log("Creating techniques...");
        const tech_pins = await Technique.create({ name: 'Pin Tactics', lichessUrl: 'https://lichess.org/practice/basic-tactics/the-pin/256' });
        const tech_forks = await Technique.create({ name: 'Knight Forks', lichessUrl: 'https://lichess.org/practice/basic-tactics/the-fork/257' });
        const tech_openings = await Technique.create({ name: 'Italian Game Opening', lichessUrl: 'https://lichess.org/practice/openings/italian-game/1' });
        const tech_endgames = await Technique.create({ name: 'King and Pawn Endgames', lichessUrl: 'https://lichess.org/practice/endgames/king-and-pawn-endgames/14' });
        console.log("Techniques created.");

        // 2. Create Syllabi and link the techniques
        console.log("Creating syllabi...");
        await Syllabus.create({
            level: 'Beginner',
            techniques: [tech_pins._id, tech_forks._id]
        });

        await Syllabus.create({
            level: 'Intermediate',
            techniques: [tech_openings._id, tech_endgames._id]
        });
        console.log("Syllabi created.");

        //Nothing
        // --- END OF DATA SECTION ---

        console.log('Database seeded successfully! 🌱');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Disconnect from the database
        mongoose.disconnect();
        console.log("MongoDB Disconnected");
    }
};

// Run the seeder
seedDatabase();