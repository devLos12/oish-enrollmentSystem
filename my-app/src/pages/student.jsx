import React, {useState, useEffect, useContext, useRef} from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import SideBar from "../components/sidebar";
import { globalContext } from "../context/global";
import Modal from "../components/modal.jsx";
import Header from "../components/header";
import Dashboard from "../components/student/dashbaord.jsx";
import Registration from "../components/student/registration.jsx";
import RegistrationViewForm from "../components/registrationViewForm.jsx";
import ClassRoom from "../components/student/classroom.jsx";
import StudentTable from "../components/student/classmate.jsx";
import EditProfile from "../components/student/editprofile.jsx";
import ChangePassword from "../components/changepassword.jsx";
import { useLayoutEffect } from "react";
import { io } from "socket.io-client";




const Student = () => {

    const { profile, setProfile, setRole, role,  modal, setModal, setStudentAuth, setIsLoggingOut,
        setFormData, trigger, 

    } = useContext(globalContext);    
    const navigate = useNavigate();
    const location = useLocation();

    const [isAutoLoggingOut, setIsAutoLoggingOut] = useState(false);

    const isLoggingOutRef = useRef(false);

    const isOnChangePassword = location.pathname.includes('change_password');




    const handleForceLogout = async () => {
        setIsAutoLoggingOut(true); // show loader muna


        setTimeout(() => {
            navigate("/", { replace: true });  // Navigate FIRST
            
            // Clear states & logout AFTER navigation
            setTimeout(() => {

                fetch(`${import.meta.env.VITE_API_URL}/api/studentLogout`, {
                    method: "GET",
                    credentials: "include"
                })
                .then((res) => res.json())
                .then((data) => {
                    setStudentAuth(false);
                    setRole(null);
                    setProfile(null);
                })
                .catch((err) => console.error("Logout error:", err));

            }, 100);  // Small delay para ma-execute na ang navigate
        }, 2500); // 2.5 seconds bago mag-redirect
    };


    
    //fetch profile
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getStudentProfile`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();

            // ✅ Student deleted na (reverted to pending) — force logout
            if (res.status === 404 && data.code === "STUDENT_NOT_FOUND") {
                handleForceLogout();
                return;
            }


            if (!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            if (data) setProfile(data);
        })
        .catch((error) => {
            console.log("Error: ", error.message);
        });
    }, [trigger]);



    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL, {
            withCredentials: true
        });

        socket.on("student-reverted", (data) => {
            if (profile?.email === data.email) {
                handleForceLogout();
            }
        });

        return () => socket.disconnect(); // cleanup!
    }, [profile]);






    const routes = [
        {path: "/",                      element: <Dashboard/>},
        {path: "registration_form",      element: <Registration/>},
        {path: "download",               element: <RegistrationViewForm/>},
        {path: "classroom",              element: <ClassRoom/>},
        {path: "change_password",        element: <ChangePassword/>},
        {path: "students",               element: <StudentTable/>},
        {path: "edit_profile",           element: <EditProfile/>},
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
                    <div className="bg-red g-0 d-none d-lg-block"
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
                        <div className="col" style={{ maxHeight: "89vh", overflowY: "auto"}}
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

            {/* ✅ First Login Blocking Modal */}
            {profile?.isFirstLogin === true && !isOnChangePassword && (
                <>
                    {/* Backdrop */}
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9998 }}
                    />

                    {/* Modal — shadcn style */}
                    <div
                        className="position-fixed top-50 start-50 translate-middle bg-white shadow"
                        style={{ 
                            zIndex: 9999, 
                            width: "90%", 
                            maxWidth: "420px",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb"
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 pt-4 pb-3 border-bottom">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="fa fa-lock text-dark" style={{ fontSize: "16px" }}></i>
                                <h6 className="fw-semibold mb-0" style={{ fontSize: "15px" }}>Security Notice</h6>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                                Action required before continuing
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4">
                            <p className="mb-0" style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>
                                This is your <strong>first login</strong>. For your security, you must 
                                change your temporary password before accessing the system.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-4 d-flex justify-content-end gap-2">
                            <button
                                onClick={() => navigate(`/${role}/change_password`, { replace: true })}
                                className="btn btn-dark btn-sm px-4"
                                style={{ fontSize: "13px", borderRadius: "6px" }}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </>
            )}



            {modal?.isShow  && <Modal textModal={modal?.text}
                handleClickYes={()=> {

                    setModal((prev) => ({
                        ...prev, isShow: false, text: ""
                    }) )

                    setIsLoggingOut(true);
                    setStudentAuth(false);
                    setFormData({});
                    
                    fetch(`${import.meta.env.VITE_API_URL}/api/studentLogout`, {
                        method: "GET",
                        credentials: "include"
                    })
                    .then((res) => res.json())
                    .then((data) => {

                        setRole(null);
                        navigate("/", { replace: true });
                    })
                    .catch((err) => console.log("Error: ", err.message ));
                    
                }}
                handleClickNo={()=> setModal((prev) => ({
                    ...prev, isShow: false, text: ""
                }))}
            />}


            {/*Auto Logout Overlay */}
            {isAutoLoggingOut && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 99999 }}
                >
                    <div className="text-center text-white">
                        {/* Spinner */}
                        <div className="mb-4">
                            <div
                                className="spinner-border"
                                style={{ width: "48px", height: "48px", color: "#dc3545" }}
                                role="status"
                            />
                        </div>

                        {/* Message */}
                        <h5 className="fw-semibold mb-2">Session Ended</h5>
                        <p className="text-white-50 mb-0" style={{ fontSize: "14px" }}>
                            Your account has been updated by the administrator.
                            <br/>
                            You will be redirected shortly...
                        </p>
                    </div>
                </div>
            )}


        </>
    )
}

export default Student;