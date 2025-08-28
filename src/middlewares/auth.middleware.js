import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
        throw new ApiError(401, "No token provided");
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded; // Attach decoded user info to request object
        const user= await User.findById(decoded?._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(404, "User not found");
        } 
        req.user= user; // Attach full user details to request object
        next(); 
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
    
});

export const verifyRole = (role) => {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            throw new ApiError(403, `Forbidden: You must be a ${role} to perform this action.`);
        }
        next();
    };
};