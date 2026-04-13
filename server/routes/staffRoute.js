import express from "express";
import { verifyAuth } from "../auth/authMiddleware.js";
import { getTeacherStudents, getTeacherSubjectBySchoolYear } from "../controller/staff/classroom.js";
import { getTeacherSubjectSchedule } from "../controller/staff/schedule.js";





const StaffRouter = express.Router();
// StaffRouter.get("/getTeacherSubjects", verifyAuth, getTeacherSubject );
StaffRouter.get("/getTeacherSubjectsBySchoolYear", verifyAuth, getTeacherSubjectBySchoolYear);
StaffRouter.post("/getTeacherStudents", verifyAuth, getTeacherStudents);
StaffRouter.get('/getTeacherSubjectSchedule', verifyAuth, getTeacherSubjectSchedule);

export default StaffRouter;

