import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "1d";

// Register
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email, and password are required.",
                success: false,
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: "Email already in use. Try a different one.",
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await User.create({ username, email, password: hashedPassword });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false,
            });
        }

        let user = await User.findOne({ email }).populate({
            path: "posts",
            match: {}, // Optional filter
            options: { sort: { createdAt: -1 } },
        });

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
            expiresIn: JWT_EXPIRES_IN,
        });

        const { password: _, ...userWithoutPassword } = user.toObject();

        return res
            .cookie("token", token, {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                maxAge: 24 * 60 * 60 * 1000,
            })
            .status(200)
            .json({
                message: `Welcome back ${user.username}`,
                success: true,
                user: userWithoutPassword,
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Logout
export const logout = async (_, res) => {
    try {
        return res
            .cookie("token", "", { maxAge: 0 })
            .status(200)
            .json({
                message: "Logged out successfully.",
                success: true,
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Get Profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId)
            .populate({
                path: "posts",
                options: { sort: { createdAt: -1 } },
            })
            .populate("bookmarks")
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        return res.status(200).json({
            user,
            success: true,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Edit Profile
export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);

            if (!cloudResponse?.secure_url) {
                return res.status(500).json({
                    message: "Image upload failed.",
                    success: false,
                });
            }
        }

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false,
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (cloudResponse) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            success: true,
            user,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Get Suggested Users
export const getSuggestedUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.id } })
            .select("-password")
            .limit(10);

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// Follow or Unfollow
export const followOrUnfollow = async (req, res) => {
    try {
        const currentUserId = mongoose.Types.ObjectId(req.id);
        const targetUserId = mongoose.Types.ObjectId(req.params.id);

        if (currentUserId.equals(targetUserId)) {
            return res.status(400).json({
                message: "You cannot follow/unfollow yourself.",
                success: false,
            });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({
                message: "User not found.",
                success: false,
            });
        }

        const isFollowing = currentUser.following.some(
            (id) => id.toString() === targetUserId.toString()
        );

        if (isFollowing) {
            await Promise.all([
                User.updateOne(
                    { _id: currentUserId },
                    { $pull: { following: targetUserId } }
                ),
                User.updateOne(
                    { _id: targetUserId },
                    { $pull: { followers: currentUserId } }
                ),
            ]);

            return res.status(200).json({
                message: "Unfollowed successfully.",
                success: true,
            });
        } else {
            await Promise.all([
                User.updateOne(
                    { _id: currentUserId },
                    { $addToSet: { following: targetUserId } }
                ),
                User.updateOne(
                    { _id: targetUserId },
                    { $addToSet: { followers: currentUserId } }
                ),
            ]);

            return res.status(200).json({
                message: "Followed successfully.",
                success: true,
            });
        }
    } catch (error) {
        console.error("Follow/unfollow error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};



