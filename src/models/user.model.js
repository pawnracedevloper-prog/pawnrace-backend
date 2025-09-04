import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Schema, model } = mongoose;
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'coach'],
        default: 'student',
        required: true,
    },
    refreshToken: {
        type: String,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\+\d{1,3}\d{6,14}$/, "Please enter a valid phone number with country code"]
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        { _id: this._id, username: this.username, email: this.email, fullname : this.fullname },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}

userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

export const User = model('User', userSchema);

