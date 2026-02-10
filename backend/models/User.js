const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  role: {
    type: String,
    enum: ["admin", "driver", "user"],
    default: "user"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
