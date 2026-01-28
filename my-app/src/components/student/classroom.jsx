import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext} from "../../context/global.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const ClassRoom = () => {
    const { setTextHeader, profile } = useContext(globalContext);
    const location = useLocation();
    const [subjectClass, setSubjectClass] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);
    
    useEffect(() =>{
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/getClassrooms`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            console.log(data);
            setSubjectClass(data);
        })
        .catch((error) => {
            console.log("Error: ", error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    },[]);

    const formatTo12Hour = (time) => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    if(loading){
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <div className="spinner-border text-danger mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mb-0">Loading classrooms...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if(subjectClass.length <= 0){
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <i className="fa-solid fa-chalkboard text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                                <h5 className="fw-bold text-dark mb-2">No Classrooms Found</h5>
                                <p className="text-muted mb-0">
                                    You are not enrolled in any classrooms yet.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="row my-5">
                {subjectClass.map((data, i) => (
                    <div 
                        key={i} 
                        className="col-12 col-md-6 col-lg-4 mb-3 cursor"
                        onClick={() => {
                            navigate("/student/students", { 
                                state: { 
                                    title: "Classroom", 
                                    data: data 
                                }
                            });
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card border-0 shadow-sm h-100 hover-card">
                            <div className="p-2 bg-danger rounded-top">
                                <p className="m-0 text-capitalize text-white fw-semibold text-center">
                                    {`${data.subjectCode} - ${data.subjectName}`}
                                </p>
                            </div>

                            <div className="card-body d-flex flex-column gap-2">
                                <div className="d-flex gap-2 align-items-center">
                                    <p className="m-0 text-capitalize small fw-semibold">Grade & section:</p>
                                    <p className="m-0 text-capitalize small fw-bold">
                                        {data.gradeLevel} - {data.sectionName || `${data.gradeLevel} ${profile?.section || 'N/A'}`}
                                    </p>
                                </div>
                                
                                <div className="d-flex gap-2 align-items-center">
                                    <p className="m-0 text-capitalize small fw-semibold">Teacher:</p>
                                    <p className="m-0 text-capitalize small fw-bold">
                                        {data.teacher || 'N/A'}
                                    </p>
                                </div>

                                {/* 🔥 Schedule Display */}
                                {data.scheduleDay && (
                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">Schedule:</p>
                                        <p className="m-0 text-capitalize small fw-bold">
                                            {data.scheduleDay} - {formatTo12Hour(data.scheduleStartTime)} - {formatTo12Hour(data.scheduleEndTime)}
                                        </p>
                                    </div>
                                )}

                                {data.room && (
                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">Room:</p>
                                        <p className="m-0 text-capitalize small fw-bold">
                                            {data.room}
                                        </p>
                                    </div>
                                )}

                                <div className="d-flex gap-2 align-items-center">
                                    <p className="m-0 text-capitalize small fw-semibold">semester:</p>
                                    <p className="m-0 text-capitalize small fw-bold  badge bg-info">
                                        {data.semester === 1 ? "First" : "Second"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .hover-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
            `}</style>
        </div>
    );
}

export default ClassRoom;