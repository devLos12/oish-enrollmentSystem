import React,{ useContext, useEffect }from "react";
import Header from "../components/home/header.jsx";
import Home from "../components/home/home.jsx";
import About from "../components/home/about.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Footer from "../components/footer.jsx";
import Login from "./login.jsx";
import UrlForbidden from "./urlForbidden.jsx";
import StaffRegistration from "./staffRegistration.jsx";
import { Step1, Step2, Step3 } from "./enrollmentForm.jsx";
import Announcement from "../components/home/annoucement.jsx";
import Programs from "../components/home/programs.jsx";
import ForgotPassword from "../components/forgotpassword.jsx";


const Layout = () => {

    return (
        <>
        <Header />
      
        <Routes>
            <Route path="/" element={
                <main>
                    {[
                        { id: "home",         element: <Home/> },
                        { id: "announcement", element: <Announcement/> },
                        { id: "programs",     element: <Programs/>  },
                        { id: "about",        element: <About/> },
                    ].map((data, i) => (
                        <section key={i} id={data.id}
                        style={{scrollMarginTop: "80px"}}
                        className="mt-5"
                        >
                            <div className="">
                                {data.element}
                            </div>
                        </section>
                    ))} 
                </main>
            }/>
            <Route path="enrollment/step1"   element={<Step1/> }/>
            <Route path="enrollment/step2"   element={<Step2/>}/>
            <Route path="enrollment/step3"   element={<Step3/>} />
            {/* <Route path='login/admin-staff'  element={<Login/>}/> */}
            {/* <Route path='login/student'      element={<Login/>}/> */}
            <Route path="login"              element={<Login/>}/>
            <Route path="staff_registration" element={<StaffRegistration/>} />
            <Route path="forgot_password"    element={<ForgotPassword/>} />,
            <Route path='*'                  element={ <Navigate to={"/404_forbidden"} replace /> } />

        </Routes>
        <Footer/>
        </>

    )
}

export default Layout;