import React from "react";
import person1 from "../../assets/image/person.png";
import person2 from "../../assets/image/person2.png";

const Programs = () => {
    return (

        <div className="container-fluid bg-light">
            <div className="container py-5">
                <div className="row g-0 rounded bg-danger">
                    <div className="col-12 text-center p-3" 
                    >
                        <p className="m-0 text-white fw-bold mb-2 px-2 fs-1" 
                        >
                            SENIOR HIGH SCHOOL PROGRAM
                        </p>
                        <p className="m-0 text-dark fw-semibold mb-0 px-2 fs-5" 
                        >
                            CHOOSE THE RIGHT PROGRAM THAT FITS YOU
                        </p>
                    </div>
                </div>
              
                {/* Main Programs Section */}
                <div className="row py-4 py-md-5">
                    <div className="col-12">
                        <div className="row align-items-center justify-content-center ">
                            
                            {/* Person 1 - Left Side */}
                            <div className="col-12 col-md-3">
                                <div className="position-relative d-inline-block ">
                                    <img 
                                        src={person1} 
                                        alt="Student 1" 
                                        className="img-fluid"
                                    />
                                </div>
                            </div>

                            {/* STEM Program - Left */}
                            <div className="col-12 col-md-3 text-center ">
                                <h2 className="fw-bold mb-2 mb-md-3 fs-1 text-red" 
                                >
                                    STEM
                                </h2>
                                <p className="fw-semibold mb-1 fs-5"
                                >
                                    SCIENCE , TECHNOLOGY
                                </p>
                                <p className="fw-semibold" >
                                    ENGINEERING & MATHEMATICS
                                </p>
                            </div>

                            {/* TVL - ICT Program - Right */}
                            <div className="col-12 col-md-3 text-center">
                                <h2 className="fw-bold mb-2 mb-md-3 fs-1 text-red" 
                                
                                >
                                    TVL - ICT
                                </h2>
                                <p className="fw-semibold fs-5" 
                                >
                                    TECHNICAL DRAFTING
                                </p>
                            </div>

                            {/* Person 2 - Right Side */}
                            <div className="col-6 col-md-3 text-center order-3 order-md-4">
                                <div className="position-relative d-inline-block">
                                    <img 
                                        src={person2} 
                                        alt="Student 2" 
                                        className="img-fluid"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Programs Section */}
                <div className="row">
                    <div className="col-12 ">
                        <div className="text-center mb-2 mb-md-3 px-2">
                            <p className="mb-0" >
                                <span className="fw-semibold">ALSO OFFERING: </span>
                                <span className="text-danger fw-bold">HUMANITIES & SOCIAL SCIENCE ( HUMMS )</span>
                            </p>
                        </div>
                        <div className="text-center mb-2 mb-md-3 px-2">
                            <p className="fw-bold mb-0 text-danger">
                                ACCOUNTANCY, BUSINESS & MANAGEMENT ( ABM )
                            </p>
                        </div>
                        <div className="text-center mb-2 mb-md-3 px-2">
                            <p className="fw-bold mb-0 text-danger">
                                TVL - HOME ECONOMICS 
                                <span className="fw-normal d-block d-md-inline"> ( BREAD & PASTRY PRODUCTION, FOOD & BEVERAGE SERVICES, COOKERY )</span>
                            </p>
                        </div>
                        <div className="text-center mb-3 mb-md-4 px-2">
                            <p className="fw-bold mb-0 text-danger" >TVL - INDUSTRIAL ARTS 
                                <span className="fw-normal d-block d-md-inline" > ( SHIELDED METAL ARC WELDING (SMAW) )</span>
                            </p>
                        </div>

                        {/* Enroll Button */}
                        {/* <div className="text-center text-md-end pe-0 pe-md-5 mt-4">
                            <button 
                                className="btn fw-bold text-white px-4 px-md-5 py-2 py-md-3 rounded-0 position-relative"
                                style={{ 
                                    backgroundColor: '#FBBF24',
                                    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
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
                                        right: '-30px',
                                        fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                                        clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                        zIndex: 1
                                    }}
                                >
                                    NOW
                                </span>
                            </button>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Programs;