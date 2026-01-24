import express from "express";
import LoginPortal from "../controller/login.js";
import { UrlAuthentication } from "../auth/authMiddleware.js";
import { StaffRegistration } from "../controller/registration.js";
import {EnrollmentRegistration, enrollmentUpload } from "../controller/enrollment.js";
import { getAnnouncements } from "../controller/announcement.js";
import {  changePassword, requestCode, verifyCode } from "../controller/forgotPassword.js";



const HomeRouter = express.Router();

HomeRouter.get("/urlAuthentication", UrlAuthentication);
HomeRouter.post('/staff_registration', StaffRegistration);
HomeRouter.post('/enrollment', enrollmentUpload, EnrollmentRegistration);

HomeRouter.get('/getHomeAnnouncement', getAnnouncements);
HomeRouter.post('/requestCode', requestCode);
HomeRouter.post('/verifyCode', verifyCode);
HomeRouter.post('/changePassword', changePassword);
HomeRouter.post("/login", LoginPortal);

export default HomeRouter;