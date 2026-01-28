import { useContext, useState, useEffect } from "react";
import { globalContext } from "../context/global";
import { useNavigate } from "react-router-dom";
import SideBar from "./sidebar";
import { useLayoutEffect } from "react";




const Header = () => {
    const { textHeader, role, profile, openMenu, setOpenmenu } = useContext(globalContext);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [isStudent, setIsStudent] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        setIsAdmin(role === "admin");
        setIsStaff(role === "staff");
        setIsStudent(role === "student");
    }, [role]);

    useLayoutEffect(() => {
        console.log(textHeader);
    },[textHeader])

    // Close menu when clicking overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setOpenmenu(false);
        }
    };
    
    return (
        <>
            <header 
                className="bg-white p-3 d-flex align-items-center justify-content-between border-bottom border-danger"
                style={{ zIndex: 99, position: "relative" }}
            >
                <div className="d-flex align-items-center gap-2 text-danger">
                    <i 
                        className="bx bx-menu fs-4 cursor-pointer d-xl-none"
                        onClick={() => setOpenmenu(true)}
                        style={{ cursor: "pointer" }}
                    ></i>
                    <div className="d-flex align-items-center gap-3">
                        <p className="m-0 fs-5 text-capitalize fw-bold text-danger">
                        {textHeader || "Dashboard"}
                        </p> 
                        
                        {(textHeader === "dashboard" || textHeader === undefined) &&  (
                            <div className="d-flex align-items-center text-dark gap-2">
                                <p className="m-0 ">|</p>
                                <p className="m-0 text-capitalize fw-semibold">{
                                role === "staff" ? "teacher" : 
                                role === "student" ? "student" : role}</p>
                            </div>
                        )}

                    </div>
                </div>
            
                {isAdmin && (
                    <div className="d-flex align-items-center gap-2">
                        <i className="fa-solid fa-user fs-5 text-danger"></i>
                        <p className="text-capitalize m-0 fw-bold">admin</p>
                    </div>
                )}

                {isStaff && (
                    <div className="d-flex align-items-center gap-2 cursor"
                    onClick={() => navigate("/staff", { state: { title: "dashboard" }})}
                    >
                        {profile?.imageFile ? (
                            <div className="rounded-circle overflow-hidden border border-dark"
                            style={{height: "35px", width: "35px"}}
                            >
                                <img src={profile?.imageFile} 
                                alt={profile?.imageFile} 
                                className="w-100 h-100 img-fluid"
                                style={{objectFit: "cover"}}
                                />
                            </div>
                        ): (
                        <div 
                            className="rounded-circle bg-danger border d-flex align-items-center justify-content-center" 
                            style={{ width: "35px", height: "35px"}}
                        >
                            <p className="text-uppercase fw-bold m-0 text-white">
                                {profile?.firstName?.charAt(0)}
                            </p>
                        </div>
                        )}
                        <p className="text-capitalize fw-semibold m-0 text-dark">
                            {`${profile?.firstName} ${profile?.lastName}`}
                        </p>
                    </div>
                )}


                {isStudent && (
                    <div className="d-flex align-items-center gap-2 cursor"
                    onClick={() => navigate("/student", { state: { title: "dashboard" }})}
                    >
                        {profile?.profileImage ? (

                        <div className="rounded-circle overflow-hidden border border-dark"
                        style={{height: "35px", width: "35px"}}
                        >
                            <img src={profile?.profileImage} 
                            alt={profile?.profileImage} 
                            className="w-100 h-100 img-fluid"
                            style={{objectFit: "cover"}}
                            />
                        </div>
                        ) : (
                            <div className="rounded-circle bg-danger border d-flex align-items-center justify-content-center" 
                            style={{ width: "35px", height: "35px"}}
                            >
                                <p className="text-uppercase fw-bold m-0 text-white">
                                    {profile?.firstName?.charAt(0)}
                                </p>
                            </div>
                        )}
                        
                        <p className="text-capitalize m-0 small fw-semibold">
                            {`${profile?.firstName} ${profile?.lastName}`}
                        </p>
                    </div>
                )}
            </header>

            {/* Sidebar Menu Overlay */}
            {openMenu  && (
                <div 
                    className="position-fixed top-0 start-0 w-100 vh-100 d-xl-none"
                    style={{
                        zIndex: 1050,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        animation: "fadeIn 0.3s ease"
                    }}
                    onClick={handleOverlayClick}
                >
                    <div 
                        className="bg-danger h-100 position-relative"
                        style={{
                            width: "280px",
                            maxWidth: "80vw",
                            animation: "slideIn 0.3s ease",
                            boxShadow: "2px 0 10px rgba(0,0,0,0.3)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        {/* <div className="d-flex justify-content-end">
                            <i 
                                className="bx bx-x fs-2 text-white"
                                onClick={() => setOpenmenu(false)}
                                style={{ cursor: "pointer" }}
                            ></i>
                        </div> */}
                        
                        <div 
                            className="vh-100 px-2"
                            style={{
                                overflowY: "auto",
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(255, 255, 255, 0.3) transparent"
                            }}
                        >
                            <SideBar />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                
            `}</style>
        </>
    );
};

export default Header;