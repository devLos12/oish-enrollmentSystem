import express from "express";
import { Logout } from "../controller/logout.js";
import { accessGeneratedCode, accessGmailCode, getAccessCodeLogs } from "../controller/admin/accessCode.js";
import { createFacultyMember, deleteStaff, getStaffList, updateStaff } from "../controller/stafffManagement.js";
import { createSubject, bulkAddSubjects,
deleteSubject, getAllSubjects, updateSubject, getAllTeachers, getSubjectSection,
getSubjectDetails, addSubjectSection, bulkAddSubjectSections, updateSubjectSection, deleteSubjectSection,  
updateScheduleDays
} from "../controller/subject.js";
import { Add_Applicants, ApplicantApproval, deleteApplicant, GetAllEnrollments, rejectApplicant, revertToPending } from "../controller/enrollment.js";
import { deleteStudent, getStudents, getAssignSections, updateStudent, setStudentsPending, createStudent, 
markAsGraduated, 
bulkAssignSection} from "../controller/student.js";
import { addStudentToSection, createSection, deleteSection, getSectionById, getSections, 
    removeStudentFromSection, searchStudentForSection, updateEnrollmentStatus, updateSection,
    bulkAddSections 

} from "../controller/sectionManagement.js";
import { getDashboardSchoolYears, getEnrollmentStats, getEnrollmentStatsByGrade, getStudentsByCategory } from "../controller/dashboard.js";
import { getEnrollmentStatsByStrand, getEnrollmentStatsByTrack } from "../controller/dashboard.js";
import { uploadFiles, addAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from "../controller/announcement.js";
import {verifyAuth} from "../auth/authMiddleware.js";
import { getProfile, UpdateProfile, updateProfile } from "../controller/profile.js";
import { changePassword } from "../controller/profile.js";
import { getLogs, } from "../controller/logs.js";
import { deleteEmailHistory, getAllEmails, getAllStudents, scheduleRequirements } from "../controller/schedule.js";
import { activateSchoolYear, createSchoolYear, getSchoolYears, toggleEnrollmentStatus, getAllSchoolYears, setCurrentSchoolYear, getActiveSchoolYear, deleteSchoolYear, } from "../controller/schoolYear-semester.js";

import { enrollmentUpload, Update_Applicant } from "../controller/enrollment.js";
import { bulkApproveApplicants } from "../controller/enrollment.js";




// Import sa taas:
import {
    getAllPrograms,
    getActivePrograms,
    createTrack,
    updateTrack,
    deleteTrack,
    addStrand,
    updateStrand,
    deleteStrand,
} from "../controller/program.js";
import { deleteQRCode, generateQRCode, getQRCodes, updateQRCode } from "../controller/generate-qr-code.js";
 




const SharedRouter = express.Router();

SharedRouter.get('/generate_code', accessGeneratedCode);
SharedRouter.get('/access_code_logs', getAccessCodeLogs);
SharedRouter.get('/getApplicants', GetAllEnrollments);


SharedRouter.post('/gmail_code', accessGmailCode);
SharedRouter.get('/staff_list', getStaffList);
SharedRouter.post("/create_facultyAccount", verifyAuth, createFacultyMember);
SharedRouter.patch('/staff_update/:id', updateStaff);
SharedRouter.delete('/staff_delete/:id', deleteStaff);
SharedRouter.post('/addSubjects', verifyAuth, createSubject);
SharedRouter.post('/bulkAddSubjects', verifyAuth, bulkAddSubjects);

SharedRouter.get('/getSubjects', verifyAuth, getAllSubjects);
SharedRouter.get('/getTeachers',verifyAuth, getAllTeachers);
SharedRouter.get('/getSubjetSections', verifyAuth, getSubjectSection);
SharedRouter.get('/getSubjectDetails/:id', verifyAuth, getSubjectDetails);
SharedRouter.post('/addSubjectSection/:id', verifyAuth, addSubjectSection);
SharedRouter.post("/bulkAddSubjectSections/:id",verifyAuth, bulkAddSubjectSections);
SharedRouter.patch("/updateSubjectSection/:id/:sectionId", verifyAuth, updateSubjectSection);
SharedRouter.delete("/deleteSubjectSection/:id/:sectionId", verifyAuth, deleteSubjectSection);
SharedRouter.patch('/updateSectionScheduleDays/:subjectId', verifyAuth, updateScheduleDays);

SharedRouter.patch('/updateSubjects/:id', verifyAuth, updateSubject);
SharedRouter.delete('/deleteSubject/:id', verifyAuth, deleteSubject);
SharedRouter.patch('/approveApplicant', verifyAuth, ApplicantApproval);
SharedRouter.patch('/rejectApplicant/:id', verifyAuth, rejectApplicant);
SharedRouter.delete('/removeApplicant/:id', verifyAuth, deleteApplicant);
SharedRouter.get('/getStudents', getStudents);
SharedRouter.get('/getSections', verifyAuth, getAssignSections);
SharedRouter.post('/createStudent', verifyAuth, createStudent);
SharedRouter.patch('/updateStudent/:id', verifyAuth,  updateStudent);
SharedRouter.delete('/deleteStudent/:id', verifyAuth, deleteStudent);
SharedRouter.patch('/markAsGraduated/:id', verifyAuth, markAsGraduated);
SharedRouter.post('/bulkAssignSection', verifyAuth, bulkAssignSection);

SharedRouter.get('/sections', getSections);
SharedRouter.post('/addSection', verifyAuth, createSection);
SharedRouter.post('/bulkAddSections', verifyAuth, bulkAddSections);
SharedRouter.patch('/updateSection/:id', verifyAuth, updateSection);
SharedRouter.delete('/deleteSection/:id', verifyAuth, deleteSection);
SharedRouter.get("/announcements", verifyAuth, getAnnouncements);
SharedRouter.post("/addAnnouncement",  uploadFiles, addAnnouncement);
SharedRouter.patch("/updateAnnouncement/:id",  uploadFiles, updateAnnouncement);
SharedRouter.delete('/deleteAnnouncement/:id', deleteAnnouncement);
SharedRouter.get('/dashboardStats', getEnrollmentStats);
SharedRouter.get('/enrollmentStatsByGrade', getEnrollmentStatsByGrade);
SharedRouter.get('/enrollmentStatsByTrack', getEnrollmentStatsByTrack);
SharedRouter.get('/enrollmentStatsByStrand', getEnrollmentStatsByStrand);
SharedRouter.get("/studentsByCategory", getStudentsByCategory);


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
SharedRouter.patch('/revertToPending/:id', verifyAuth, revertToPending);



SharedRouter.patch('/set-current-school-year/:id', verifyAuth, setCurrentSchoolYear);
SharedRouter.post('/create-school-year', verifyAuth, createSchoolYear);
SharedRouter.delete('/delete-school-year/:id', verifyAuth, deleteSchoolYear);  // Reusing activateSchoolYear for deletion since it already checks if the school year is active or not.
SharedRouter.get('/get-school-years', verifyAuth, getSchoolYears);




// Reusing activateSchoolYear for deletion since it already checks if the school year is active or not.
SharedRouter.get('/getAllSchoolYears', getAllSchoolYears);  // ✅ Moved from homeRouter
SharedRouter.patch('/update-school-year/:id', verifyAuth, activateSchoolYear);
SharedRouter.patch('/toggleEnrollmentStatus', toggleEnrollmentStatus);  // ✅ New endpoint to toggle enrollment
SharedRouter.get('/dashboard-school-years', verifyAuth, getDashboardSchoolYears);



SharedRouter.get('/sections/search-student', searchStudentForSection);
SharedRouter.get('/sections/:id', getSectionById);
SharedRouter.post('/sections/:id/add-student', verifyAuth,  addStudentToSection);
SharedRouter.delete('/sections/:id/remove-student/:studentId', verifyAuth, removeStudentFromSection);



SharedRouter.get('/activeSchoolYear', verifyAuth, getActiveSchoolYear);




// ── Program / Track / Strand Routes ──


SharedRouter.get('/getActivePrograms', getActivePrograms);             // active only (dropdowns)

SharedRouter.get('/getPrograms', verifyAuth, getAllPrograms);           // all (admin)
SharedRouter.post('/addTrack', verifyAuth, createTrack);
SharedRouter.patch('/updateTrack/:id', verifyAuth, updateTrack);
SharedRouter.delete('/deleteTrack/:id', verifyAuth, deleteTrack);
 
SharedRouter.post('/addStrand/:trackId', verifyAuth, addStrand);
SharedRouter.patch('/updateStrand/:trackId/:strandId', verifyAuth, updateStrand);
SharedRouter.delete('/deleteStrand/:trackId/:strandId', verifyAuth, deleteStrand);


SharedRouter.post('/add-applicant', verifyAuth, enrollmentUpload, Add_Applicants);
SharedRouter.put('/update-applicant/:id', verifyAuth, enrollmentUpload, Update_Applicant);


SharedRouter.post("/generate-qr-code", verifyAuth, generateQRCode);
SharedRouter.get("/qr-codes", verifyAuth, getQRCodes);
SharedRouter.patch('/qr-codes/:id', verifyAuth, updateQRCode);
SharedRouter.delete('/qr-codes/:id', verifyAuth, deleteQRCode);


SharedRouter.post('/bulkApproveApplicants', verifyAuth, bulkApproveApplicants);


SharedRouter.get("/Logout", verifyAuth, Logout);

export default SharedRouter;