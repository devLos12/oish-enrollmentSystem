import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SideBar from "../components/sidebar.jsx";
import Header from "../components/header.jsx";
import { globalContext } from "../context/global.jsx";
import { useNavigate } from "react-router-dom";
import Modal from "../components/modal.jsx";

import Applicants from "../components/applicants.jsx";
import StudentManagement from "../components/studentManagement.jsx";
import SectionManagement from "../components/sectionmanagement.jsx";
import Subjects from "../components/subjects.jsx";
import { Step1, Step2, Step3 } from "../pages/enrollmentForm.jsx";
import RegistrationViewForm from "../components/registrationViewForm.jsx";
import Announcement from "../components/announcement.jsx";
import Dashboard from "../components/teacher/dashboard.jsx";
import EditProfile from "../components/teacher/editProfile.jsx";
import ChangePassword from "../components/changepassword.jsx";
import Logs from "../components/logs.jsx";
import EditStudent from "../components/editStudent.jsx"; 
import EnrollmentFormPDF from "../components/printView.jsx";
import ClassRoom from "../components/teacher/classroom.jsx";
import Students from "../components/teacher/students.jsx";
import TeacherScheduleTable from "../components/teacher/schedule.jsx";
import { io } from "socket.io-client";




const Staff =  () => {
     const { profile, trigger, setProfile, setRole, modal, setModal, setStaffAuth, setIsLoggingOut,
        fetchPendingApplicantsCount
    } = useContext(globalContext);
    const navigate = useNavigate();




    
    useEffect(() => {
        // Load count on mount
        fetchPendingApplicantsCount();

        // Setup socket connection
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true
        });

        // Listen for new enrollments
        socket.on('new-enrollment', (data) => {
            // Update count real-time
            fetchPendingApplicantsCount();
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, []);





     //fetch profile
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getProfile`, {
            method: "GET",
            credentials: "include"
        })
        .then( async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            setProfile(data);
        })
        .catch((error) => {
            console.log("Error: ", error.message);
        });
    },[trigger]);





    const routes = [
        // {path: "/",                             element: <Dashboard/> },
        {path: "/",                             element: <Dashboard/> },
        {path: "applicants",                    element: <Applicants/>},

        // {path: "applicant_form/step1",          element: <Step1 />},
        // {path: "applicant_form/step2",          element: <Step2 />},
        // {path: "applicant_form/step3",          element: <Step3 />},
        // {path: "subjects",                      element: <Subjects/>},
        // {path: "student_management",            element: <StudentManagement/> },
        {path: "registration_form",             element: <RegistrationViewForm/>},
        // {path: "section_management",            element: <SectionManagement/> },
        // {path: "announcement",                  element: <Announcement/> },
        // {path: "logs",                          element: <Logs/> },
        {path: "edit_profile",                  element: <EditProfile/>},
        {path: "change_password",               element: <ChangePassword/>},
        {path: "edit_student",                  element: <EditStudent/> },
        {path: "enrollmentpdf",                 element: <EnrollmentFormPDF/>},
        {path: "classroom",                     element: <ClassRoom/>},
        {path: "students",                      element: <Students/>},
        {path: "schedule",                      element: <TeacherScheduleTable/>},
        // {path: "schedule",                      element: <Schedule/>},
        {path: "*",                             element: <Navigate to={"/404_forbidden"}/>}
        
    ]


    return (
        
        <>
        <div className="container-fluid"
        
        style={{
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent"
        }}
        
        >
            <div className="row ">
                <div className={`bg-danger g-0  d-none d-xl-block`} 
                style={{width: "250px"}}

                >
                    <div className="vh-100 px-2 "
                    style={{
                        scrollbarWidth: "hidden",
                        overflowY: "scroll",
                    }}
                    >
                        <SideBar/>
                    </div>
                </div>

                <div className="col bg-light vh-100 g-0 border-left border"
                >
                    <div className="col-12 ">
                        <Header/>
                    </div>
                     <div className="col p-2 p-md-0" 
                    style={{
                            maxHeight:"89vh",
                            overflowY: "auto",
                            scrollbarWidth: "thin",
                            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent"
                            }}
                    id="scrollContainer"
                    >
                        <Routes>
                            {routes.map((data, i) => (
                                <Route key={i} path={data.path} element={data.element} />
                            ))}
                        </Routes>
                    </div>
                </div>
            </div>
        </div>

        {modal?.isShow && <Modal textModal={modal?.text}
        handleClickYes={()=> {

            setModal((prev) => ({
                ...prev, isShow: false, text: ""
            }) )

            setIsLoggingOut(true);
            setStaffAuth(false);

            fetch(`${import.meta.env.VITE_API_URL}/api/Logout`, {
                method: "GET",
                credentials: "include"
            })
            .then((res) => res.json())
            .then((data) => {
                console.log(data.message);
                
                setRole(null);
                navigate("/", { replace: true });

            })
            .catch((err) => console.log("Error: ", err.message ));
            
        }}
        handleClickNo={()=> setModal((prev) => ({
            ...prev, isShow: false, text: ""
        }))}
        />}              
        </>
    )
}

export default Staff;