import { useContext, useLayoutEffect, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { globalContext } from "../context/global";
import html2pdf from "html2pdf.js";

const BASE_URL = import.meta.env.VITE_API_URL;






const StudentSectionList = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const navigate = useNavigate();

    const { title, sectionId } = location.state || {};

    useLayoutEffect(() => {
        setTextHeader(location.state?.title || "Section Details");
    }, [location.state?.title]);

    // Section data
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Students table
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Add student
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [adding, setAdding] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Remove student
    const [removingId, setRemovingId] = useState(null);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [selectedRemove, setSelectedRemove] = useState(null);

    // Alert
    const [showAlert, setShowAlert] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [alertType, setAlertType] = useState("success");

    const triggerAlert = (msg, type = "success") => {
        setAlertMsg(msg);
        setAlertType(type);
        setShowAlert(true);
    };

    // Fetch section details
    const fetchSection = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/api/sections/${sectionId}`, {
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSection(data);
            setCurrentPage(1);
        } catch (error) {
            triggerAlert(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sectionId) fetchSection();
    }, [sectionId]);

    // Filter students
    const filtered = (section?.students || []).filter((s) => {
        const fullName = `${s.firstName} ${s.middleName || ""} ${s.lastName}`.toLowerCase();
        const q = searchTerm.toLowerCase();
        return (
            fullName.includes(q) ||
            s.studentNumber?.toLowerCase().includes(q) ||
            s.lrn?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const indexOfFirst = (currentPage - 1) * itemsPerPage;
    const indexOfLast = indexOfFirst + itemsPerPage;
    const currentStudents = filtered.slice(indexOfFirst, indexOfLast);

    useEffect(() => setCurrentPage(1), [searchTerm]);

    // Search student
    const handleSearchStudent = async () => {
        if (!searchQuery.trim()) return;
        try {
            setSearching(true);
            setSearchResult(null);
            setSearchError("");
            const res = await fetch(`${BASE_URL}/api/sections/search-student?query=${searchQuery.trim()}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSearchResult(data);
        } catch (error) {
            setSearchError(error.message);
        } finally {
            setSearching(false);
        }
    };

    // Add student
    const handleAddStudent = async () => {
        if (!searchResult) return;
        try {
            setAdding(true);
            const res = await fetch(`${BASE_URL}/api/sections/${sectionId}/add-student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ studentId: searchResult._id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            triggerAlert(data.message, "success");
            setShowAddModal(false);
            setSearchQuery("");
            setSearchResult(null);
            fetchSection();
        } catch (error) {
            triggerAlert(error.message, "error");
        } finally {
            setAdding(false);
        }
    };

    // Remove student
    const handleRemoveStudent = async () => {
        if (!selectedRemove) return;
        try {
            setRemovingId(selectedRemove._id);
            const res = await fetch(`${BASE_URL}/api/sections/${sectionId}/remove-student/${selectedRemove._id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            triggerAlert(data.message, "success");
            setShowRemoveConfirm(false);
            fetchSection();
        } catch (error) {
            triggerAlert(error.message, "error");
        } finally {
            setRemovingId(null);
        }
    };

    // Status badge
    const getStatusBadge = (status) => {
        const map = {
            enrolled: "success",
            pending: "warning",
            unenrolled: "secondary",
            dropped: "danger",
            graduated: "info"
        };
        return `badge text-bg-${map[status] || "secondary"}`;
    };

    // Print
    const handlePrint = () => {
        const win = window.open("", "", "height=600,width=900");
        win.document.write(`<html><head><title>${section?.name} - Student List</title>`);
        win.document.write(`<style>
            body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; }
            h2 { color: #dc3545; margin-bottom: 4px; }
            p { color: #6c757d; margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #dc3545; color: white; padding: 8px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background: #f8f9fa; }
        </style></head><body>`);
        win.document.write(`<h2>${section?.name}</h2>`);
        win.document.write(`<p>Grade ${section?.gradeLevel} | ${section?.strand} | ${section?.semester === 1 ? "1st" : "2nd"} Semester</p>`);
        win.document.write(`<p>Total Students: <strong>${section?.students?.length || 0}</strong> / ${section?.maxCapacity}</p>`);
        win.document.write(`<p>Date Printed: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>`);
        win.document.write(`<table><thead><tr><th>#</th><th>Student No.</th><th>LRN</th><th>Full Name</th><th>Status</th></tr></thead><tbody>`);
        (section?.students || []).forEach((s, i) => {
            win.document.write(`<tr>
                <td>${i + 1}</td>
                <td>${s.studentNumber}</td>
                <td>${s.lrn}</td>
                <td>${s.lastName}, ${s.firstName} ${s.middleName || ""}</td>
                <td>${s.status}</td>
            </tr>`);
        });
        win.document.write(`</tbody></table></body></html>`);
        win.document.close();
        win.print();
    };

    // PDF
    const handleDownloadPDF = () => {
        const el = document.createElement("div");
        el.innerHTML = `
            <div style="padding:20px;font-family:Arial,sans-serif;">
                <h2 style="color:#dc3545;margin-bottom:4px;">${section?.name}</h2>
                <p style="color:#6c757d;margin:2px 0;">Grade ${section?.gradeLevel} | ${section?.strand} | ${section?.semester === 1 ? "1st" : "2nd"} Semester</p>
                <p style="color:#6c757d;margin:2px 0;">Total Students: <strong>${section?.students?.length || 0}</strong> / ${section?.maxCapacity}</p>
                <p style="color:#6c757d;margin-bottom:16px;">Date Generated: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="background:#dc3545;color:white;">
                            <th style="padding:8px;border:1px solid #ddd;">#</th>
                            <th style="padding:8px;border:1px solid #ddd;">Student No.</th>
                            <th style="padding:8px;border:1px solid #ddd;">LRN</th>
                            <th style="padding:8px;border:1px solid #ddd;">Full Name</th>
                            <th style="padding:8px;border:1px solid #ddd;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(section?.students || []).map((s, i) => `
                            <tr style="${i % 2 === 0 ? "background:#f8f9fa;" : ""}">
                                <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
                                <td style="padding:8px;border:1px solid #ddd;">${s.studentNumber}</td>
                                <td style="padding:8px;border:1px solid #ddd;">${s.lrn}</td>
                                <td style="padding:8px;border:1px solid #ddd;">${s.lastName}, ${s.firstName} ${s.middleName || ""}</td>
                                <td style="padding:8px;border:1px solid #ddd;">${s.status}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>`;
        html2pdf().set({
            margin: 10,
            filename: `${section?.name}_students_${new Date().toISOString().split("T")[0]}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
        }).from(el).save();
    };

    // Pagination — no early return so it always renders (prev/next + page numbers)
    const renderPagination = () => {
        const pages = [];
        const max = 5;
        let start = Math.max(1, currentPage - Math.floor(max / 2));
        let end = Math.min(totalPages, start + max - 1);
        if (end - start + 1 < max) start = Math.max(1, end - max + 1);

        // Prev
        pages.push(
            <li key="prev" className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>
                    <i className="fa fa-chevron-left" />
                </button>
            </li>
        );

        // First page + ellipsis
        if (start > 1) {
            pages.push(
                <li key={1} className="page-item">
                    <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                </li>
            );
            if (start > 2) pages.push(<li key="e1" className="page-item disabled"><span className="page-link">...</span></li>);
        }

        // Page numbers
        for (let i = start; i <= end; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
                </li>
            );
        }

        // Last page + ellipsis
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push(<li key="e2" className="page-item disabled"><span className="page-link">...</span></li>);
            pages.push(
                <li key={totalPages} className="page-item">
                    <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                </li>
            );
        }

        // Next
        pages.push(
            <li key="next" className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>
                    <i className="fa fa-chevron-right" />
                </button>
            </li>
        );

        return pages;
    };

    return (
        <div className="p-4">

            {/* Back button */}
            <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}>
                <i className="fa fa-arrow-left me-2" />Back
            </button>
            
            


            {/* Section Info Card */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col">
                            <div className="mb-3">
                                <h4 className="fw-bold mb-1">{section?.name || "Section Details"}</h4>
                                <p className="text-muted mb-0">List of all students within this section</p>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                <span className="badge bg-danger">{section?.strand}</span>
                                <span className="badge bg-secondary">Grade {section?.gradeLevel}</span>
                                <span className="badge bg-dark">{section?.semester === 1 ? "1st Semester" : "2nd Semester"}</span>
                                <span className={`badge ${section?.isOpenEnrollment ? "bg-success" : "bg-warning text-dark"}`}>
                                    {section?.isOpenEnrollment ? "Open Enrollment" : "Closed Enrollment"}
                                </span>
                            </div>
                        </div>
                        <div className="col-auto text-end">
                            <p className="mb-0 text-muted small">Capacity</p>
                            <p className="fw-bold fs-5 mb-0">
                                {section?.students?.length || 0}
                                <span className="text-muted fw-normal"> / {section?.maxCapacity}</span>
                            </p>
                            {section?.students?.length >= section?.maxCapacity && (
                                <span className="badge bg-warning text-dark">Full</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="row mb-3">
                <div className="col-12 col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white">
                            <i className="fa fa-search text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by name, student no., or LRN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-3 mt-2 mt-md-0 d-flex align-items-center">
                    <p className="text-muted mb-0">
                        Total: <strong>{filtered.length}</strong>
                    </p>
                </div>
                <div className="col-12 col-md-3 mt-2 mt-md-0 d-flex justify-content-start justify-content-md-end gap-2">
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                            setShowAddModal(true);
                            setSearchQuery("");
                            setSearchResult(null);
                            setSearchError("");
                        }}
                    >
                        <i className="fa fa-plus me-2" />Add Student
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={fetchSection}
                        disabled={loading}
                        title="Refresh"
                    >
                        {loading
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="fa fa-refresh" />
                        }
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Student No.</th>
                                    <th>LRN</th>
                                    <th>Full Name</th>
                                    <th>Strand</th>
                                    <th>Status</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="spinner-border text-danger" />
                                            <p className="text-muted mt-2 mb-0">Loading section details...</p>
                                        </td>
                                    </tr>
                                ) : currentStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5 text-muted">
                                            <i className="fa fa-users fa-2x mb-2 d-block" />
                                            No students found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentStudents.map((s, idx) => (
                                        <tr key={s._id}>
                                            <td className="text-muted">{indexOfFirst + idx + 1}</td>
                                            <td className="fw-medium">{s.studentNumber}</td>
                                            <td>{s.lrn}</td>
                                            <td className="text-capitalize">
                                                <div className="d-flex align-items-center gap-2">
                                                    {s.profileImage ? (
                                                        <img src={s.profileImage} alt="profile"
                                                            className="rounded-circle"
                                                            style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center fw-bold"
                                                            style={{ width: "32px", height: "32px", fontSize: "13px" }}>
                                                            {s.firstName?.charAt(0)}
                                                        </div>
                                                    )}
                                                    {s.lastName}, {s.firstName} {s.middleName || ""}
                                                </div>
                                            </td>
                                            <td><span className="badge bg-danger">{s.strand}</span></td>
                                            <td><span className={`text-capitalize ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => {
                                                        setSelectedRemove(s);
                                                        setShowRemoveConfirm(true);
                                                    }}
                                                >
                                                    <i className="fa fa-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination + Print/PDF — always show when there are students */}
                    {!loading && filtered.length > 0 && (
                        <div className="p-3 border-top">
                            <div className="row align-items-center g-2">
                                <div className="col-12 col-md-5">
                                    <p className="text-muted small mb-0">
                                        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} entries
                                    </p>
                                </div>
                                <div className="col-12 col-md-7 d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                    <button className="btn btn-outline-primary btn-sm" onClick={handlePrint}>
                                        <i className="fa fa-print me-1" />Print
                                    </button>
                                    <button className="btn btn-outline-danger btn-sm" onClick={handleDownloadPDF}>
                                        <i className="fa fa-file-pdf me-1" />PDF
                                    </button>
                                    {/* Pagination always visible when students exist */}
                                    <nav>
                                        <ul className="pagination mb-0">{renderPagination()}</ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">Add Student</h5>
                                    <p className="text-muted small mb-0">Search by Student No. or LRN</p>
                                </div>
                                <button className="btn-close" onClick={() => setShowAddModal(false)} />
                            </div>
                            <div className="modal-body pt-0">
                                <div className="input-group mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Student No. or LRN..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearchStudent()}
                                    />
                                    <button className="btn btn-danger" onClick={handleSearchStudent} disabled={searching}>
                                        {searching
                                            ? <span className="spinner-border spinner-border-sm" />
                                            : <i className="fa fa-search" />
                                        }
                                    </button>
                                </div>

                                {searchError && (
                                    <div className="alert alert-danger py-2 small">{searchError}</div>
                                )}

                                {searchResult && (
                                    <div className="card border rounded-3 p-3">
                                        <div className="d-flex align-items-center gap-3">
                                            {searchResult.profileImage ? (
                                                <img src={searchResult.profileImage} alt="profile"
                                                    className="rounded-circle"
                                                    style={{ width: "48px", height: "48px", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center fw-bold fs-5"
                                                    style={{ width: "48px", height: "48px" }}>
                                                    {searchResult.firstName?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="fw-bold mb-0 text-capitalize">
                                                    {searchResult.lastName}, {searchResult.firstName} {searchResult.middleName || ""}
                                                </p>
                                                <p className="text-muted small mb-0">
                                                    {searchResult.studentNumber} &bull; {searchResult.lrn}
                                                </p>
                                                <p className="text-muted small mb-0">
                                                    Grade {searchResult.gradeLevel} | {searchResult.strand} | {searchResult.section || "No Section"}
                                                </p>
                                                <span className={getStatusBadge(searchResult.status)}>
                                                    {searchResult.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleAddStudent} disabled={!searchResult || adding}>
                                    {adding
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
                                        : <><i className="fa fa-plus me-2" />Add to Section</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Confirm Modal */}
            {showRemoveConfirm && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">Remove Student?</h5>
                                <button className="btn-close" onClick={() => setShowRemoveConfirm(false)} />
                            </div>
                            <div className="modal-body pt-0">
                                <p className="text-muted">
                                    Are you sure you want to unenroll{" "}
                                    <strong className="text-dark text-capitalize">
                                        {selectedRemove?.firstName} {selectedRemove?.lastName}
                                    </strong>{" "}
                                    from <strong className="text-dark">{section?.name}</strong>?
                                </p>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={() => setShowRemoveConfirm(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleRemoveStudent} disabled={!!removingId}>
                                    {removingId
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Removing...</>
                                        : <><i className="fa fa-trash me-2" />Yes, Unenroll</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {showAlert && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className={`mb-3 ${alertType === "success" ? "text-success" : "text-danger"}`}>
                                    <i className={`fa ${alertType === "success" ? "fa-check-circle" : "fa-times-circle"} fa-3x`} />
                                </div>
                                <h5 className="fw-bold mb-2">{alertType === "success" ? "Success!" : "Error!"}</h5>
                                <p className="text-muted mb-4">{alertMsg}</p>
                                <button
                                    className={`btn ${alertType === "success" ? "btn-success" : "btn-danger"} px-4`}
                                    onClick={() => setShowAlert(false)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentSectionList;