import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";

const EditStudent = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();
    const studentData = location?.state?.selectedStudent;

    const [selectedStudent, setSelectedStudent] = useState(studentData || {});
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [repeatedSubjects, setRepeatedSubjects] = useState(
        studentData?.repeatedSubjects || []
    );

    // Alert Modal states
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success'); // 'success' or 'error'


    const [isUpdating, setIsUpdating] = useState(false);

    const gradeOptions = [11, 12];
    const statusOptions = ['pending', 'enrolled', 'unenrolled', 'graduated'];
    
    const trackStrandMapping = {
        'Academic': ['STEM', 'ABM', 'HUMSS', 'GAS'],
        'TVL': ['Home Economics', 'ICT', 'Industrial Arts'],
    };
    
    const trackOptions = Object.keys(trackStrandMapping);

    // useLayoutEffect(() => {
    //     setTextHeader(location?.state?.title || 'Edit Student');
    // }, [location?.state?.title, setTextHeader]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    // Fetch sections when grade level, strand, track, or semester changes
    useEffect(() => {
        if (selectedStudent?.gradeLevel && selectedStudent?.strand && selectedStudent?.track) {
            fetchSections(
                selectedStudent.gradeLevel, 
                selectedStudent.track,
                selectedStudent.strand,
                selectedStudent.semester || 1
            );
        }
    }, [selectedStudent?.gradeLevel, selectedStudent?.strand, selectedStudent?.track, selectedStudent?.semester]);
    
    
    
    const fetchSections = async (gradeLevel, track, strand, semester) => {


        try {
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSections?gradeLevel=${gradeLevel}&track=${track}&strand=${strand}&semester=${semester}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAvailableSections(data);
        } catch (error) {
            console.error("Error fetching sections:", error.message);
            showAlert("Failed to load sections", 'error');
            setAvailableSections([]);
        } finally {
            setLoadingSections(false);
        }
    };



    const handleAddRepeatedSubject = () => {
        setRepeatedSubjects([
            ...repeatedSubjects,
            {
                subjectCode: '',
                subjectName: '',
                semester: '',
                status: 'pending'
            }
        ]);
    };

    const handleRemoveRepeatedSubject = (index) => {
        const updated = repeatedSubjects.filter((_, i) => i !== index);
        setRepeatedSubjects(updated);
    };

    const handleRepeatedSubjectChange = (index, field, value) => {
        const updated = [...repeatedSubjects];
        updated[index][field] = value;
        setRepeatedSubjects(updated);
    };

    const isRepeatedSubjectsValid = () => {
        if (selectedStudent?.studentType !== 'repeater') return true;
        
        if (repeatedSubjects.length === 0) return false;
        
        return repeatedSubjects.every(subject => 
            subject.subjectCode.trim() !== '' &&
            subject.subjectName.trim() !== '' &&
            subject.semester !== ''
        );
    };

    const handleUpdateStudent = async () => {


        if (selectedStudent?.lrn && selectedStudent.lrn !== 'N/A') {
            const cleanedLRN = selectedStudent.lrn.replace(/\D/g, '');
            if (cleanedLRN.length !== 12) {
                showAlert("LRN must be exactly 12 digits", 'error');
                return;
            }
        }


        // Validate section is selected
        if (!selectedStudent?.section || !selectedStudent.section.trim()) {
            showAlert("Please select a section first", 'error');

            return;
        }
        
        // Validate contact number (only if provided)
        const cleanedContact = selectedStudent?.contactNumber?.replace(/\D/g, '') || '';
        if (cleanedContact.length > 0 && (cleanedContact.length !== 11 || !cleanedContact.startsWith('0'))) {
            showAlert("Contact number must be 11 digits and start with 0", 'error');

            return;
        }


        setIsUpdating(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateStudent/${selectedStudent._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: selectedStudent.firstName,
                    middleName: selectedStudent.middleName,
                    lastName: selectedStudent.lastName,
                    email: selectedStudent.email,
                    contactNumber: selectedStudent.contactNumber,
                    lrn: selectedStudent.lrn,
                    gradeLevel: parseInt(selectedStudent.gradeLevel),
                    track: selectedStudent.track,
                    strand: selectedStudent.strand,
                    semester: selectedStudent.semester,
                    section: selectedStudent.section,
                    status: selectedStudent.status,
                    studentType: selectedStudent.studentType,
                    repeatedSubjects: selectedStudent.studentType === 'repeater' ? repeatedSubjects : []
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            showAlert(data.message, 'success');
            // Navigate back after user clicks OK on success alert
            setTimeout(() => navigate(-1), 1500);
        } catch (error) {
            showAlert(error.message, 'error');
        }finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };





    useEffect(()=>{
        console.log("selected: ", selectedStudent);
    },[selectedStudent]);


    return (
        <>
            <div className="container mt-4">
                <div className="row">
                    <div className="col">
                        <div className="card shadow-sm">
                            <div className="card-header bg-danger text-white">
                                <h5 className="mb-0">
                                    <i className="fa fa-user-edit me-2"></i>
                                    Edit Student Information
                                </h5>
                            </div>
                            <div className="card-body">
                                {/* Name Fields */}
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">First Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control text-capitalize"
                                            value={selectedStudent?.firstName || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow letters and spaces
                                                const cleaned = value.replace(/[^a-zA-Z\s]/g, '');
                                                setSelectedStudent({...selectedStudent, firstName: cleaned});
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Middle Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control text-capitalize"
                                            value={selectedStudent?.middleName || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow letters and spaces
                                                const cleaned = value.replace(/[^a-zA-Z\s]/g, '');
                                                setSelectedStudent({...selectedStudent, middleName: cleaned});
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Last Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control text-capitalize"
                                            value={selectedStudent?.lastName || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow letters and spaces
                                                const cleaned = value.replace(/[^a-zA-Z\s]/g, '');
                                                setSelectedStudent({...selectedStudent, lastName: cleaned});
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Contact Fields */}
                                <div className="row mb-4">
                                      <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">
                                            LRN (Learner Reference Number)
                                            {selectedStudent?.lrn === 'N/A' && (
                                                <span className="badge bg-warning text-dark ms-2">Not Set</span>
                                            )}
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            placeholder="Enter 12-digit LRN"
                                            value={selectedStudent?.lrn === 'N/A' ? '' : (selectedStudent?.lrn || '')}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow numbers
                                                let cleaned = value.replace(/\D/g, '');
                                                
                                                // Limit to 12 digits
                                                cleaned = cleaned.substring(0, 12);
                                                
                                                setSelectedStudent({...selectedStudent, lrn: cleaned});
                                            }}
                                            maxLength={12}
                                        />
                                        <small className="text-muted d-block mt-1">
                                            <i className="fa fa-info-circle me-1"></i>
                                            Must be exactly 12 digits. Required for enrollment.
                                        </small>
                                        {selectedStudent?.lrn && selectedStudent.lrn !== 'N/A' && selectedStudent.lrn.length < 12 && (
                                            <small className="text-danger d-block mt-1">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                LRN must be 12 digits (currently {selectedStudent.lrn.length})
                                            </small>
                                        )}
                                    </div>


                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control"
                                            value={selectedStudent?.email || ''}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Contact Number</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={selectedStudent?.contactNumber || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                let cleaned = value.replace(/\D/g, '');
                                                
                                                // Limit to 11 digits
                                                cleaned = cleaned.substring(0, 11);
                                                
                                                // Format as 0XXX XXX XXXX
                                                let formatted = '';
                                                if (cleaned.length > 0) {
                                                    formatted = cleaned.substring(0, 4);
                                                    if (cleaned.length > 4) {
                                                        formatted += ' ' + cleaned.substring(4, 7);
                                                    }
                                                    if (cleaned.length > 7) {
                                                        formatted += ' ' + cleaned.substring(7, 11);
                                                    }
                                                }
                                                
                                                setSelectedStudent({...selectedStudent, contactNumber: formatted});
                                            }}                            
                                                                                    
                                        
                                        
                                        />
                                    </div>
                                </div>



                                {/* Academic Fields */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label text-capitalize fw-bold">Grade Level</label>
                                        <select 
                                            className="form-select"
                                            value={selectedStudent?.gradeLevel || 11}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, gradeLevel: parseInt(e.target.value)})}
                                        >
                                            {gradeOptions.map(grade => (
                                                <option key={grade} value={grade}>Grade {grade}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-capitalize fw-bold">Track</label>
                                        <select 
                                            className="form-select"
                                            value={selectedStudent?.track || ''}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, track: e.target.value, strand: ''})}
                                        >
                                            <option value="">Select Track</option>
                                            {trackOptions.map(track => (
                                                <option key={track} value={track}>{track}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-capitalize fw-bold">Strand</label>
                                        <select 
                                            className="form-select"
                                            value={selectedStudent?.strand || ''}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, strand: e.target.value})}
                                        >
                                            <option value="">Select Strand</option>
                                            {selectedStudent?.track && trackStrandMapping[selectedStudent.track]?.map(strand => (
                                                <option key={strand} value={strand}>{strand}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-capitalize fw-bold">Semester</label>
                                        <select 
                                            className="form-select"
                                            value={selectedStudent?.semester || 1}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, semester: parseInt(e.target.value)})}
                                        >
                                            <option value={1}>First</option>
                                            <option value={2}>Second</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Section and Status Fields */}
                                <div className="row mt-5">
                                    <p className="m-0 text-danger small my-2">*Edit this field only for enrollment status.</p>
                                    <div className="col-md-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Section
                                            {loadingSections && (
                                                <span className="spinner-border spinner-border-sm ms-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </span>
                                            )}
                                        </label>
                                        
                                        <select 
                                            className="form-select"
                                            value={selectedStudent?.section || ''}
                                            onChange={(e) => setSelectedStudent({...selectedStudent, section: e.target.value})}
                                            disabled={!selectedStudent?.gradeLevel || !selectedStudent?.strand || loadingSections}
                                        >
                                            <option value="" hidden={selectedStudent?.section}>Select Section</option>
                                            {selectedStudent?.section && (
                                                <option value="" className="text-danger">
                                                    Remove Section
                                                </option>
                                            )}
                                            {availableSections.map(section => (
                                                <option key={section._id} value={section.name}>
                                                    {section.name} ({section.students?.length || 0}/{section.maxCapacity})
                                                </option>
                                            ))}
                                        </select>
                                        
                                        {(!selectedStudent?.gradeLevel || !selectedStudent?.strand) && (
                                            <small className="text-muted d-block mt-1">
                                                <i className="fa fa-info-circle me-1"></i>
                                                Select Grade Level, Track, Strand, and Semester first
                                            </small>
                                        )}
                                        {availableSections.length === 0 && selectedStudent?.strand && !loadingSections && (
                                            <small className="text-warning d-block mt-1">
                                                <i className="fa fa-exclamation-triangle me-1"></i>
                                                No sections available for this combination
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label text-capitalize fw-bold">
                                            Student Type
                                        </label>
                                        <select
                                            className="form-select text-capitalize"
                                            value={selectedStudent?.studentType || ''}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                setSelectedStudent({ 
                                                    ...selectedStudent, 
                                                    studentType: newType,
                                                    status: newType === 'repeater' ? 'unenrolled' : selectedStudent.status
                                                });
                                                if (newType !== 'repeater') {
                                                    setRepeatedSubjects([]);
                                                }
                                            }}
                                        >   
                                            <option value="" disabled>Select Type</option>
                                            <option value="regular">Regular</option>
                                            <option value="repeater">Repeater</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Student Status */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label text-capitalize fw-bold">Status</label>
                                        <select
                                            className="form-select text-capitalize"
                                            value={selectedStudent?.status || ''}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, status: e.target.value })}
                                        >
                                            <option value="" hidden={selectedStudent?.status}>Select Status</option>
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status}
                                                hidden={status === "pending"}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="text-muted d-block mt-1">
                                            Change student status (e.g., pending → enrolled)
                                        </small>
                                    </div>
                                </div>

                                {/* Repeated Subjects Section - Only show if student type is "repeater" */}
                                {selectedStudent?.studentType === 'repeater' && (
                                    <div className="row mb-3">
                                        <div className="col-12">
                                            <div className="card border-warning">
                                                <div className="card-header bg-warning bg-opacity-10">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-0 text-capitalize fw-bold">
                                                            <i className="fa fa-repeat me-2"></i>
                                                            Repeated Subjects
                                                        </h6>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-warning"
                                                            onClick={handleAddRepeatedSubject}
                                                        >
                                                            <i className="fa fa-plus me-1"></i>
                                                            Add Subject
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    {repeatedSubjects.length === 0 ? (
                                                        <p className="text-muted text-center mb-0">
                                                            <i className="fa fa-info-circle me-1"></i>
                                                            No repeated subjects added yet. Click "Add Subject" to begin.
                                                        </p>
                                                    ) : (
                                                        <div className="row g-3">
                                                            {repeatedSubjects.map((subject, index) => (
                                                                <div key={index} className="col-12">
                                                                    <div className="card border">
                                                                        <div className="card-body">
                                                                            <div className="row g-2">
                                                                                <div className="col-md-3">
                                                                                    <label className="form-label small fw-bold">Subject Code</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control form-control-sm"
                                                                                        placeholder="e.g., MATH101"
                                                                                        value={subject.subjectCode}
                                                                                        onChange={(e) => handleRepeatedSubjectChange(index, 'subjectCode', e.target.value)}
                                                                                    />
                                                                                </div>
                                                                                <div className="col-md-4">
                                                                                    <label className="form-label small fw-bold">Subject Name</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control form-control-sm text-capitalize"
                                                                                        placeholder="e.g., Basic Calculus"
                                                                                        value={subject.subjectName.toLowerCase()}
                                                                                        onChange={(e) => handleRepeatedSubjectChange(index, 'subjectName', e.target.value)}
                                                                                    />
                                                                                </div>
                                                                                <div className="col-md-2">
                                                                                    <label className="form-label small fw-bold">Semester</label>
                                                                                    <select
                                                                                        className="form-select form-select-sm"
                                                                                        value={subject.semester}
                                                                                        onChange={(e) => handleRepeatedSubjectChange(index, 'semester', parseInt(e.target.value))}
                                                                                    >
                                                                                        <option value="">Select</option>
                                                                                        <option value={1}>First</option>
                                                                                        <option value={2}>Second</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="col-md-2">
                                                                                    <label className="form-label small fw-bold">Status</label>
                                                                                    <select
                                                                                        className="form-select form-select-sm text-capitalize"
                                                                                        value={subject.status}
                                                                                        onChange={(e) => handleRepeatedSubjectChange(index, 'status', e.target.value)}
                                                                                    >
                                                                                        <option value="pending">Pending</option>
                                                                                        <option value="failed">Failed</option>
                                                                                        <option value="passed">passed</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="col-md-1 d-flex align-items-end">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-sm btn-danger w-100"
                                                                                        onClick={() => handleRemoveRepeatedSubject(index)}
                                                                                        title="Remove subject"
                                                                                    >
                                                                                        <i className="fa fa-trash"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="card-footer bg-light">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        {selectedStudent?.studentType === 'repeater' && !isRepeatedSubjectsValid() && (
                                            <small className="text-danger d-block">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                Please add at least one repeated subject with complete information
                                            </small>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                        >
                                            <i className="fa fa-arrow-left me-2"></i>
                                            Back
                                        </button>
                                       <button 
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleUpdateStudent}
                                            disabled={!isRepeatedSubjectsValid() || isUpdating}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-save me-2"></i>
                                                    Update Student
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Modal - Success/Error Messages */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === 'success' ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa ${alertType === 'success' ? 'fa-check-circle' : 'fa-times-circle'} fa-3x`}></i>
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === 'success' ? 'Success!' : 'Error!'}</h5>
                                <p className="text-muted mb-4">{alertMessage}</p>
                                <button 
                                    type="button" 
                                    className={`btn ${alertType === 'success' ? 'btn-success' : 'btn-danger'} px-4`}
                                    onClick={() => setShowAlertModal(false)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditStudent;