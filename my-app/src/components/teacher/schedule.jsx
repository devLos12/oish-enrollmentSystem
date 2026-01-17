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
                console.log("API Response:", data.message);

                setTeacherSubjects(data.data || []);

                if(data.data && data.data.length > 0) {
                    setTeacherInfo({
                        name: data.data[0].teacher || 'N/A',
                        semester: data.data[0].semester || '1',
                        schoolYear: '2024-2025'
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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const formatTo12Hour = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 19; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
            if (hour < 19) {
                slots.push(`${String(hour).padStart(2, '0')}:30`);
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const roundToNearestSlot = (time) => {
        const minutes = timeToMinutes(time);
        const rounded = Math.floor(minutes / 30) * 30;
        const hours = Math.floor(rounded / 60);
        const mins = rounded % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const getDayTimeRange = (day) => {
        const daySubjects = teacherSubjects.filter(s => s.scheduleDay === day);
        if (daySubjects.length === 0) return null;

        const times = daySubjects.flatMap(s => [
            timeToMinutes(s.scheduleStartTime),
            timeToMinutes(s.scheduleEndTime)
        ]);

        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        const formatTime = (mins) => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        const startTime24 = formatTime(minTime);
        const endTime24 = formatTime(maxTime);
        
        return `${formatTo12Hour(startTime24)} - ${formatTo12Hour(endTime24)}`;
    };

    const getSubjectForSlot = (day, currentTime) => {
        const currentMinutes = timeToMinutes(currentTime);

        return teacherSubjects.find(subject => {
            if (subject.scheduleDay !== day) return false;

            const startRounded = roundToNearestSlot(subject.scheduleStartTime);
            const endRounded = roundToNearestSlot(subject.scheduleEndTime);
            const startMinutes = timeToMinutes(startRounded);
            const endMinutes = timeToMinutes(endRounded);

            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });
    };

    const getRowspan = (subject) => {
        const startRounded = roundToNearestSlot(subject.scheduleStartTime);
        const endRounded = roundToNearestSlot(subject.scheduleEndTime);
        const startMinutes = timeToMinutes(startRounded);
        const endMinutes = timeToMinutes(endRounded);
        const duration = endMinutes - startMinutes;
        return duration / 30;
    };

    const isCellMerged = (day, time) => {
        const currentMinutes = timeToMinutes(time);

        const subject = teacherSubjects.find(s => {
            if (s.scheduleDay !== day) return false;
            const startRounded = roundToNearestSlot(s.scheduleStartTime);
            const endRounded = roundToNearestSlot(s.scheduleEndTime);
            const startMinutes = timeToMinutes(startRounded);
            const endMinutes = timeToMinutes(endRounded);
            return currentMinutes > startMinutes && currentMinutes < endMinutes;
        });

        return !!subject;
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
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div ref={scheduleRef}>
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <p className="m-0 mb-1 fw-bold fs-3">Teacher Schedule</p>
                                        <p className="text-muted mb-0">Weekly teaching schedule</p>
                                    </div>
                                    <div className="col-md-4 text-md-end">
                                        <p className="text-muted mb-1 small">Teacher</p>
                                        <p className="m-0 fw-bold mb-1">{teacherInfo.name}</p>
                                        <p className="text-muted mb-0 small">Semester {teacherInfo.semester}, SY {teacherInfo.schoolYear}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card shadow">
                            <div className="card-body p-0">
                                {teacherSubjects.length === 0 ? (
                                    <div className="text-center p-5">
                                        <p className="text-muted">No subjects assigned yet.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered mb-0">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th className="text-center align-middle" colSpan="2" 
                                                    style={{ width: '160px' }}>
                                                        Time
                                                    </th>
                                                    {days.map(day => {
                                                        const timeRange = getDayTimeRange(day);
                                                        return (
                                                            <th key={day} className="text-center align-middle">
                                                                <div className="fw-bold small">{day}</div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timeSlots.map((time, idx) => {
                                                    if (idx === timeSlots.length - 1) return null;

                                                    const nextTime = timeSlots[idx + 1];

                                                    return (
                                                        <tr key={time}>
                                                            <td className="text-center align-middle bg-light fw-medium" style={{ width: '90px', fontSize: '0.75rem' }}>
                                                                {formatTo12Hour(time)}
                                                            </td>
                                                            <td className="text-center align-middle bg-light fw-medium" style={{ width: '90px', fontSize: '0.75rem' }}>
                                                                {formatTo12Hour(nextTime)}
                                                            </td>
                                                            {days.map(day => {
                                                                if (isCellMerged(day, time)) {
                                                                    return null;
                                                                }

                                                                const subject = getSubjectForSlot(day, time);

                                                                if (subject && roundToNearestSlot(subject.scheduleStartTime) === time) {
                                                                    const rowspan = getRowspan(subject);
                                                                    return (
                                                                        <td
                                                                            key={day}
                                                                            rowSpan={rowspan}
                                                                            className="align-top bg-primary bg-opacity-10"
                                                                            style={{ padding: '8px' }}
                                                                        >
                                                                            <div className="fw-bold mb-1 small text-capitalize">
                                                                                {subject.subjectName}
                                                                            </div>
                                                                            <div className="text-muted mb-1 small text-capitalize">
                                                                                Grade {subject.gradeLevel} - {subject.section}
                                                                            </div>
                                                                            <div className="text-muted mb-1 small text-capitalize">
                                                                                📍 {subject.room}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                }

                                                                return (
                                                                    <td key={day} style={{ minWidth: '120px' }}>
                                                                        &nbsp;
                                                                    </td>
                                                                );
                                                            })}
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