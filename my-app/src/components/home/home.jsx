import React, { useState, useEffect } from "react";
import banner from "../../assets/image/banner.jpg";
import logo from "../../assets/image/logo.png";
import { useNavigate } from "react-router-dom";
import imageBackground from "../../assets/image/shsBackground.jpg";




const Home = () => {
    const navigate = useNavigate();



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
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleQuoteChange = (index) => {
        setCurrentQuote(index);
    };
    
    return(
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
            {/* Gradient Overlay - darker at top, lighter at bottom */}
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
                        
                        
                        <div className="d-flex align-items-center justify-content-center gap-3 flex-column"
                        >
                            <p className="m-0 text-capitalize fw-light fs-2 w-100 text-white ">
                               welcome to fransisco osorio integrated senior high school
                            </p>
                            <p className="text-capitalize fw-semibold text-light fs-5">trece martires city</p>

                            <div className="pe-0 pe-md-5 me-5 me-md-2"
                            onClick={()=> navigate("/enrollment/step1", { state: { allowed: true }})}
                                >
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
    )
}

export default Home;