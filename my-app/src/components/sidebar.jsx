import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { globalContext } from "../context/global";
import image from "../assets/image/logo.png";

const SideBar = () => {

    const { role, setModal, setOpenmenu, textHeader, setIsLoggingOut } = useContext(globalContext);
    const navigate = useNavigate();
    const location = useLocation();
    

    

    // State para sa dropdown
    const [isAccessCodeOpen, setIsAccessCodeOpen] = useState(false);
    
    
    const data = {

        student: [
            { 
                label: "Dashboard",  icon: "fa-solid fa-grip",
                link: "/student",    title: "dashboard"
            },
             { 
                label: "Registration Form",  icon: "fa-solid fa-list",
                link: "/student/registration_form",    title: "Registration form"
            },
             { 
                label: "Classroom",  icon: "fa-solid fa-chalkboard",
                link: "/student/classroom",    title: "Classroom"
            },
             { 
                label: "Change password",          icon: "fa-solid fa-key",
                link: "/student/change_password",  title: "Change Password"
            },
            { 
                label: "Edit profile",            icon: "fa-solid fa-pen",
                link: "/student/edit_profile",    title: "edit profile"
            },
        ],

        admin: [
            { 
                "label": "Dashboard",            
                "icon": "fa-solid fa-chart-line", 
                link: "/admin",                 
                title: "dashboard"
            },
            {   label: "applicants",          icon: 'fa-solid fa-user', 
                link: "/admin/applicants",    title: "applicants"
            },

            {   label: "subjects",            icon: 'fa-solid fa-book', 
                link: "/admin/subjects",      title: "subjects"
            },

            {   label: "Section Management",       icon: "fa-solid fa-layer-group",
                link: "/admin/section_management", title: "Section Management"
            },

            // { 
            //     "label": "Access Code",          
            //     "icon": "fa-solid fa-key",
            //     // Wala ng direct link, expandable na to
            //     hasDropdown: true,
            //     subItems: [
            //         {
            //             label: "Generate Code",
            //             icon: "fa-solid fa-code",
            //             link: "/admin/generate_code",
            //             title: "generate code"
            //         },
            //         {
            //             label: "Gmail Code",
            //             icon: "fa-solid fa-envelope",
            //             link: "/admin/gmail_code",
            //             title: "gmail code"
            //         }
            //     ]
            // },
            { "label": "Student Management",   "icon": "fa-solid fa-user-graduate", 

                link: "/admin/student_management", title: "student management"
            },
            { "label": "faculty member",          "icon": "fa-solid fa-users-gear", 
                link: "/admin/staff_member",    title: "faculty"
            },
            { "label": "Announcement",         "icon": "fa-solid fa-bullhorn",
                link: "/admin/announcement",    title: "announcement"
            },
            {   label: "Generate Code",       icon: "fa-solid fa-key",
                link: "/admin/generate_code", title: "Generate Code", 
            },
            {
                label: "Schedule",             icon: "fa-solid fa-clock",
                link: "/admin/schedule",       title: "schedule", 
            },

            { "label": "Logs",                  "icon": "fa-solid fa-clipboard-list",
                link: "/admin/logs",            title: "Logs"
             },
        ],



        staff: [
            // { 
            //     "label": "Dashboard",         "icon": "fa-solid fa-chart-line", 
            //     link: "/staff",               title: "dashboard"
            // },

            {  label: "dashboard",              icon: 'fa-solid fa-chart-line', 
                link: "/staff",                 title: "dashboard"
            },

            {   label: "applicants",            icon: 'fa-solid fa-user', 
                link: "/staff/applicants",      title: "applicants"
            },

            {   label: "classroom",              icon: 'fa-solid fa-chalkboard', 
                link: "/staff/classroom",       title: "classroom"
            },

            {   label: "schedule",              icon: 'fa-solid fa-clock', 
                link: "/staff/schedule",       title: "schedule"
            },


            // {   label: "subjects",            icon: 'fa-solid fa-book', 
            //     link: "/staff/subjects",      title: "subjects"
            // },

            // { "label": "Student Management",       "icon": "fa-solid fa-user-graduate", 
            //     link: "/staff/student_management", title: "student management"
            // },
            
            // {   label: "Section Management",       icon: "fa-solid fa-layer-group",
            //     link: "/staff/section_management", title: "Section Management"
            // },

            // { "label": "Announcement",             "icon": "fa-solid fa-bullhorn",
            //     link: "/staff/announcement",       title: "announcement"
            //  },

            // {
            //     label: "Schedule",             icon: "fa-solid fa-clock",
            //     link: "/staff/schedule",       title: "schedule", 
            // },
            
            // {  "label": "Logs",          "icon": "fa-solid fa-clipboard-list",
            //     link: "/staff/logs",     title: "logs"
            // },
            { 
                label: "Change password",          icon: "fa-solid fa-key",
                link: "/staff/change_password",  title: "Change Password"
            },

            { 
                label: "Edit profile",            icon: "fa-solid fa-pen",
                link: "/staff/edit_profile",    title: "edit profile"
            },

        ],
    }

    const navLinks = data[role] || [];

    const handleNavClick = (item) => {
        if (item.hasDropdown) {
            // Toggle dropdown
            setIsAccessCodeOpen(!isAccessCodeOpen);
        } else if (item.link) {
            // Normal navigation
            navigate(item.link, { state: { title: item.title }});
            setOpenmenu(false);
        }
    }

    return (
        <div className="p-2 ">
        <div className="py-2  d-flex align-items-center gap-2 cursor  "
        onClick={()=> {
            navigate("/")
        }}
        
        >
            <img 
                src={image} 
                alt={image} 
                className="bg-white rounded-pill flex-shrink-0  " 
                style={{width: "50px", height: "50px"}}
            />
            <p className="m-0 text-white fw-bold"
            style={{fontSize: "12px"}}
            >
                FRANCISCO OSORIO INTEGRATED SENIOR HIGH SCHOOL
            </p>
        </div>

        <div className="my-4">
            {navLinks.map((data, i) => (
                <div key={i}>
                    {/* Main Navigation Item */}
                    <div 
                        className={`row mt-2 p-2 cursor d-flex align-items-center rounded-3 g-0 gap-2
                            ${ (location?.pathname === data.link || textHeader === data.title ) ? "bg-white text-dark" : "text-white"}`} 
                        onClick={() => {
                            handleNavClick(data)
                        }}
                    >
                        <div className="col-1">
                            <i className={`${data.icon} `}></i>
                        </div>
                        <div className="col">
                            <p className="m-0 text-capitalize  small">{data.label}</p>
                        </div>
                        
                        {/* Dropdown arrow pag may subItems */}
                        {/* {data.hasDropdown && (
                            <div className="col-auto">
                                <i className={`fa-solid fa-chevron-${isAccessCodeOpen ? 'up' : 'down'} text-white small`}></i>
                            </div>
                        )} */}
                    </div>

                    {/* Dropdown SubItems - lalabas pag naka-open */}
                    {/* {data.hasDropdown && isAccessCodeOpen && (
                        <div className="px-3 ">
                            {data.subItems.map((subItem, j) => (
                                <div 
                                    key={j}
                                    className="row mt-1 p-2 rounded-3 cursor align-items-center "
                                    style={{
                                        backgroundColor: location.pathname === subItem.link 
                                            ? 'rgba(255,255,255,0.2)' 
                                            : 'transparent'
                                    }}
                                    onClick={() => navigate(subItem.link, { state: { title: subItem.title }})}
                                >
                                    <div className="col-1">
                                        <i className={`${subItem.icon} text-white`} 
                                        style={{fontSize: '12px'}}></i>
                                    </div>
                                    <div className="col">
                                        <p className="m-0 text-capitalize text-white" 
                                        style={{fontSize: '12px'}}>
                                            {subItem.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )} */}
                </div>
            ))}

            <div className="row mt-2 p-2 rounded-3 cursor d-flex align-items-center "
            onClick={()=>  {
                setOpenmenu(false);
                setModal((prev) => ({...prev, 
                    isShow: true, 
                    text: "do you want to exit?"
                }))
            }}
            >
                <div className="col-1">
                    <i className={`fa-solid fa-right-from-bracket text-white`}></i>
                </div>
                <div className="col">
                    <p className="m-0 text-capitalize text-white small">Log out</p>
                </div>
            </div>
        </div>
        </div>
    )
}


export default SideBar;