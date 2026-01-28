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
    const [isDownloading, setIsDownloading] = useState(false);


    useEffect(() =>{
        console.log(student)
    },[student]);


    useEffect(() => {
        if(!location?.state) {
            navigate(`/admin`, { replace: true })
            return
        }
    },[location?.state, navigate]);


    useLayoutEffect(() => {
        if (location?.state?.autoDownload) {
            handleAutoDownloadPDF(); // ✅ Changed from handleDownloadPDF
        }
    }, [location?.state?.autoDownload]);


    // ✅ AUTO-DOWNLOAD (for students - triggered by useLayoutEffect)
    const handleAutoDownloadPDF = async () => {
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
        
        // ✅ Always navigate after auto-download
        html2pdf().set(opt).from(element).save().then(() => {
            navigate("/student/registration_form");
        });
    };





        
    // ✅ MANUAL DOWNLOAD (for admin - triggered by button click)
    const handleManualDownloadPDF = async () => {
        setIsDownloading(true); // ✅ Start loading
        
        try {
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
            
            // ✅ NO navigation - just download
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setIsDownloading(false); // ✅ Stop loading
        }
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

    // ✅ Helper function to format time to 12-hour format with AM/PM
    const formatTime = (time) => {
        if (!time) return '';
        
        // Check if already has AM/PM
        if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
            return time;
        }
        
        // Parse time (assumes format like "08:00" or "8:00")
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        
        // Determine AM/PM
        const period = hour >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hour = hour % 12 || 12;
        
        return `${hour}:${minutes} ${period}`;
    };





    return (
        <div style={hiddenStyle}>

        <div className="container-fluid vh-100">
            <div className="row justify-content-center">
                <div className="col-12 col-md-12 col-lg-11 bg-white py-5">
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
                                    <p className="m-0 fw-bold text-capitalize">
                                        {student?.lastName || ""}, {student?.firstName || ""} {student?.middleName || ""} {student?.extensionName && student.extensionName !== "N/A" && student.extensionName !== "n/a" ? student.extensionName : ""}
                                    </p>
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
                                        <th className="fw-bold text-center">Day & Time</th>
                                        <th className="fw-bold text-center">Room</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student?.subjects && student.subjects.length > 0 ? (
                                        student.subjects.map((subject, index) => (
                                            <tr key={index}>
                                                <td className="text-capitalize">{subject?.subjectName || 'N/A'}</td>
                                                <td className="text-capitalize">{subject?.subjectTeacher || 'TBA'}</td>
                                                <td className="text-capitalize small">
                                                    {subject?.scheduleDay && subject?.scheduleStartTime && subject?.scheduleEndTime ? (
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-semibold">{subject.scheduleDay}</span>
                                                            <span className="text-muted">
                                                                {formatTime(subject.scheduleStartTime)} - {formatTime(subject.scheduleEndTime)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted fst-italic">TBA</span>
                                                    )}
                                                </td>
                                                <td className="text-capitalize">
                                                    {subject?.room ? (
                                                        subject.room
                                                    ) : (
                                                        <span className="text-muted fst-italic">TBA</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted">No subjects enrolled</td>
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
                                        {student?.lastName || ''}, {student?.firstName || ''} {student?.middleName } {student?.extensionName === "N/A" || student?.extensionName === "n/a" ? "" : student?.extensionName}
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
                    
                    {/* ✅ Download Button - Only for Admin */}
                    {!location?.state?.autoDownload && role === 'admin' && (
                        <div className='d-flex align-items-center gap-3 my-5 justify-content-center'> 
                            <button 
                                className='btn btn-secondary  px-4 text-capitalize'
                                onClick={() => navigate(-1)}
                                disabled={isDownloading} // ✅ Disable while downloading
                            >
                                <i className="fa fa-arrow-left me-2"></i>
                                Back
                            </button>
                            <button 
                                className='btn btn-danger  text-capitalize px-4'
                                onClick={handleManualDownloadPDF}
                                disabled={isDownloading} // ✅ Disable while downloading
                            >
                                {isDownloading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </span>
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-download me-2"></i>
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>              
                    )}




                </div>
            </div>
        </div>
        </div>

    )
}

export default RegistrationViewForm;