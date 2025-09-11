import { Schema, models, model } from "mongoose";

const ChatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: {
      type: String,
      required: function() {
        return !this.imageUrl;
      },
      default: "",
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default models.Chat || model("Chat", ChatSchema);