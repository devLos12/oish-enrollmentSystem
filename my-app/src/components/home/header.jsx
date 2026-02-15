import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/image/logo.png";
import { globalContext } from "../../context/global.jsx";

const Header = () => {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(false);
    const [openPortal, setOpenPortal] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const portalRef = useRef(null);
    const { role } = useContext(globalContext);

    const portalLinks = [
        { label: "Admin Staff", link: "/login/admin-staff", source: "admin staff", icon: "fa-user-shield" },
        { label: "Student", link: "/login/student", source: "student", icon: "fa-user-graduate" }
    ];

    const navLinks = [
        { label: "home",         id: "home" },
        { label: "about",        id: "about" },
        { label: "announcement", id: "announcement" },
        { label: "programs",     id: "programs" },
    ];

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle navigation with scroll
    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        
        // Close mobile menu
        setOpenMenu(false);
        
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (portalRef.current && !portalRef.current.contains(event.target)) {
                setOpenPortal(false);
            }
        };

        if (openPortal) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openPortal]);

    // Close mobile menu when window resizes
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setOpenMenu(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handlePortalClick = (item) => {
        setOpenPortal(false);
        setOpenMenu(false);
        navigate(item.link, { state: item.source });
    };

    return (
        <div 
            className={`position-fixed top-0 start-0 end-0 ${scrolled ? 'bg-red' : ''}`}
            style={{ 
                zIndex: 99,
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
            }}
        >
            <div className={`container-fluid ${scrolled ? 'border-bottom border-white border-opacity-25' : ''}`}>
                <div className="container">
                    <header className="p-0 py-3 p-md-3 d-flex align-items-center justify-content-between">
                        
                        <div className="d-flex gap-2 align-items-center">
                            <i 
                                className={`bx bx-${openMenu ? "x" : "menu"} fs-2 d-lg-none text-white`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setOpenMenu((prev) => !prev)}
                                role="button"
                                aria-label="Toggle menu"
                            ></i>
                            
                            <div className="d-flex gap-2 align-items-center cursor d-none d-lg-flex"
                                onClick={() => navigate('/')}
                                style={{ cursor: 'pointer' }}
                            > 
                                <div 
                                    className="bg-white rounded-circle d-flex border border-white border-2"
                                    style={{ width: "40px", height: "40px", overflow: "hidden" }}
                                >
                                    <img src={logo} alt={logo} style={{objectFit:" cover"}}/>
                                
                                </div>
                                <p className="m-0 text-white fw-semibold d-flex flex-column text-capitalize"
                                    style={{lineHeight: "1.2"}}
                                >
                                    fransisco osorio integrated SHS                                
                                    <span className="m-0 text-white fw-semibold text-capitalize">trece martires city.</span>
                                </p>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <nav className="d-none d-md-block me-5">
                                <ul className="list-unstyled d-flex gap-3 m-0">
                                    {navLinks.map((data, i) => (
                                        <li key={i} className="text-capitalize " 
                                        style={{ cursor: "pointer" }}>
                                            <a 
                                                href={`#${data.id}`}
                                                className="text-decoration-none text-white"
                                                style={{ transition: "opacity 0.2s" }}
                                                onClick={(e) => handleNavClick(e, data.id)}
                                                onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                                                onMouseLeave={(e) => e.target.style.opacity = "1"}
                                            >
                                                {data.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                            
                            {role ? (
                                <i className="fa-solid fa-user text-white cursor"
                                onClick={()=> {
                                    if(role){
                                        navigate(`/${role}`);
                                    }
                                }}
                                ></i>
                            ) : (   
                                <button className="btn btn-outline-light text-uppercase border-0 fw-bold d-flex align-items-center gap-1"
                                onClick={()=> {
                                    navigate('/login');
                                }}
                                >
                                    <i className="fa-solid fa-user-circle"></i>
                                    login
                                </button>
                            )}
                        </div>
                    </header>
                </div>
            </div>

            {/* Mobile Menu */}
            {openMenu && (
                <div className="container-fluid d-md-none bg-red">
                    <div className="container">
                        <nav className="px-2 py-3">
                            <ul className="list-unstyled d-flex flex-column gap-4 m-0">
                                {navLinks.map((data, i) => (
                                    <li 
                                        key={i} 
                                        className="text-capitalize"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <a 
                                            href={`#${data.id}`}
                                            className="text-decoration-none text-white"
                                            onClick={(e) => handleNavClick(e, data.id)}
                                        >
                                            {data.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Header;