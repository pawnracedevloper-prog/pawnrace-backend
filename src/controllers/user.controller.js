import asyncHandler  from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import  ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";


const registerUser = asyncHandler(async (req, res) => {
    // 1. Get user details from request body
    const { email, username, password, role, fullname, countryCode, number } = req.body;

    // 2. Validate fields
    if ([username, email, fullname, password, role, countryCode, number].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Combine phone number in E.164 format
    const phoneNumber = `${countryCode}${number}`; // e.g. +91 + 9876543210 → +919876543210

    // 4. Check if user already exists (by username/email/phone)
    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }, { phoneNumber }] 
    });
    if (existingUser) {
        throw new ApiError(409, "User with email, username, or phone number already exists");
    }

    // 5. Handle profile image upload
    const profileImagePath = req.files?.profileImage?.[0]?.path;
    if (!profileImagePath) {
        throw new ApiError(400, "Profile image is required");
    }

    const profileImage = await uploadOnCloudinary(profileImagePath);
    if (!profileImage) {
        throw new ApiError(500, "Failed to upload profile image");
    }

    // 6. Create and save the new user
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        role,
        fullname,
        phoneNumber,
        profileImage: profileImage.url
    });

    user.refreshToken = user.generateRefreshToken();
    await user.save();

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    res.status(201).json({ message: "User registered successfully", user: createdUser });
});


const generaterefreshandaccesstoken = async (userId) => {
    try {
        const user = await User.findById(userId); // FIX: await here
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

const  userlogin = asyncHandler(async (req, res) => {
    const {password,email} = req.body;
     if(! email){
        throw new ApiError(400,"Email is required");
     }
    const user =await User.findOne({email});
     if(!user){
        throw new ApiError(404,"User not found");
     }
     const isPasswordValid = await user.isPasswordCorrect(password);
     if(!isPasswordValid){
        throw new ApiError(401,"Invalid password");
     }

     const { accessToken, refreshToken } = await generaterefreshandaccesstoken(user._id);

     const LoggedInUser = await User.findById(user._id).select("-password -refreshToken");
     const options = {
        httpOnly: true, // Prevents client-side access to the cookie
        secure: true
     }
     return res.status(200)
     .cookie("refreshToken", refreshToken, options)
     .cookie("accessToken", accessToken, options)
     .json(
        new ApiResponse(200,{
            user: LoggedInUser,
            accessToken,
            refreshToken
        }, "User logged in successfully")
     )

});

const userlogout = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true, // Prevents client-side access to the cookie
        secure: true
     }
        return res.status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json({message:"User logged out successfully"});

});

const refreshTokenHandler = asyncHandler(async(req,res)=>{
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if(!token){
        throw new ApiError(401,"No token provided");
    }
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?._id);
        if(!user || user.refreshToken !== token){
            throw new ApiError(403,"Invalid refresh token");
        }
        const { accessToken,refreshToken:  newrefreshToken } = await generaterefreshandaccesstoken(user._id);
        const options = {
            httpOnly: true, // Prevents client-side access to the cookie
            secure: true
         }
         return res.status(200)
         .cookie("refreshToken", newrefreshToken, options)
         .cookie("accessToken", accessToken, options)
         .json(
            new ApiResponse(200,{
                accessToken,
                refreshToken: newrefreshToken
            }, "Token refreshed successfully")
         )
    } catch (error) {
        throw new ApiError(401,"Invalid or expired token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Old Password and New Password are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) {
        throw new ApiError(401, "Invalid old password");
    }
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

    if (!username || !fullname) {
        throw new ApiError(400, "Username and Fullname are required");
    }

    if (username) updateData.username = username.toLowerCase();
    if (fullname) updateData.fullname = fullname;

    // Handle phone update
    if (countryCode && number) {
        updateData.phoneNumber = `${countryCode}${number}`;
    }

    // Handle profile image update
    const profileImagePath = req.files?.profileImage?.[0]?.path;
    if (profileImagePath) {
        try {
            const profileImage = await uploadOnCloudinary(profileImagePath);
            updateData.profileImage = profileImage.url;
        } catch (err) {
            console.error("Cloudinary error:", err);
            return res.status(500).json({ error: "Failed to upload avatar", details: err.message });
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User details updated successfully"));
});


export { registerUser 
    , userlogin 
    , userlogout 
    , refreshTokenHandler 
    , changePassword 
    , forgotPassword 
    , resetPassword 
    , updateProfile

};