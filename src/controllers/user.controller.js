import asyncHandler  from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// --- 1. DEFINE COOKIE OPTIONS GLOBALLY ---
// This ensures consistency across Login, Refresh, and Logout
const COOKIE_OPTIONS = {
    httpOnly: true, // Prevent XSS (Client JS cannot read it)
    secure: true,   // REQUIRED for 'SameSite: None'. Send only over HTTPS.
    sameSite: 'None', // REQUIRED for Cross-Origin (Vercel -> Railway)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days in Milliseconds. Fixes "Browser Close" issue.
};

const generaterefreshandaccesstoken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found for token generation");
        }

        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); 

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role, fullname, countryCode, number } = req.body;
    
    if ([username, email, fullname, password, role, countryCode, number].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }
    
    const phoneNumber = `${countryCode}${number}`; 
    
    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }, { phoneNumber }] 
    });
    
    if (existingUser) {
        throw new ApiError(409, "User with email, username, or phone number already exists");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        role,
        fullname,
        phoneNumber,
    });

    user.refreshToken = user.generateRefreshToken();
    await user.save();

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    res.status(201).json({ message: "User registered successfully", user: createdUser });
});

const userlogin = asyncHandler(async (req, res) => {
    const { password, email } = req.body;
    if(!email) throw new ApiError(400,"Email is required");
    
    const user = await User.findOne({ email });
    if(!user) throw new ApiError(404,"User not found");
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(401,"Invalid password");

    const { accessToken, refreshToken } = await generaterefreshandaccesstoken(user._id);
    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // USE THE FIXED OPTIONS
    return res.status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS) // Optional if you store access token in memory
    .json(
        new ApiResponse(200, {
            user: LoggedInUser,
            accessToken,
            refreshToken
        }, "User logged in successfully")
    );
});

const userlogout = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    // USE THE FIXED OPTIONS (To clear it correctly, options must match)
    return res.status(200)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .json({message:"User logged out successfully"});
});

const refreshTokenHandler = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request: No token");
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?._id);
        
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generaterefreshandaccesstoken(user._id);

        return res.status(200)
        .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            }, "Access token refreshed")
        );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) throw new ApiError(400,"Required fields missing");
    
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");
    
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) throw new ApiError(401, "Invalid old password");
    
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");
  
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");
  
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
  
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "PawnRace Password Reset",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`
    });
  
    res.status(200).json({ message: "Password reset email sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
  
    if (!user) throw new ApiError(400, "Invalid or expired token");
  
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  
    res.status(200).json({ message: "Password reset successful" });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { username, fullname, countryCode, number } = req.body;
    const updateData = {};

    if (username) updateData.username = username.toLowerCase();
    if (fullname) updateData.fullname = fullname;
    if (countryCode && number) updateData.phoneNumber = `${countryCode}${number}`;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated"));
});

export { 
    registerUser, 
    userlogin, 
    userlogout, 
    refreshTokenHandler, 
    changePassword, 
    forgotPassword, 
    resetPassword, 
    updateProfile 
};