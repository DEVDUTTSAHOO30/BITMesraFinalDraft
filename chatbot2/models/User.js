import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true }, 
    name: { type: String }, 
    email: { type: String }, 
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
