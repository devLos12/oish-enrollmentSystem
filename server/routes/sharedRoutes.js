import express from "express";
import { Logout } from "../controller/logout.js";
import { accessGeneratedCode, accessGmailCode } from "../controller/admin/accessCode.js";
import { createFacultyMember, deleteStaff, getStaffList, updateStaff } from "../controller/stafffManagement.js";
import { createSubject, bulkAddSubjects,
deleteSubject, getAllSubjects, updateSubject, getAllTeachers, getSubjectSection,
getSubjectDetails, addSubjectSection, updateSubjectSection, deleteSubjectSection  
} from "../controller/subject.js";
import { ApplicantApproval, deleteApplicant, GetAllEnrollments, rejectApplicant } from "../controller/enrollment.js";
import { deleteStudent, getStudents, getAssignSections, updateStudent, setStudentsPending, createStudent } from "../controller/student.js";
import { createSection, deleteSection, getSections, updateEnrollmentStatus, updateSection } from "../controller/sectionManagement.js";
import { getEnrollmentStats, getEnrollmentStatsByGrade } from "../controller/dashboard.js";
import { getEnrollmentStatsByStrand, getEnrollmentStatsByTrack } from "../controller/dashboard.js";
import { uploadFiles, addAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from "../controller/announcement.js";
import {verifyAuth} from "../auth/authMiddleware.js";
import { getProfile, UpdateProfile, updateProfile } from "../controller/profile.js";
import { changePassword } from "../controller/profile.js";
import { getLogs, } from "../controller/logs.js";
import { deleteEmailHistory, getAllEmails, getAllStudents, scheduleRequirements } from "../controller/schedule.js";


const SharedRouter = express.Router();

SharedRouter.get('/generate_code', accessGeneratedCode);
SharedRouter.get('/getApplicants', GetAllEnrollments);
SharedRouter.post('/gmail_code', accessGmailCode);
SharedRouter.get('/staff_list', getStaffList);
SharedRouter.post("/create_facultyAccount", verifyAuth, createFacultyMember);
SharedRouter.patch('/staff_update/:id', updateStaff);
SharedRouter.delete('/staff_delete/:id', deleteStaff);
SharedRouter.post('/addSubjects', createSubject);
SharedRouter.post('/bulkAddSubjects', bulkAddSubjects);

SharedRouter.get('/getSubjects', verifyAuth, getAllSubjects);
SharedRouter.get('/getTeachers',verifyAuth, getAllTeachers);
SharedRouter.get('/getSubjetSections', verifyAuth, getSubjectSection);
SharedRouter.get('/getSubjectDetails/:id', verifyAuth, getSubjectDetails);
SharedRouter.post('/addSubjectSection/:id', verifyAuth, addSubjectSection);
SharedRouter.patch("/updateSubjectSection/:id/:sectionId", updateSubjectSection);
SharedRouter.delete("/deleteSubjectSection/:id/:sectionId", deleteSubjectSection);

SharedRouter.patch('/updateSubjects/:id', updateSubject);
SharedRouter.delete('/deleteSubject/:id', deleteSubject);
SharedRouter.patch('/approveApplicant', ApplicantApproval);
SharedRouter.patch('/rejectApplicant/:id', rejectApplicant);
SharedRouter.delete('/removeApplicant/:id', deleteApplicant);
SharedRouter.get('/getStudents', getStudents);
SharedRouter.get('/getSections', verifyAuth, getAssignSections);
SharedRouter.post('/createStudent', verifyAuth, createStudent);
SharedRouter.patch('/updateStudent/:id', updateStudent);
SharedRouter.delete('/deleteStudent/:id', deleteStudent);
SharedRouter.get('/sections', getSections);
SharedRouter.post('/addSection', createSection);
SharedRouter.patch('/updateSection/:id', updateSection);
SharedRouter.delete('/deleteSection/:id', deleteSection);
SharedRouter.get("/announcements", getAnnouncements);
SharedRouter.post("/addAnnouncement", uploadFiles, addAnnouncement);
SharedRouter.patch("/updateAnnouncement/:id",  uploadFiles, updateAnnouncement);
SharedRouter.delete('/deleteAnnouncement/:id', deleteAnnouncement);
SharedRouter.get('/dashboardStats', getEnrollmentStats);
SharedRouter.get('/enrollmentStatsByGrade', getEnrollmentStatsByGrade);
SharedRouter.get('/enrollmentStatsByTrack', getEnrollmentStatsByTrack);
SharedRouter.get('/enrollmentStatsByStrand', getEnrollmentStatsByStrand);
SharedRouter.put('/setStudentsPending', setStudentsPending);
SharedRouter.patch('/updateEnrollment/:id', updateEnrollmentStatus);
SharedRouter.get('/getProfile', verifyAuth, getProfile);
SharedRouter.patch('/updateProfile', verifyAuth, updateProfile.single('profileImage'),  UpdateProfile);
SharedRouter.patch('/change_password', verifyAuth, changePassword);
SharedRouter.get('/getLogs', verifyAuth, getLogs);
SharedRouter.get('/getAllStudents', verifyAuth, getAllStudents);
SharedRouter.post('/scheduleRequirements', verifyAuth, scheduleRequirements);
SharedRouter.get('/getEmailHistory', verifyAuth, getAllEmails);
SharedRouter.delete('/deleteEmailHistory', verifyAuth, deleteEmailHistory);
SharedRouter.get("/Logout", verifyAuth, Logout);


export default SharedRouter;