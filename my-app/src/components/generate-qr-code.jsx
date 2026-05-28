import { useContext } from "react";
import { useState, useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";

const GenerateQRCode = () => {
    const { setTextHeader} = useContext(globalContext);
    const [targetUrl, setTargetUrl] = useState("");
    const [qrList, setQrList] = useState([]);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editUrl, setEditUrl] = useState("");
    const [editError, setEditError] = useState("");
    const [editLoading, setEditLoading] = useState(false);




    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");



    // View
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewQr, setViewQr] = useState(null);


    // Search & Filter
    const [searchUrl, setSearchUrl] = useState("");
    const [filteredList, setFilteredList] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const location = useLocation();






    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    },[location?.state?.title]);



    const getDownloadUrl = (url) => {
        return url.replace('/upload/', '/upload/fl_attachment/');
    };



    const fetchQRCodes = async () => {
        try {
            setFetching(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/qr-codes`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            if (data.success) {
                const reversed = [...data.data].reverse();
                setQrList(reversed);
                setFilteredList(reversed);
            }
        } catch (error) {
            console.error("Error:", error.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchQRCodes();
    }, []);

    // Filter logic
    useEffect(() => {
        let filtered = [...qrList];
        if (searchUrl) {
            filtered = filtered.filter((qr) =>
                qr.targetUrl.toLowerCase().includes(searchUrl.toLowerCase())
            );
        }
        setFilteredList(filtered);
        setCurrentPage(1);
    }, [searchUrl, qrList]);

    // Pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    const handlePageChange = (page) => setCurrentPage(page);

    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

        pages.push(
            <li key="prev" className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                    <i className="fa fa-chevron-left" />
                </button>
            </li>
        );

        if (start > 1) {
            pages.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                </li>
            );
            if (start > 2)
                pages.push(
                    <li key="e1" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
                </li>
            );
        }

        if (end < totalPages) {
            if (end < totalPages - 1)
                pages.push(
                    <li key="e2" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            pages.push(
                <li key={totalPages} className="page-item">
                    <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                </li>
            );
        }

        pages.push(
            <li key="next" className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                    <i className="fa fa-chevron-right" />
                </button>
            </li>
        );

        return pages;
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Asia/Manila",
            }),
            time: date.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
            }),
        };
    };

    const generateCode = async () => {
        try {
            setLoading(true);
            setError("");
            setQrData(null);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-qr-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUrl }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.success) {
                setQrData(data.data);
                fetchQRCodes();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setTargetUrl("");
        setQrData(null);
        setError("");
    };

    const handleOpenEdit = (qr) => {
        setEditId(qr._id);
        setEditUrl(qr.targetUrl);
        setEditError("");
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditId(null);
        setEditUrl("");
        setEditError("");
    };




    const handleOpenView = (qr) => {
        setViewQr(qr);
        setShowViewModal(true);
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewQr(null);
    };







    const handleOpenDelete = (qr) => {
        setDeleteId(qr._id);
        setDeleteError("");
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteId(null);
        setDeleteError("");
    };

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            setDeleteError("");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/qr-codes/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error deleting QR code");
            handleCloseDeleteModal();
            fetchQRCodes();
        } catch (error) {
            setDeleteError(error.message);
        } finally {
            setDeleteLoading(false);
        }
    };










    const handleEdit = async () => {
        try {
            if (!editUrl) return;
            setEditLoading(true);
            setEditError("");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/qr-codes/${editId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUrl: editUrl }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error updating QR code");
            handleCloseEditModal();
            fetchQRCodes();
        } catch (error) {
            setEditError(error.message);
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="p-4">

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 col-md-6">
                    <p className="text-capitalize fs-4 fw-bold m-0">QR Code Management</p>
                    <p className="text-muted mb-0">Generate and manage QR codes</p>
                </div>
                <div className="col-12 col-md-6 d-flex gap-2 align-items-center justify-content-start justify-content-md-end mt-2 mt-md-0">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={fetchQRCodes}
                        disabled={fetching}
                        title="Refresh"
                    >
                        {fetching
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="fa fa-sync-alt" />
                        }
                    </button>
                    <button
                        className="btn btn-outline-dark"
                        onClick={() => setShowModal(true)}
                    >
                        + Generate QR Code
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="row mb-3 g-2">
                <div className="col-12 col-md-4">
                    <div className="input-group">
                        <span className="input-group-text bg-white">
                            <i className="fa fa-search text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search target URL..."
                            value={searchUrl}
                            onChange={(e) => setSearchUrl(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-8 d-flex justify-content-md-end align-items-center">
                    <p className="text-muted mb-0">
                        Total: <strong>{filteredList.length}</strong>
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>QR Code</th>
                                    <th>Target URL</th>
                                    <th>Created At</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetching ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="spinner-border text-danger mb-2" />
                                            <p className="text-muted mb-0">Loading QR codes...</p>
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            No QR codes found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((qr, index) => {
                                        const { date, time } = formatDateTime(qr.createdAt);
                                        return (
                                            <tr key={qr._id}>
                                                <td className="text-muted">{indexOfFirst + index + 1}</td>
                                                <td>
                                                    <img
                                                        src={qr.cloudinaryUrl}
                                                        alt="QR Code"
                                                        style={{ width: "50px", height: "50px", borderRadius: "4px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <a
                                                        href={qr.targetUrl.startsWith("http://") || qr.targetUrl.startsWith("https://") ? qr.targetUrl : `https://${qr.targetUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-truncate d-inline-block"
                                                        style={{ maxWidth: "300px" }}
                                                    >
                                                        {qr.targetUrl}
                                                    </a>
                                                </td>
                                                <td className="text-muted">
                                                    <div>{date}</div>
                                                    <small className="text-muted">{time}</small>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                             
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleOpenView(qr)}
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-outline-warning"
                                                            onClick={() => handleOpenEdit(qr)}
                                                        >
                                                            <i className="fa fa-edit" />
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleOpenDelete(qr)}
                                                        >
                                                            <i className="fa fa-trash" />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="p-3 border-top">
                            <div className="row align-items-center g-2">
                                <div className="col-12 col-md-6">
                                    <p className="text-muted small mb-0 text-center text-md-start">
                                        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredList.length)} of {filteredList.length} entries
                                    </p>
                                </div>
                                <div className="col-12 col-md-6 d-flex justify-content-md-end justify-content-center">
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {renderPagination()}
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">Generate QR Code</h5>
                                    <p className="text-muted mb-0">Enter a URL to generate a QR code</p>
                                </div>
                                <button className="btn-close" onClick={handleCloseModal} />
                            </div>
                            <div className="modal-body pt-0">
                                {!qrData ? (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label text-muted">Target URL</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="https://yourschool.com"
                                                value={targetUrl}
                                                onChange={(e) => setTargetUrl(e.target.value)}
                                            />
                                        </div>
                                        {error && (
                                            <div className="alert alert-danger py-2 small">{error}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <img
                                            src={qrData.cloudinaryUrl}
                                            alt="QR Code"
                                            style={{ width: "180px", height: "180px", borderRadius: "8px" }}
                                            className="mb-3"
                                        />
                                        <p className="text-muted small mb-0">{qrData.targetUrl}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                {!qrData ? (
                                    <button
                                        className="btn btn-dark"
                                        onClick={generateCode}
                                        disabled={loading || !targetUrl}
                                    >
                                        {loading ? (
                                            <><span className="spinner-border spinner-border-sm me-2" />Generating...</>
                                        ) : (
                                            "Generate"
                                        )}
                                    </button>
                                ) : (
                                    <a
                                        href={getDownloadUrl(qrData.cloudinaryUrl)}
                                        download="qrcode.png"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-dark"
                                    >
                                        <i className="fa fa-download me-1" />Download PNG
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">Edit QR Code</h5>
                                    <p className="text-muted mb-0">Update the target URL for this QR code</p>
                                </div>
                                <button className="btn-close" onClick={handleCloseEditModal} />
                            </div>
                            <div className="modal-body pt-0">
                                <div className="mb-3">
                                    <label className="form-label text-muted">Target URL</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="https://yourschool.com"
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                    />
                                </div>
                                {editError && (
                                    <div className="alert alert-danger py-2 small">{editError}</div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={handleCloseEditModal}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-dark"
                                    onClick={handleEdit}
                                    disabled={editLoading || !editUrl}
                                >
                                    {editLoading
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                                        : "Save changes"
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
                
    
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">Delete QR Code</h5>
                                    <p className="text-muted mb-0">This action cannot be undone</p>
                                </div>
                                <button className="btn-close" onClick={handleCloseDeleteModal} />
                            </div>
                            <div className="modal-body pt-0">
                                <p className="text-muted mb-0">
                                    Are you sure you want to delete this QR code?
                                </p>
                                {deleteError && (
                                    <div className="alert alert-danger py-2 small mt-3 mb-0">{deleteError}</div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={handleCloseDeleteModal}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</>
                                        : "Delete"
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
            {/* View Modal */}
            {showViewModal && viewQr && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">QR Code</h5>
                                    <p className="text-muted mb-0">Scan or download this QR code</p>
                                </div>
                                <button className="btn-close" onClick={handleCloseViewModal} />
                            </div>
                            <div className="modal-body pt-0">
                                <div className="text-center py-2">
                                    <img
                                        src={viewQr.cloudinaryUrl}
                                        alt="QR Code"
                                        style={{ width: "180px", height: "180px", borderRadius: "8px" }}
                                        className="mb-3"
                                    />
                                    <p className="text-muted small mb-0">{viewQr.targetUrl}</p>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={handleCloseViewModal}>
                                    Close
                                </button>
                                <a
                                    href={getDownloadUrl(viewQr.cloudinaryUrl)}
                                    download="qrcode.png"
                                    className="btn btn-dark"
                                >
                                    <i className="fa fa-download me-1" />Download PNG
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default GenerateQRCode;