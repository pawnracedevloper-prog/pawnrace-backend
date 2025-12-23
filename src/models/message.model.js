import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    // Same for both users → easy fetch
    conversationId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
