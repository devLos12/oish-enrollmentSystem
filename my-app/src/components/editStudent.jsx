import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { globalContext } from "../context/global";
import { useLocation, useNavigate } from "react-router-dom";

const EditStudent = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();
    const studentData = location?.state?.selectedStudent;
    const currentSemStatus = studentData?.currentSemHistory?.status || studentData?.status || 'pending';

    // ✅ Galing sa currentSemSubjects — flat na, may subjectCode na
    const currentSemSubjects = studentData?.currentSemSubjects || [];

    const [selectedStudent, setSelectedStudent] = useState({
        ...studentData,
        status: currentSemStatus,
    });
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);

    // ✅ Always start empty — admin manually selects failed subjects
    const [repeatedSubjects, setRepeatedSubjects] = useState([]);

    const [isAcademicFieldsEditable, setIsAcademicFieldsEditable] = useState(false);

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [isUpdating, setIsUpdating] = useState(false);

    const gradeOptions = [11, 12];
    const statusOptions = ['pending', 'enrolled', 'unenrolled', 'graduated'];

    const trackStrandMapping = {
        'Academic': ['STEM', 'ABM', 'HUMSS', 'GAS'],
        'TVL': ['Home Economics', 'ICT', 'Industrial Arts'],
    };

    const trackOptions = Object.keys(trackStrandMapping);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    useEffect(() => {
        if (selectedStudent?.gradeLevel && selectedStudent?.strand && selectedStudent?.track) {
            fetchSections(
                selectedStudent.gradeLevel,
                selectedStudent.track,
                selectedStudent.strand,
            );
        }
    }, [selectedStudent?.gradeLevel, selectedStudent?.strand, selectedStudent?.track]);

    const fetchSections = async (gradeLevel, track, strand) => {
        try {
            setLoadingSections(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSections?gradeLevel=${gradeLevel}&track=${track}&strand=${strand}`,
                { method: "GET", credentials: "include" }
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

    // ✅ Toggle subject from checkbox
    const getSubjectKey = (s) => s.subjectCode || String(s.subjectId) || s.subjectName || '';

    const handleToggleRepeatedSubject = (subject) => {
        const key = getSubjectKey(subject);
        const exists = repeatedSubjects.find(r => getSubjectKey(r) === key);
        if (exists) {
            setRepeatedSubjects(prev => prev.filter(r => getSubjectKey(r) !== key));
        } else {
            setRepeatedSubjects(prev => [...prev, {
                subjectCode: subject.subjectCode || '',
                subjectName: subject.subjectName || '',
                semester: subject.semester || studentData?.currentSemHistory?.semester || 1,
                status: 'failed'
            }]);
        }
    };

    // ✅ Select All toggle
    const isAllSelected = currentSemSubjects.length > 0 &&
        currentSemSubjects.every(s => repeatedSubjects.find(r => getSubjectKey(r) === getSubjectKey(s)));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setRepeatedSubjects([]);
        } else {
            setRepeatedSubjects(currentSemSubjects.map(s => ({
                subjectCode: s.subjectCode || '',
                subjectName: s.subjectName || '',
                semester: s.semester || studentData?.currentSemHistory?.semester || 1,
                status: 'failed'
            })));
        }
    };

    const isRepeatedSubjectsValid = () => {
        if (selectedStudent?.studentType !== 'repeater') return true;
        // ✅ Okay na kung may existing sa DB o may bagong pinili
        return repeatedSubjects.length > 0 ||
            (studentData?.repeatedSubjects?.length > 0);
    };

    const handleUpdateStudent = async () => {
        if (selectedStudent?.lrn && selectedStudent.lrn !== 'N/A') {
            const cleanedLRN = selectedStudent.lrn.replace(/\D/g, '');
            if (cleanedLRN.length !== 12) {
                showAlert("LRN must be exactly 12 digits", 'error');
                return;
            }
        }

        // ✅ Skip section validation kung repeater na may existing repeatedSubjects
        // (hindi pa kailangan ng section pag pending pa lang si repeater)
        const isRepeaterWithExisting = selectedStudent?.studentType === 'repeater' &&
            studentData?.repeatedSubjects?.length > 0;

        if (!isRepeaterWithExisting) {
            if (!selectedStudent?.section || !selectedStudent.section.trim()) {
                showAlert("Please select a section first", 'error');
                return;
            }
        }

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
                    gradeLevel: selectedStudent.gradeLevel,
                    track: selectedStudent.track,
                    strand: selectedStudent.strand,
                    section: selectedStudent.section,
                    status: selectedStudent.status,
                    studentType: selectedStudent.studentType,
                    repeatedSubjects: selectedStudent.studentType === 'repeater'
                        ? repeatedSubjects
                        : []
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showAlert(data.message, 'success');
            setTimeout(() => navigate(-1), 1500);
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => navigate(-1);

    return (
        <>
            <div className="container mt-4">
                <div className="row">
                    <div className="col-12 mb-2">
                        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}>
                            <i className="fa fa-arrow-left me-2" />Back
                        </button>
                    </div>

                    <div className="col">
                        <div className="card shadow-sm bg-white">
                            <div className="card-header py-3 bg-danger bg-opacity-10 text-danger">
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
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, firstName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Middle Name</label>
                                        <input
                                            type="text"
                                            className="form-control text-capitalize"
                                            value={selectedStudent?.middleName || ''}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, middleName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control text-capitalize"
                                            value={selectedStudent?.lastName || ''}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, lastName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                        />
                                    </div>
                                </div>

                                {/* Contact Fields */}
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">
                                            LRN
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
                                                const cleaned = e.target.value.replace(/\D/g, '').substring(0, 12);
                                                setSelectedStudent({ ...selectedStudent, lrn: cleaned });
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
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Contact Number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={selectedStudent?.contactNumber || ''}
                                            onChange={(e) => {
                                                let cleaned = e.target.value.replace(/\D/g, '').substring(0, 11);
                                                let formatted = '';
                                                if (cleaned.length > 0) {
                                                    formatted = cleaned.substring(0, 4);
                                                    if (cleaned.length > 4) formatted += ' ' + cleaned.substring(4, 7);
                                                    if (cleaned.length > 7) formatted += ' ' + cleaned.substring(7, 11);
                                                }
                                                setSelectedStudent({ ...selectedStudent, contactNumber: formatted });
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Academic Fields Toggle */}
                                <div className="row mb-2">
                                    <div className="col-12">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="enableAcademicEdit"
                                                checked={isAcademicFieldsEditable}
                                                onChange={(e) => setIsAcademicFieldsEditable(e.target.checked)}
                                            />
                                            <label className="form-check-label fw-bold text-danger" htmlFor="enableAcademicEdit">
                                                <i className="fa fa-unlock me-1"></i>
                                                Enable editing for Grade Level, Track, and Strand
                                            </label>
                                        </div>
                                        <small className="text-muted d-block ms-4">
                                            <i className="fa fa-info-circle me-1"></i>
                                            Check this box to modify academic information
                                        </small>
                                    </div>
                                </div>

                                {/* Academic Fields */}
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Grade Level</label>
                                        <select
                                            className="form-select"
                                            value={selectedStudent?.gradeLevel || 11}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, gradeLevel: parseInt(e.target.value) })}
                                            disabled={!isAcademicFieldsEditable}
                                        >
                                            {gradeOptions.map(grade => (
                                                <option key={grade} value={grade}>Grade {grade}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Track</label>
                                        <select
                                            className="form-select"
                                            value={selectedStudent?.track || ''}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, track: e.target.value, strand: '' })}
                                            disabled={!isAcademicFieldsEditable}
                                        >
                                            <option value="">Select Track</option>
                                            {trackOptions.map(track => (
                                                <option key={track} value={track}>{track}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label text-capitalize fw-bold">Strand</label>
                                        <select
                                            className="form-select"
                                            value={selectedStudent?.strand || ''}
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, strand: e.target.value })}
                                            disabled={!isAcademicFieldsEditable}
                                        >
                                            <option value="">Select Strand</option>
                                            {selectedStudent?.track && trackStrandMapping[selectedStudent.track]?.map(strand => (
                                                <option key={strand} value={strand}>{strand}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Section and Student Type */}
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
                                            onChange={(e) => setSelectedStudent({ ...selectedStudent, section: e.target.value })}
                                            disabled={!selectedStudent?.gradeLevel || !selectedStudent?.strand || loadingSections}
                                        >
                                            <option value="" hidden={selectedStudent?.section}>Select Section</option>
                                            {selectedStudent?.section && (
                                                <option value="" className="text-danger">Remove Section</option>
                                            )}
                                            {availableSections.map(section => (
                                                <option key={section._id} value={section.name}>
                                                    {section.name} ({section.students?.length || 0}/{section.maxCapacity})
                                                </option>
                                            ))}
                                        </select>
                                        {availableSections.length === 0 && selectedStudent?.strand && !loadingSections && (
                                            <small className="text-warning d-block mt-1">
                                                <i className="fa fa-exclamation-triangle me-1"></i>
                                                No sections available for this combination
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label text-capitalize fw-bold">Student Type</label>
                                        <select
                                            className="form-select text-capitalize"
                                            value={selectedStudent?.studentType || ''}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                setSelectedStudent({ ...selectedStudent, studentType: newType });
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

                                {/* Status */}
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
                                                <option key={status} value={status} hidden={status === "pending"}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="text-muted d-block mt-1">
                                            Change student status (e.g., pending → enrolled)
                                        </small>
                                    </div>
                                </div>

                                {/* ✅ Repeater Section */}
                                {selectedStudent?.studentType === 'repeater' && (
                                    <div className="mt-3">
                                        {/* ✅ CASE 1 — May existing repeatedSubjects na sa DB — display lang */}
                                        {studentData?.repeatedSubjects?.length > 0 ? (
                                            <div className="card border-danger">
                                                <div className="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6 className="mb-0 fw-bold text-danger">
                                                            <i className="fa fa-exclamation-triangle me-2"></i>
                                                            Failed Subjects (Repeater)
                                                        </h6>
                                                        <small className="text-muted">
                                                            To enroll this student, change Student Type to <strong>Regular</strong>
                                                        </small>
                                                    </div>
                                                    <span className="badge bg-danger">
                                                        {studentData.repeatedSubjects.length} subject{studentData.repeatedSubjects.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="card-body p-0">
                                                    <table className="table table-bordered mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="text-center" style={{ width: '140px' }}>Subject Code</th>
                                                                <th>Subject Name</th>
                                                                <th className="text-center" style={{ width: '100px' }}>Semester</th>
                                                                <th className="text-center" style={{ width: '100px' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {studentData.repeatedSubjects.map((subject, index) => (
                                                                <tr key={index}>
                                                                    <td className="text-center">
                                                                        <span className="badge bg-secondary font-monospace">
                                                                            {subject.subjectCode || '—'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="small fw-semibold text-capitalize">
                                                                        {subject.subjectName}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="badge bg-info text-dark">
                                                                            Sem {subject.semester}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="badge bg-danger">
                                                                            <i className="fa fa-times me-1"></i>
                                                                            Failed
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            // ✅ CASE 2 — Walang existing — admin pipili ng failed subjects via checkbox
                                            <div className="card border-warning">
                                                <div className="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-0 fw-bold text-warning">
                                                            <i className="fa fa-list-check me-2"></i>
                                                            Select Failed Subjects
                                                        </h6>
                                                        <small className="text-muted">
                                                            Check the subjects this student failed / did not comply
                                                        </small>
                                                    </div>
                                                    <span className="badge bg-warning text-dark">
                                                        {repeatedSubjects.length} selected
                                                    </span>
                                                </div>
                                                <div className="card-body p-0">
                                                    {currentSemSubjects.length > 0 ? (
                                                        <table className="table table-bordered table-hover mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th className="text-center" style={{ width: '50px' }}>
                                                                        {/* ✅ Select All checkbox */}
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={isAllSelected}
                                                                            onChange={handleSelectAll}
                                                                            title="Select All"
                                                                        />
                                                                    </th>
                                                                    <th className="text-center" style={{ width: '140px' }}>Subject Code</th>
                                                                    <th>Subject Name</th>
                                                                    <th className="text-center" style={{ width: '100px' }}>Semester</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {currentSemSubjects.map((subject, index) => {
                                                                    const key = getSubjectKey(subject);
                                                                    const isChecked = !!repeatedSubjects.find(r => getSubjectKey(r) === key);
                                                                    return (
                                                                        <tr
                                                                            key={index}
                                                                            className={isChecked ? 'table-danger' : ''}
                                                                            style={{ cursor: 'pointer' }}
                                                                            onClick={() => handleToggleRepeatedSubject(subject)}
                                                                        >
                                                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="form-check-input"
                                                                                    checked={isChecked}
                                                                                    onChange={() => handleToggleRepeatedSubject(subject)}
                                                                                />
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-secondary font-monospace">
                                                                                    {subject.subjectCode || '—'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="small fw-semibold text-capitalize">
                                                                                {subject.subjectName}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-info text-dark">
                                                                                    Sem {subject.semester}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="text-center py-4 text-muted">
                                                            <i className="fa fa-inbox fa-2x mb-2 d-block"></i>
                                                            <small>No subjects found for current semester.</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            <div className="card-footer bg-light">
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        {selectedStudent?.studentType === 'repeater' && !isRepeatedSubjectsValid() && (
                                            <small className="text-danger d-block">
                                                <i className="fa fa-exclamation-circle me-1"></i>
                                                Please select at least one failed subject
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

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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