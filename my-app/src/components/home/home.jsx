import React, { useState, useEffect } from "react";
import banner from "../../assets/image/banner.jpg";
import logo from "../../assets/image/logo.png";
import { useNavigate } from "react-router-dom";




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
        >
            {/* Overlay for better text readability */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100"
            ></div>

            {/* Content */}
            <div className="row w-100 py-5" 
            style={{ zIndex: 2, position: 'relative' }}>
                <div className="col-12 col-md-10 col-lg-10 mx-auto">
                    <div className="d-flex align-items-center flex-column justify-content-center text-center px-3">
                        
                        <div className="bg-transparent"
                        style={{width: "140px", height: "140px"}}
                        >
                            <img src={logo} alt={logo} 
                            className="w-100 h-100 img-fluid"
                            />
                        </div>

                        <p className="m-0 text-capitalize fw-bold fs-2 mt-2 text-red w-100">
                            welcome to fransisco osorio integrated senior high school
                        </p>
                        
                        {/* Quote Card */}
                        <div className="card border-0 shadow-sm my-4 position-relative" 
                        style={{ 
                            maxWidth: "800px", 
                            width: "100%",
                            overflow: "hidden"
                        }}>
                            <div className="card-body p-4 p-md-5">
                                {/* Quotation Mark */}
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

                                {/* Quote Text */}
                                <p 
                                    className="mb-3 fst-italic" 
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

                                {/* Author */}
                                <p 
                                    className="mb-3 fw-bold" 
                                    style={{
                                        fontSize: '1.1rem',
                                        color: '#8B0000'
                                    }}
                                >
                                    — {quotes[currentQuote].author}
                                </p>

                                {/* Quote Dots */}
                                <div className="d-flex justify-content-center gap-2 mt-4">
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
                        
                        <button 
                            className="text-capitalize px-4 py-3 small rounded-3 fw-bold shadow-lg border-0 text-white d-flex align-items-center gap-2 mt-3"
                            style={{
                                outline: "none",
                                backgroundColor: '#8B0000',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={()=> navigate("/enrollment/step1", { state: { allowed: true }})}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#A00000'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#8B0000'}
                        >
                            <i className="fa fa-user-plus small"
                            ></i>
                            enroll now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;