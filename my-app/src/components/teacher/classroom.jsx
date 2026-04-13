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
    const [filterStrand, setFilterStrand] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [schoolYears, setSchoolYears] = useState([]);
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('');
    const navigate = useNavigate();

    // Utility function to format time to 12-hour with AM/PM
    const formatTime = (time) => {
        if (!time) return '';
        
        if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
            return time;
        }
        
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        
        hour = hour % 12;
        hour = hour ? hour : 12;
        
        return `${hour}:${minutes} ${ampm}`;
    };

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);
    
    // Fetch all school years on mount
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getAllSchoolYears`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            if(data.success && data.data) {
                setSchoolYears(data.data);
                const activeYear = data.data.find(sy => sy.isCurrent);

                if(activeYear) {
                    setSelectedSchoolYearId(activeYear._id);
                } else if(data.data.length > 0) {
                    setSelectedSchoolYearId(data.data[0]._id);
                }
            }
        })
        .catch((error) => {
            console.log("Error fetching school years: ", error.message);
        });
    }, []);

    useEffect(() =>{
        if (!selectedSchoolYearId) {
            setSubjectClass([]);
            setFilteredSubjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/getTeacherSubjectsBySchoolYear?schoolYearId=${selectedSchoolYearId}`, {
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
    }, [selectedSchoolYearId]);

    const gradeOptions = [11, 12];

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

        if (filterStrand) {
            filtered = filtered.filter(subject => subject.strand === filterStrand);
        }

        setFilteredSubjects(filtered);
    }, [searchTerm, filterGrade, filterStrand, subjectClass]);

    return (
        <div className="container">
            {/* Search and Filters — laging visible */}
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
                                    <label className="form-label small fw-semibold">School Year/Semester</label>
                                    <select 
                                        className="form-select"
                                        value={selectedSchoolYearId}
                                        onChange={(e) => setSelectedSchoolYearId(e.target.value)}
                                    >
                                        <option value="">Select School Year</option>
                                        {schoolYears.map(sy => (
                                            <option key={sy._id} value={sy._id}>
                                                {sy.label} {sy.isCurrent ? '(Active)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="form-label small fw-semibold">Grade Level</label>
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
                                <div className="col-12 col-md-2">
                                    <label className="form-label small fw-semibold">Strand</label>
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
                                <div className="col-12 col-md-2 d-flex align-items-end">
                                    <p className="text-muted mb-0 small">
                                        <strong>{filteredSubjects.length}</strong> classroom{filteredSubjects.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area */}
            {loading ? (
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
            ) : subjectClass.length === 0 ? (
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <i className="fa-solid fa-chalkboard text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                                <h5 className="fw-bold text-dark mb-2">No Classrooms Found</h5>
                                <p className="text-muted mb-0">
                                    No classrooms available for the selected school year.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : filteredSubjects.length === 0 ? (
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
                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">subject:</p>
                                        <p className="m-0 text-capitalize small fw-bold">{data.subjectName}</p>
                                    </div>
                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">code:</p>
                                        <span className="m-0 text-capitalize small fw-bold small">{data.subjectCode}</span>
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
                                            {data.scheduleStartTime && data.scheduleEndTime 
                                                ? `${formatTime(data.scheduleStartTime)} - ${formatTime(data.scheduleEndTime)}`
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2 align-items-center">
                                        <p className="m-0 text-capitalize small fw-semibold">semester:</p>
                                        <p className="m-0 text-capitalize small fw-bold badge bg-primary">
                                            {Number(data.semester) === 1 ? "First" : "Second"}
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