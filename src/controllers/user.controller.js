import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/* =========================================================
   COOKIE CONFIG — REFRESH TOKEN ONLY
   ========================================================= */
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,            // REQUIRED for SameSite=None
    sameSite: "None",
    path: "/api/v1/users/refresh-token",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/* =========================================================
   TOKEN GENERATION
   ========================================================= */
const generaterefreshandaccesstoken = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

/* =========================================================
   REGISTER
   ========================================================= */
const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role, fullname, countryCode, number } = req.body;

    if ([email, username, password, role, fullname, countryCode, number]
        .some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const phoneNumber = `${countryCode}${number}`;

    const existingUser = await User.findOne({
        $or: [{ email }, { username }, { phoneNumber }]
    });

    if (existingUser) throw new ApiError(409, "User already exists");

    const user = await User.create({
        email,
        username: username.toLowerCase(),
        password,
        role,
        fullname,
        phoneNumber
    });

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

/* =========================================================
   LOGIN  ✅ FIXED
   ========================================================= */
const userlogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid password");

    const { accessToken, refreshToken } =
        await generaterefreshandaccesstoken(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken
        }, "Login successful"));
});

/* =========================================================
   LOGOUT  ✅ FIXED
   ========================================================= */
const userlogout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1 }
    });

    return res
        .status(200)
        .clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS)
        .json({ message: "Logged out successfully" });
});

/* =========================================================
   REFRESH TOKEN  ✅ FIXED
   ========================================================= */
const refreshTokenHandler = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token");
    }

    const decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } =
        await generaterefreshandaccesstoken(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken
        }, "Token refreshed"));
});

/* =========================================================
   CHANGE PASSWORD
   ========================================================= */
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Required fields missing");
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.isPasswordCorrect(oldPassword);

    if (!isMatch) throw new ApiError(401, "Invalid old password");

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
});

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
        to: user.email,
        subject: "PawnRace Password Reset",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });

    res.status(200).json({ message: "Password reset email sent" });
});

/* =========================================================
   RESET PASSWORD
   ========================================================= */
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256")
        .update(token)
        .digest("hex");

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

/* =========================================================
   UPDATE PROFILE
   ========================================================= */
const updateProfile = asyncHandler(async (req, res) => {
    const { username, fullname, countryCode, number } = req.body;
    const updateData = {};

    if (username) updateData.username = username.toLowerCase();
    if (fullname) updateData.fullname = fullname;
    if (countryCode && number) {
        updateData.phoneNumber = `${countryCode}${number}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated")
    );
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
