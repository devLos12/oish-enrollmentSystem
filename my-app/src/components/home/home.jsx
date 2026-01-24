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
                height:"520px"
            }}
        >
            {/* Overlay for better text readability */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{backgroundColor: 'rgba(0, 0, 0, 0.7)'}}

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

                        
                        <div className="mt-5 card border-0 shadow-sm  position-relative" 
                        style={{ 
                            maxWidth: "800px", 
                            width: "100%",
                            overflow: "hidden"
                        }}>
                            <div className="card-body p-4">
                                <div 
                                    style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '20px',
                                        fontSize: '120px',
                                        color: 'rgba(139, 0, 0, 0.1)',
                                        fontFamily: 'Georgia, serif',
                                        lineHeight: '1',
                                        zIndex: 0
                                    }}
                                >
                                    "
                                </div>

                                <p 
                                    className="m-0 fst-italic " 
                                    style={{
                                        fontSize: '1.2rem',
                                        lineHeight: '1.8',
                                        color: '#333',
                                        position: 'relative',
                                        zIndex: 1,
                                        minHeight: '80px'
                                    }}
                                >
                                    {quotes[currentQuote].text}
                                </p>

                                <p 
                                    className="fw-bold " 
                                    style={{
                                        fontSize: '1.1rem',
                                        color: '#8B0000'
                                    }}
                                >
                                    — {quotes[currentQuote].author}
                                </p>

                                <div className="d-flex justify-content-center gap-2 ">
                                    {quotes.map((_, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleQuoteChange(index)}
                                            style={{
                                                width: currentQuote === index ? '30px' : '10px',
                                                height: '10px',
                                                borderRadius: currentQuote === index ? '5px' : '50%',
                                                backgroundColor: currentQuote === index ? '#8B0000' : '#ddd',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;