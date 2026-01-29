import React, { useState, useLayoutEffect, useContext, useEffect, useRef } from 'react';
import { globalContext } from '../../context/global';
import { useLocation } from "react-router-dom";
import html2pdf from 'html2pdf.js';

const TeacherScheduleTable = () => {
    const [teacherSubjects, setTeacherSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState({ name: '', semester: '', schoolYear: '' });
    
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const scheduleRef = useRef();

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/getTeacherSubjectSchedule`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            if(data.success){
                setTeacherSubjects(data.data || []);

                if(data.data && data.data.length > 0) {
                    setTeacherInfo({
                        name: data.data[0].teacher || 'N/A',
                        semester: data.data[0].semester || '1',
                        schoolYear: '2025-2026'
                    });
                }
            }
        })
        .catch((error) => {
            console.log("Error: ", error.message);
            setTeacherSubjects([]);
        })
        .finally(() => {
            setLoading(false);
        });
    }, []);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const formatTo12Hour = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const timeToMinutes = (time) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // ✅ DYNAMIC: Generate time slots based on actual subject data
    const generateDynamicTimeSlots = () => {
        if (teacherSubjects.length === 0) return [];

        // Collect all unique time pairs (start-end)
        const timePairs = new Set();
        
        teacherSubjects.forEach(subject => {
            if (subject.scheduleStartTime && subject.scheduleEndTime) {
                const key = `${subject.scheduleStartTime}-${subject.scheduleEndTime}`;
                timePairs.add(key);
            }
        });

        // Convert to array and sort by start time
        const sortedSlots = Array.from(timePairs)
            .map(pair => {
                const [start, end] = pair.split('-');
                return { start, end, startMinutes: timeToMinutes(start) };
            })
            .sort((a, b) => a.startMinutes - b.startMinutes);

        return sortedSlots;
    };

    const timeSlots = generateDynamicTimeSlots();

    // ✅ Get subject for exact time slot
    const getSubjectForSlot = (startTime, endTime) => {
        return teacherSubjects.find(subject => 
            subject.scheduleStartTime === startTime && 
            subject.scheduleEndTime === endTime
        );
    };

    const downloadPDF = async () => {
        setDownloadingPdf(true);
        try {
            const element = scheduleRef.current;
            
            const opt = {
                margin: [5, 5, 5, 5],
                filename: `Teacher_Schedule_${teacherInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'landscape',
                    compress: true
                },
                pagebreak: { mode: 'avoid-all' }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4" 
        style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div ref={scheduleRef}>
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <p className="m-0 mb-1 fw-bold fs-3">Teacher Schedule</p>
                                        <p className="text-muted mb-0">2nd Semester, S.Y. 2025-2026</p>
                                    </div>
                                    <div className="col-md-4 text-md-end">
                                        <p className="text-muted mb-1 small">Name of Teacher</p>
                                        <p className="m-0 fw-bold mb-1 text-uppercase">{teacherInfo.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">   
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body p-0">
                                {teacherSubjects.length === 0 ? (
                                    <div className="text-center p-5">
                                        <i className="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">No subjects assigned yet.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered mb-0">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th className="text-center align-middle" style={{ width: '150px' }}>
                                                        TIME
                                                    </th>
                                                    {days.map(day => (
                                                        <th key={day} className="text-center align-middle">
                                                            <div className="fw-bold">{day.toUpperCase()}</div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timeSlots.map((slot, idx) => {
                                                    const subject = getSubjectForSlot(slot.start, slot.end);

                                                    return (
                                                        <tr key={idx}>
                                                            {/* ✅ TIME COLUMN - Exact times from data */}
                                                            <td className="text-center align-middle bg-light fw-medium" style={{ fontSize: '0.85rem' }}>
                                                                {formatTo12Hour(slot.start)} - {formatTo12Hour(slot.end)}
                                                            </td>

                                                            {/* ✅ Render across ALL days (Mon-Fri) */}
                                                            {subject ? (
                                                                days.map(day => (
                                                                    <td
                                                                        key={day}
                                                                        className="align-top"
                                                                        style={{ 
                                                                            padding: '12px',
                                                                            backgroundColor: subject.subjectName?.toLowerCase().includes('reading') ? '#FFE5E5' :
                                                                                           subject.subjectName?.toLowerCase().includes('immersion') ? '#E5FFE5' :
                                                                                           subject.subjectName?.toLowerCase().includes('homeroom') ? '#FFFFFF' :
                                                                                           '#F5F5F5'
                                                                        }}
                                                                    >
                                                                        <div className="fw-bold mb-1 small text-capitalize">
                                                                            {subject.subjectName}
                                                                        </div>
                                                                        <div className="text-muted small text-capitalize">
                                                                            {subject.sectionName || subject.section}
                                                                        </div>
                                                                        {subject.room && (
                                                                            <div className="text-muted small">
                                                                                {subject.room}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                ))
                                                            ) : (
                                                                // Empty cells if no subject at this time
                                                                days.map(day => (
                                                                    <td key={day} style={{ minWidth: '120px', height: '60px' }}>
                                                                        &nbsp;
                                                                    </td>
                                                                ))
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {teacherSubjects.length > 0 && (
                <div className="row mt-3">
                    <div className="col-12">
                        <button 
                            className="btn btn-primary"
                            onClick={downloadPDF}
                            disabled={downloadingPdf}
                        >
                            {downloadingPdf ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-download me-2"></i>
                                    Download as PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
    
export default TeacherScheduleTable;