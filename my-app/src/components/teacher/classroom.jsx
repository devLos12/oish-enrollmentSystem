import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext} from "../../context/global.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const ClassRoom = () => {
    const { setTextHeader, profile } = useContext(globalContext);
    const location = useLocation();
    const [subjectClass, setSubjectClass] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStrand, setFilterStrand] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Utility function to format time to 12-hour with AM/PM
    const formatTime = (time) => {
        if (!time) return '';
        
        // If already has AM/PM, return as is
        if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
            return time;
        }
        
        // Parse 24-hour format (HH:MM)
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        
        hour = hour % 12;
        hour = hour ? hour : 12; // 0 should be 12
        
        return `${hour}:${minutes} ${ampm}`;
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);
    


    useEffect(() =>{
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/getTeacherSubjects`, {
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
                console.log(data.data);
                setSubjectClass(data.data);
                setFilteredSubjects(data.data);
            }
        })
        .catch((error) => {
            console.log("Error: ", error.message);
        })
        .finally(() => {
            setLoading(false);
        });
    },[]);

    

    // Dynamic options from actual data
    const gradeOptions = [...new Set(
        subjectClass
            .map(subject => subject.gradeLevel)
            .filter(grade => grade)
    )].sort((a, b) => a - b);

    const semesterOptions = [...new Set(
        subjectClass
            .map(subject => subject.semester)
            .filter(sem => sem)
    )].sort((a, b) => a - b);

    const strandOptions = [...new Set(
        subjectClass
            .map(subject => subject.strand)
            .filter(strand => strand)
    )].sort();

    // Filter logic
    useEffect(() => {
        let filtered = subjectClass.filter(subject => {
            const subjectName = subject.subjectName?.toLowerCase() || '';
            const subjectCode = subject.subjectCode?.toLowerCase() || '';
            const teacher = subject.teacher?.toLowerCase() || '';
            
            return subjectName.includes(searchTerm.toLowerCase()) ||
                   subjectCode.includes(searchTerm.toLowerCase()) ||
                   teacher.includes(searchTerm.toLowerCase());
        });

        if (filterGrade) {
            filtered = filtered.filter(subject => subject.gradeLevel === parseInt(filterGrade));
        }

        if (filterSemester) {
            filtered = filtered.filter(subject => subject.semester === parseInt(filterSemester));
        }

        if (filterStrand) {
            filtered = filtered.filter(subject => subject.strand === filterStrand);
        }

        setFilteredSubjects(filtered);
    }, [searchTerm, filterGrade, filterSemester, filterStrand, subjectClass]);
        
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
            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            {/* Search Bar */}
                            <div className="row mb-3">
                                <div className="col-12">
                                    <div className="input-group">
                                        <span className="input-group-text bg-white">
                                            <i className="fa fa-search text-muted"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control border-start-0" 
                                            placeholder="Search by subject name, code, or teacher..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="row g-2">
                                <div className="col-12 col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filterGrade}
                                        onChange={(e) => setFilterGrade(e.target.value)}
                                    >
                                        <option value="">All Grade Levels</option>
                                        {gradeOptions.map(grade => (
                                            <option key={grade} value={grade}>Grade {grade}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filterSemester}
                                        onChange={(e) => setFilterSemester(e.target.value)}
                                    >
                                        <option value="">All Semesters</option>
                                        {semesterOptions.map(semester => (
                                            <option key={semester} value={semester}>Semester {semester}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filterStrand}
                                        onChange={(e) => setFilterStrand(e.target.value)}
                                    >
                                        <option value="">All Strands</option>
                                        {strandOptions.map(strand => (
                                            <option key={strand} value={strand}>{strand}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3 d-flex align-items-center">
                                    <p className="text-muted mb-0">
                                        <strong>{filteredSubjects.length}</strong> {filteredSubjects.length === 1 ? 'classroom' : 'classrooms'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classroom Cards */}
            {filteredSubjects.length === 0 ? (
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <i className="fa fa-filter text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                                <h5 className="fw-bold text-dark mb-2">No Results Found</h5>
                                <p className="text-muted mb-0">
                                    Try adjusting your filters or search terms
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {filteredSubjects.map((data, i) => (
                        <div 
                            key={i} 
                            className="col-12 col-md-6 col-lg-4 mb-3 cursor"
                            onClick={() => {
                                navigate('/staff/students', {
                                    state : { 
                                        subjectId: data.subjectId,  
                                        sectionId: data.sectionId,
                                        title: "classroom"
                                    }
                                })
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card border-0 shadow-sm h-100 hover-card">
                                <div className="p-2 bg-danger rounded-top">
                                    <p className="m-0 text-capitalize text-white fw-semibold text-center">
                                        {`${data.gradeLevel}  ${data.sectionName}`}
                                    </p>
                                </div>

                                <div className="card-body d-flex flex-column gap-2">
                                    {/* <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">Strand:</p>
                                        <span className="badge bg-danger">{data.strand}</span>
                                    </div> */}

                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">subject:</p>
                                        <p className="m-0 text-capitalize small fw-bold">{data.subjectName}</p>
                                    </div>

                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">code:</p>
                                        <span className="m-0 text-capitalize small fw-bold badge bg-info small">{data.subjectCode}</span>
                                    </div>

                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">teacher:</p>
                                        <p className="m-0 text-capitalize small fw-bold">
                                            {data.teacher || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">schedule:</p>
                                        <p className="m-0 small fw-bold">
                                            {data.scheduleDay 
                                                ? `${data.scheduleDay} ${formatTime(data.scheduleStartTime)} - ${formatTime(data.scheduleEndTime)}`
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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