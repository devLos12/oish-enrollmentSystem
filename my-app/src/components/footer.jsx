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
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-facebook text-light mt-1" viewBox="0 0 16 16">
                                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                                </svg>
                                <a href="https://web.facebook.com/DepEdTayo.FOISHS/mentions" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small">
                                    https://web.facebook.com/DepEdTayo.FOISHS/mentions
                                </a>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-envelope text-light mt-1" viewBox="0 0 16 16">
                                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                                </svg>
                                <a href="mailto:info@fointegrated.edu.ph" className="text-light text-decoration-none small">
                                    307808@deped.gov.ph
                                </a>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone text-light mt-1" viewBox="0 0 16 16">
                                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
                                </svg>
                                <span className="text-light small">
                                    (046) 423 3585
                                </span>
                            </li>
                            <li className="mb-2 d-flex align-items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-alt text-light mt-1" viewBox="0 0 16 16">
                                    <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
                                    <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                                </svg>
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