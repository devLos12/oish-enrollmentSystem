import mongoose  from "mongoose";

const adminSchema = new mongoose.Schema({}, { strict: false });
const Admin = mongoose.model('Admin', adminSchema, 'admins');

export default Admin;

