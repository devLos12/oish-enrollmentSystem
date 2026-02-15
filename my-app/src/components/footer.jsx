import React from "react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate();
    
 


    const links = [
        { label: "home",         id: "home" },
        { label: "about",        id: "about" },
        { label: "announcement", id: "announcement" },
        { label: "programs",     id: "programs" },
    ];

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        
        // Navigate to home/landing page if not there yet
        if (window.location.pathname !== '/') {
            navigate('/');
            // Wait for navigation then scroll
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            // Already on page, just scroll
            const element = document.getElementById(sectionId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <footer className="bg-dark py-5 " style={{borderTop: '1px solid #e5e7eb'}}>
            <div className="container">
                <div className="row mb-5 gap-5">
                    {/* Brand Section */}
                    <div className="col-12 col-md-5 mb-4 mb-md-0 gap-2 d-flex  gap-3">
                        <img src="https://res.cloudinary.com/dqg9d0gbp/image/upload/v1769302007/logo_mfldqi.png" alt="logo" 
                        className=""
                        style={{width:"80px", height:"80px"}}
                        />
                        <p className="text-light small text-capitalize fw-semibold fs-4 m-0" 
                        >
                            fransisco osorio integrated SHS
                            trece martires city.
                        </p>
                    </div>
               
                    {/* Quick Navigation Column */}
                    <div className="col-auto">
                        <h6 className="fw-bold text-danger mb-3" 
                        style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                        >
                            Quick Navigation
                        </h6>
                        <ul className="list-unstyled">
                            {links.map((link, i) => (
                                <li key={i} className="mb-2">
                                    <a 
                                        href={`#${link.id}`}
                                        className="text-light text-decoration-none small text-capitalize fw-semibold"
                                        onClick={(e) => handleNavClick(e, link.id)}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li className="mb-2"
                            onClick={()=> navigate("/login")}
                            style={{ cursor: "pointer" }}
                            >
                                <a href="#" className="text-light text-decoration-none small fw-semibold">Sign in</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Information Column */}
                    <div className="col-auto">
                        <h6 className="fw-bold text-danger mb-3" 
                        style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                        >
                            Contact Us
                        </h6>
                        <ul className="list-unstyled">
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <i className="fa-brands fa-facebook text-light mt-1"></i>
                                <a href="https://web.facebook.com/DepEdTayo.FOISHS" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small">
                                    https://web.facebook.com/DepEdTayo.FOISHS
                                </a>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <i className="fa-solid fa-envelope text-light mt-1"></i>
                                <a href="mailto:307808@deped.gov.ph" className="text-light text-decoration-none small">
                                    307808@deped.gov.ph
                                </a>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <i className="fa-solid fa-phone text-light mt-1"></i>
                                <span className="text-light small">
                                    (046) 423 3585
                                </span>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <i className="fa-solid fa-location-dot text-light mt-1"></i>
                                <span className="text-light small">
                                    Barangay Osorio , Trece Martires, Philippines
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div style={{borderTop: '1px solid #e5e7eb', padding: '2rem 0'}} className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                    <p className="text-light small m-0 text-center fs-6">© 2026 Fransisco Osorio Integrated Senior High School. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;