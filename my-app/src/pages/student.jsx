import React, {useState, useEffect, useContext} from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
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


const Student = () => {

    const { profile, setProfile, setRole, role,  modal, setModal, setStudentAuth, setIsLoggingOut,
        setFormData, trigger

    } = useContext(globalContext);    
    const navigate = useNavigate();


    //fetch profile
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getStudentProfile`, {
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
                    <div className="bg-danger g-0 d-none d-lg-block"
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

export default Student;