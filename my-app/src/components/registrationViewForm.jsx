import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/image/logo.png";
import deped from "../assets/image/deped.png";
import { useEffect, useLayoutEffect, useContext, useRef, useState } from "react";
import { globalContext } from "../context/global";
import html2pdf from 'html2pdf.js';


const RegistrationViewForm = () => {
    const { role } = useContext(globalContext);
    const location = useLocation();
    const student = location?.state;
    const navigate = useNavigate();
    const formRef = useRef();





    useEffect(() => {
        if(!location?.state) {
            navigate(`/admin`, { replace: true })
            return
        }
    },[location?.state, navigate]);


    useLayoutEffect(() => {
        if (location?.state?.autoDownload) {
            handleDownloadPDF();
        }
    }, [location?.state?.autoDownload]);


    const handleDownloadPDF = async () => {
        const element = formRef.current;
        
        // Find all images and convert to base64
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    img.src = canvas.toDataURL('image/png');
                    resolve();
                } else {
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        img.src = canvas.toDataURL('image/png');
                        resolve();
                    };
                }
            });
        });

        await Promise.all(imagePromises);

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Registration-Form-${student?.studentNumber}-Sem${student?.currentSemester || student?.semester}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            navigate("/student/registration_form");
        });;
    };

    const hiddenStyle = location?.state?.autoDownload
    ? {
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        left: "-9999px",
        top: "-9999px"
        }
    : {};



    return (
        <div style={hiddenStyle}>

        <div className="container-fluid vh-100">
            <div className="row justify-content-center">
                <div className="col-12 col-md-12 col-lg-9 bg-white py-5">
                    {/* Form Content - This will be converted to PDF */}
                    <div ref={formRef}>
                        {/* Header */}

                        <div className="text-center mb-3 mb-md-4 ">
                            <img src={deped} alt="DepEd Logo" style={{ width: '120px', height: '120px' }} crossOrigin="anonymous" className="mb-2 mb-md-3 me-4" />
                            <img src={logo} alt="DepEd Logo" style={{ width: '120px', height: '120px' }} crossOrigin="anonymous" className="mb-2 mb-md-3" />
                            <p className="fw-bold mb-1 small fs-5">FRANCISCO OSORIO INTEGRATED SENIOR HIGH SCHOOL</p>
                            <p className='m-0 my-2 fw-semibold'>Barangay Osorio Trece Martires City, Cavite</p>

                            <div className="d-inline-block border border-2 border-dark p-2 fw-bold small mt-2">
                            School Year: {student?.schoolYear || student?.enrollmentYear || '________'}
                            </div>

                        </div>
                        {/* <div className="text-center mb-4">
                            <img src={logo} alt="School Logo" 
                            style={{ width: '100px', height: '100px' }} 
                            className="mb-3" 
                            crossOrigin="anonymous" />
                            <h4 className="fw-bold mb-1">FRANCISCO OSORIO INTEGRATED SENIOR</h4>
                            <h4 className="fw-bold mb-2">HIGH SCHOOL</h4>
                            <p className="text-muted mb-3">Trece Martires City District</p>
                            <h5 className="fw-bold mt-4">REGISTRATION FORM</h5>
                            {student?.currentSemester && (
                                <p className="text-muted">
                                    <strong>Semester {student.currentSemester}</strong>
                                </p>
                            )}
                        </div> */}

                        <hr className="my-4" />

                        {/* Student Information */}
                        <div className="row mb-4">
                            <div className="col-12 col-md-6 d-flex flex-column gap-2">
                                <div className="d-flex gap-2">
                                    <p className="m-0">LRN: </p>
                                    <p className="m-0 fw-bold">{student?.lrn || ""}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Student No: </p>
                                    <p className="m-0 fw-bold">{student?.studentNumber || " "}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Student Name: </p>
                                    <p className="m-0 fw-bold text-capitalize">{`${student?.firstName || ""} ${student?.lastName || ""}`}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Track: </p>
                                    <p className="m-0 fw-bold">{student?.track || ""}</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 d-flex flex-column gap-2 mt-2 mt-md-0">
                                <div className="d-flex gap-2">
                                    <p className="m-0">Grade Level: </p>
                                    <p className="m-0 fw-bold">{student?.gradeLevel || ""}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Section: </p>
                                    <p className="m-0 fw-bold">{student?.section || "No Section"}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Strand: </p>
                                    <p className="m-0 fw-bold">{student?.strand || ""}</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <p className="m-0">Semester: </p>
                                    <p className="m-0 fw-bold">{student?.semester === 1 ? "First" : "Second" || ""}</p>
                                </div>
                            </div>
                        </div>

                        <hr className="my-4" />
                            
                        {/* Subjects Table */}
                        <div className="table-responsive mb-4">
                            <table className="table table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-bold text-center">Subject</th>
                                        <th className="fw-bold text-center">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student?.subjects && student.subjects.length > 0 ? (
                                        student.subjects.map((subject, index) => (
                                            <tr key={index}>
                                                <td className="text-capitalize">{subject?.subjectName || 'N/A'}</td>
                                                <td className="text-capitalize">{subject?.subjectTeacher || 'TBA'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-center text-muted">No subjects enrolled</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <hr className="my-4" />

                        {/* Signature Section */}
                        <div className="row mt-5">
                            <div className="col-md-6 text-center">
                                <div className="">
                                    <strong className="text-capitalize">
                                        {student?.lastName || ''}, {student?.firstName || ''} {student?.middleName ? student.middleName.charAt(0) + '.' : ''}
                                    </strong>
                                </div>
                                <div className="border-top border-dark d-inline-block px-5"
                                    style={{width:"250px"}}
                                ></div>
                                <div className="mt-2">
                                    <em>Student's Signature</em>
                                </div>
                            </div>
                            <div className="col-md-6 text-center">
                                <div className="">
                                    <strong>&nbsp;</strong>
                                </div>
                                <div className="border-top border-dark d-inline-block px-5"
                                style={{width:"250px"}}
                                ></div>
                                <div className="mt-2">
                                    <em>Registrar's Signature</em>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

    )
}

export default RegistrationViewForm;