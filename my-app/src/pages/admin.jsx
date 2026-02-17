import React, {useState, useEffect, useContext} from "react";
import Header from "../components/header.jsx";
import Modal from "../components/modal.jsx";
import { useNavigate , Navigate } from "react-router-dom";
import { globalContext } from "../context/global.jsx";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../components/dashboard.jsx";
import SideBar from "../components/sidebar.jsx";
import GmailCodeForm from "../components/admin/gmailCodeForm.jsx";
import GenerateCodeForm from "../components/admin/generateCodeForm.jsx";
import StaffManagement from "../components/staffManagement.jsx";
import Subjects from "../components/subjects.jsx";
import Applicants from "../components/applicants.jsx";
import { Step1, Step2, Step3 } from "../pages/enrollmentForm.jsx";
import StudentManagement from "../components/studentManagement.jsx";
import SectionManagement from "../components/sectionmanagement.jsx";
import RegistrationViewForm from "../components/registrationViewForm.jsx";
import Announcement from "../components/announcement.jsx";
import EditStudent from "../components/editStudent.jsx";
import Footer from "../components/footer.jsx";
import Logs from "../components/logs.jsx";
import EnrollmentFormPDF from "../components/printView.jsx";
import Schedule from "../components/schedule.jsx";
import image from "../assets/image/logo.png";
import SubjectDetails from "../components/subjectDetails.jsx";
import { io } from "socket.io-client";




const Admin = () => {
    const { profile, setProfile, setRole, role,  modal, setModal, setAdminAuth, setIsLoggingOut,
        setFormData, fetchPendingApplicantsCount, fetchPendingStudentsCount

    } = useContext(globalContext);
    const navigate = useNavigate();



    useEffect(() => {
        fetchPendingApplicantsCount();
        fetchPendingStudentsCount();     // Increase students count (if status = pending)


        // Setup socket connection
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true
        });

        // Listen for new enrollments
        socket.on('new-enrollment', (data) => {
            // Update count real-time
            fetchPendingApplicantsCount();
        });

        socket.on('new-approve', (data) => {
            fetchPendingApplicantsCount();  // Decrease applicants count
            fetchPendingStudentsCount();     // Increase students count (if status = pending)
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    
    const routes = [
        {path: "",                      element: <Dashboard/>},
        {path: "subjects",              element: <Subjects/>},
        {path: "subject_details",       element: <SubjectDetails/>},
        // {path: "gmail_code",            element: <GmailCodeForm/>},
        {path: "generate_code",         element: <GenerateCodeForm/> },
        {path: "staff_member",          element: <StaffManagement/> },
        {path: "student_management",    element: <StudentManagement/> },
        {path: "section_management",    element: <SectionManagement/>},
        {path: "applicants",            element: <Applicants />},
        {path: "applicant_form/step1",  element: <Step1 />},
        {path: "applicant_form/step2",  element: <Step2 />},
        {path: "applicant_form/step3",  element: <Step3 />},
        {path: "registration_form",     element: <RegistrationViewForm/>},
        {path: "announcement",          element: <Announcement/> },
        {path: "edit_student",          element: <EditStudent/> },
        {path: "logs",                  element: <Logs/> },
        {path: "enrollmentpdf",         element: <EnrollmentFormPDF/>},
        {path: "schedule",              element: <Schedule/>},
        {path: "*",                      element: <Navigate to={"/404_forbidden"}/>}

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
                <div className={`bg-red g-0  d-none d-xl-block`} 
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
        
        
        {modal?.isShow  && <Modal textModal={modal?.text}
        handleClickYes={()=> {

            setModal((prev) => ({
                ...prev, isShow: false, text: ""
            }) )

            setIsLoggingOut(true);

            setAdminAuth(false);
            setFormData({});
            
            fetch(`${import.meta.env.VITE_API_URL}/api/Logout`, {
                method: "GET",
                credentials: "include"
            })
            .then((res) => res.json())
            .then((data) => {
                console.log(data.message);
                
                setRole(null);
                navigate("/", { replace: true });
                
                setTimeout(()=>{
                    setIsLoggingOut(false);
                },2000);
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

export default Admin;