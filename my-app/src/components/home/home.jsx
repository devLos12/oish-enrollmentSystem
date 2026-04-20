import React, { useState, useEffect } from "react";
import banner from "../../assets/image/banner.jpg";
import logo from "../../assets/image/logo.png";
import { useNavigate } from "react-router-dom";
import imageBackground from "../../assets/image/shsBackground.jpg";
import { useContext } from "react";
import { io } from "socket.io-client";



// ✅ Enrollment Closed Modal Component
const EnrollmentClosedModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9998 }}
            />

            {/* Modal Dialog */}
            <div
                className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 shadow-lg overflow-hidden"
                style={{ zIndex: 9999, width: "90%", maxWidth: "420px" }}
            >
                {/* Header - Red */}
                <div className="bg-red text-white text-center px-4 pt-4 pb-4">
                    {/* Icon Circle */}
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 border border-2 border-white border-opacity-50"
                        style={{
                            width: "64px",
                            height: "64px",
                            backgroundColor: "rgba(255,255,255,0.15)"
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="white"
                            strokeWidth={1.8}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                        </svg>
                    </div>

                    <h5 className="fw-bold mb-0" style={{ letterSpacing: "0.3px" }}>
                        Enrollment is Closed
                    </h5>
                </div>

                {/* Body */}
                <div className="px-4 pt-4 pb-2 text-center">
                    <p className="text-secondary mb-0" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                        Enrollment for the current school year is currently{" "}
                        <strong className="text-danger">closed</strong>. Please check back
                        soon or contact the school for more information.
                    </p>
                    <hr className="mt-4 mb-0" />
                </div>

                {/* Footer */}
                <div className="px-4 pt-3 pb-4 d-flex justify-content-center">
                    <button
                        onClick={onClose}
                        className="btn btn-danger fw-bold px-5 py-2"
                        style={{ letterSpacing: "0.5px" }}
                    >
                        Got it
                    </button>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, -45%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}</style>
        </>
    );
};



const Home = () => {
    const navigate = useNavigate();
    
    const [activeSchoolYear, setActiveSchoolYear] = useState(null);
    const [loadingYear, setLoadingYear] = useState(true);
    // ✅ NEW: Modal state
    const [showClosedModal, setShowClosedModal] = useState(false);

    

    const quotes = [
        {
            text: "Education is the most powerful weapon which you can use to change the world.",
            author: "Nelson Mandela"
        },
        {
            text: "The beautiful thing about learning is that no one can take it away from you.",
            author: "B.B. King"
        },
        {
            text: "Education is not preparation for life; education is life itself.",
            author: "John Dewey"
        },
        {
            text: "The mind is not a vessel to be filled, but a fire to be kindled.",
            author: "Plutarch"
        }
    ];

    const [currentQuote, setCurrentQuote] = useState(0);



    useEffect(() => {
        getSchoolmentYear();

        const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
        socket.on("enrollmentStatusChanged", (data) => {
            getSchoolmentYear();
        });

        return () => {
            socket.disconnect();
        };

    }, []);

    






    const getSchoolmentYear = async () => {

        try {

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAllSchoolYears`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();

            if(!res.ok) {
                throw new Error(data.message);
            }
            
            if(data.success && data.data) {
                const activeYear = data.data.find(sy => sy.isCurrent);
                if (activeYear) {
                    setActiveSchoolYear(activeYear);
                }
            }

        } catch (error) {   
            console.log("Error fetching school year:", error.message);
        } finally {
            setLoadingYear(false);
        }
    }







    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleQuoteChange = (index) => {
        setCurrentQuote(index);
    };
    


    const handleEnrollmentNav = () => {
        if (activeSchoolYear?.enrollmentStatus === 'open') {    
            navigate("/enrollment/step1", { state: { allowed: true } });
        } else {
            // ✅ Show modal instead of alert
            setShowClosedModal(true);
        }
    };
    


    return(
        <>
            {/* ✅ Enrollment Closed Modal */}
            <EnrollmentClosedModal
                isOpen={showClosedModal}
                onClose={() => setShowClosedModal(false)}
            />

            <div 
                className="container-fluid d-flex align-items-center justify-content-center position-relative bg-light"
                style={{
                    backgroundImage: `url(${imageBackground})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: "100vh",
                    marginTop: "-50px",
                }}
            >
                {/* Gradient Overlay */}
                <div 
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.3) 100%)'
                    }}
                ></div>

                {/* Content */}
                <div className="row w-100" 
                style={{ zIndex: 2, position: 'relative' }}>
                    <div className="col-12 col-md-10 col-lg-10 mx-auto">
                        <div className="d-flex align-items-center flex-column justify-content-center text-center px-3">
                            
                            
                            <div className="d-flex align-items-center justify-content-center gap-3 flex-column">
                                <p className="m-0 text-capitalize fw-light fs-2 w-100 text-white ">
                                   welcome to francisco osorio integrated senior high school
                                </p>
                                <p className="text-capitalize fw-semibold text-light fs-5">trece martires city</p>

                                <div className="pe-0 pe-md-5 me-5 me-md-2">
                                    <div onClick={handleEnrollmentNav}>
                                        <button 
                                            className="btn fw-bold text-white px-4 px-md-5 py-2 py-md-3 rounded-0 position-relative"
                                            style={{ 
                                                backgroundColor: '#FBBF24',
                                                border: 'none',
                                                zIndex: 2
                                            }}
                                        >
                                            ENROLL
                                            <span 
                                                className="position-absolute text-white fw-bold px-3 px-md-4 py-2 py-md-3"
                                                style={{
                                                    backgroundColor: '#2563EB',
                                                    top: '6px',
                                                    right: '-50px',
                                                    clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                                    zIndex: 1
                                                }}
                                            >
                                                NOW
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home;