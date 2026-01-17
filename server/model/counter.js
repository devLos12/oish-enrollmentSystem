import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  seq: { type: Number, default: 0 } // yung susunod na number
});
const Counter = mongoose.model("Counter", counterSchema);
export default Counter;