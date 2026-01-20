import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/* =========================================================
   VERIFY ACCESS TOKEN (HEADER ONLY)
   ========================================================= */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Unauthorized: No access token");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id)
            .select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user; // Attach full user object
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});

/* =========================================================
   ROLE-BASED AUTHORIZATION
   ========================================================= */
export const verifyRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            throw new ApiError(
                403,
                `Forbidden: You must be a ${role} to perform this action.`
            );
        }
        next();
    };
};
