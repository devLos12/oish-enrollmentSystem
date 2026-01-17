import express from "express";
import { studentLogout } from "../controller/logout.js";
import { verifyAuth } from "../auth/authMiddleware.js";
import { changePassword, getStudentProfile, updateProfile, updateStudentProfile } from "../controller/profile.js";
import getClassrooms from "../controller/classroom.js";
import { EnrollStudentFromPortal } from "../controller/student.js";


const StudentRouter = express.Router();

StudentRouter.get('/getStudentProfile', verifyAuth, getStudentProfile);
StudentRouter.get('/getClassrooms', verifyAuth, getClassrooms);
StudentRouter.patch('/student_update/:id', verifyAuth, updateProfile.single('profileImage'), updateStudentProfile);
StudentRouter.post('/EnrollStudentFromPortal', verifyAuth, EnrollStudentFromPortal);
StudentRouter.get('/studentLogout', studentLogout);


export default StudentRouter;