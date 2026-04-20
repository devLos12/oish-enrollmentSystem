import { useState, useLayoutEffect, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";

const Program = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'addTrack' | 'editTrack' | 'deleteTrack' | 'addStrand' | 'editStrand' | 'deleteStrand'
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [selectedStrand, setSelectedStrand] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Alert modal
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    };

    // ─────────────────────────────────────────
    // FETCH
    // ─────────────────────────────────────────
    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getPrograms`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPrograms(data);
        } catch (error) {
            showAlert('Failed to load programs: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    // ─────────────────────────────────────────
    // MODAL OPENERS
    // ─────────────────────────────────────────
    const openAddTrack = () => {
        setInputValue('');
        setModalType('addTrack');
        setShowModal(true);
    };

    const openEditTrack = (track) => {
        setSelectedTrack(track);
        setInputValue(track.trackName);
        setModalType('editTrack');
        setShowModal(true);
    };

    const openDeleteTrack = (track) => {
        setSelectedTrack(track);
        setModalType('deleteTrack');
        setShowModal(true);
    };

    const openAddStrand = (track) => {
        setSelectedTrack(track);
        setInputValue('');
        setModalType('addStrand');
        setShowModal(true);
    };

    const openEditStrand = (track, strand) => {
        setSelectedTrack(track);
        setSelectedStrand(strand);
        setInputValue(strand.strandName);
        setModalType('editStrand');
        setShowModal(true);
    };

    const openDeleteStrand = (track, strand) => {
        setSelectedTrack(track);
        setSelectedStrand(strand);
        setModalType('deleteStrand');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setInputValue('');
        setSelectedTrack(null);
        setSelectedStrand(null);
    };

    // ─────────────────────────────────────────
    // SUBMIT HANDLERS
    // ─────────────────────────────────────────
    const handleSubmit = async () => {
        if (!inputValue.trim() && modalType !== 'deleteTrack' && modalType !== 'deleteStrand') {
            showAlert('Please enter a name', 'error');
            return;
        }

        try {
            setSubmitting(true);
            let url = '';
            let method = 'POST';
            let body = {};

            if (modalType === 'addTrack') {
                url = `${import.meta.env.VITE_API_URL}/api/addTrack`;
                body = { trackName: inputValue.trim() };
            } else if (modalType === 'editTrack') {
                url = `${import.meta.env.VITE_API_URL}/api/updateTrack/${selectedTrack._id}`;
                method = 'PATCH';
                body = { trackName: inputValue.trim() };
            } else if (modalType === 'deleteTrack') {
                url = `${import.meta.env.VITE_API_URL}/api/deleteTrack/${selectedTrack._id}`;
                method = 'DELETE';
            } else if (modalType === 'addStrand') {
                url = `${import.meta.env.VITE_API_URL}/api/addStrand/${selectedTrack._id}`;
                body = { strandName: inputValue.trim() };
            } else if (modalType === 'editStrand') {
                url = `${import.meta.env.VITE_API_URL}/api/updateStrand/${selectedTrack._id}/${selectedStrand._id}`;
                method = 'PATCH';
                body = { strandName: inputValue.trim() };
            } else if (modalType === 'deleteStrand') {
                url = `${import.meta.env.VITE_API_URL}/api/deleteStrand/${selectedTrack._id}/${selectedStrand._id}`;
                method = 'DELETE';
            }

            const res = await fetch(url, {
                method,
                headers: method !== 'DELETE' ? { 'Content-Type': 'application/json' } : {},
                credentials: 'include',
                body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showAlert(data.message, 'success');
            closeModal();
            fetchPrograms();
        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle active status
    const handleToggleTrack = async (track) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateTrack/${track._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !track.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchPrograms();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    const handleToggleStrand = async (track, strand) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateStrand/${track._id}/${strand._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !strand.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchPrograms();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };

    const getModalTitle = () => {
        const titles = {
            addTrack: 'Add New Track',
            editTrack: 'Edit Track',
            deleteTrack: 'Delete Track',
            addStrand: `Add Strand to ${selectedTrack?.trackName}`,
            editStrand: 'Edit Strand',
            deleteStrand: 'Delete Strand',
        };
        return titles[modalType] || '';
    };

    const isDeleteModal = modalType === 'deleteTrack' || modalType === 'deleteStrand';
    const isStrandModal = modalType === 'addStrand' || modalType === 'editStrand';
    const isTrackModal = modalType === 'addTrack' || modalType === 'editTrack';

    return (
        <>
            <div className="container-fluid py-4 g-0 g-md-5">
                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h4 className="text-capitalize fw-bold mb-1">Program Management</h4>
                        <p className="text-muted small mb-0">Manage tracks and strands for SHS curriculum</p>
                    </div>
                    <div className="col-12 mt-2 d-flex justify-content-md-end gap-2">
                        <button className="btn btn-danger" onClick={openAddTrack}>
                            <i className="fa fa-plus me-2"></i>Add Track
                        </button>
                        <button className="btn btn-outline-secondary " onClick={fetchPrograms} disabled={loading} title="Refresh">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fa fa-refresh"></i>}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status"></div>
                        <p className="text-muted mt-2">Loading programs...</p>
                    </div>
                ) : programs.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="fa fa-graduation-cap fa-3x text-muted mb-3"></i>
                        <p className="text-muted">No tracks found. Click "Add Track" to get started.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {programs.map((track) => (
                            <div className="col-12 col-md-6" key={track._id}>
                                <div className={`card shadow-sm h-100 ${!track.isActive ? 'opacity-75' : ''}`}>
                                    {/* Track Header */}
                                    <div className="card-header d-flex align-items-center justify-content-between bg-danger bg-opacity-10">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="fa fa-graduation-cap text-danger"></i>
                                            <span className="fw-bold text-capitalize">{track.trackName}</span>
                                            {!track.isActive && (
                                                <span className="badge bg-secondary ms-1">Inactive</span>
                                            )}
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => openAddStrand(track)}
                                                title="Add Strand"
                                            >
                                                <i className="fa fa-plus"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={() => openEditTrack(track)}
                                                title="Edit Track"
                                            >
                                                <i className="fa fa-edit"></i>
                                            </button>
                                            <button
                                                className={`btn btn-sm ${track.isActive ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                                onClick={() => handleToggleTrack(track)}
                                                title={track.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                <i className={`fa ${track.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => openDeleteTrack(track)}
                                                title="Delete Track"
                                            >
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    
                                    {/* Strands List */}
                                    <div className="card-body p-0">
                                        {track.strands.length === 0 ? (
                                            <div className="text-center py-4 text-muted small">
                                                <i className="fa fa-info-circle me-1"></i>
                                                No strands yet. Click <strong>+</strong> to add one.
                                            </div>
                                        ) : (
                                            <ul className="list-group list-group-flush">
                                                {track.strands.map((strand) => (
                                                    <li key={strand._id} className="list-group-item d-flex align-items-center justify-content-between py-2 px-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className={`fa fa-circle ${!strand.isActive ? "text-secondary" : "text-success" }`} style={{ fontSize: '0.5rem' }}></i>
                                                            <span className={`text-capitalize ${!strand.isActive ? 'text-muted text-decoration-line-through' : ''}`}>
                                                                {strand.strandName}
                                                            </span>
                                                            {!strand.isActive && (
                                                                <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>Inactive</span>
                                                            )}
                                                        </div>
                                                        <div className="d-flex gap-1">
                                                            <button
                                                                className="btn btn-sm btn-outline-warning py-0 px-2"
                                                                onClick={() => openEditStrand(track, strand)}
                                                                title="Edit Strand"
                                                            >
                                                                <i className="fa fa-edit" style={{ fontSize: '0.75rem' }}></i>
                                                            </button>
                                                            <button
                                                                className={`btn btn-sm py-0 px-2 ${strand.isActive ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                                                                onClick={() => handleToggleStrand(track, strand)}
                                                                title={strand.isActive ? 'Deactivate' : 'Activate'}
                                                            >
                                                                <i className={`fa ${strand.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} style={{ fontSize: '0.75rem' }}></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                                                onClick={() => openDeleteStrand(track, strand)}
                                                                title="Delete Strand"
                                                            >
                                                                <i className="fa fa-trash" style={{ fontSize: '0.75rem' }}></i>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="card-footer text-muted small">
                                        {track.strands.filter(s => s.isActive).length} active strand(s) of {track.strands.length} total
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CRUD Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{getModalTitle()}</h5>
                                <button type="button" className="btn-close" onClick={closeModal} disabled={submitting}></button>
                            </div>

                            <div className="modal-body">
                                {isDeleteModal ? (
                                    <div className="text-center">
                                        <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                        <h5 className="mb-3">Are you sure?</h5>
                                        <p className="text-muted">
                                            {modalType === 'deleteTrack'
                                                ? <>Do you really want to delete track <strong>{selectedTrack?.trackName}</strong>? All its strands will also be deleted.</>
                                                : <>Do you really want to delete strand <strong>{selectedStrand?.strandName}</strong>?</>
                                            }
                                            <br />This action cannot be undone.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="form-label fw-bold">
                                            {isTrackModal ? 'Track Name' : 'Strand Name'}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={isTrackModal ? 'e.g. Academic' : 'e.g. STEM'}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                                    Cancel
                                </button>
                                <button
                                    className={`btn ${isDeleteModal ? 'btn-danger' : 'btn-danger'}`}
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                                    ) : isDeleteModal ? (
                                        <><i className="fa fa-trash me-2"></i>Yes, Delete</>
                                    ) : modalType.startsWith('add') ? (
                                        <><i className="fa fa-plus me-2"></i>Add</>
                                    ) : (
                                        <><i className="fa fa-save me-2"></i>Update</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999999999 }}>
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

export default Program;