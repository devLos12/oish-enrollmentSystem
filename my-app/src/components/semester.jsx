import { useLayoutEffect, useContext, useState, useEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";

const BASE_URL = import.meta.env.VITE_API_URL;

const Semester = () => {
    const { setTextHeader, getSY } = useContext(globalContext);
    const location = useLocation();

    const [semesters, setSemesters] = useState([]);
    const [filteredSemesters, setFilteredSemesters] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingId, setPendingId] = useState(null);
    const [pendingLabel, setPendingLabel] = useState("");
    const [form, setForm] = useState({ startYear: "", endYear: "", semester: 1 });

    // Search & Filter
    const [searchYear, setSearchYear] = useState("");
    const [filterSemester, setFilterSemester] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);




    const [showConfirmCurrent, setShowConfirmCurrent] = useState(false);
    const [pendingCurrentId, setPendingCurrentId] = useState(null);
    const [pendingCurrentLabel, setPendingCurrentLabel] = useState("");


    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [pendingDeleteLabel, setPendingDeleteLabel] = useState("");




    useLayoutEffect(() => {
        setTextHeader(location.state?.title);
    }, [location.state?.title]);


    const handleDeleteSemester = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/api/delete-school-year/${pendingDeleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error deleting semester");
            setShowConfirmDelete(false);
            setPendingDeleteId(null);
            fetchSemesters();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
   


    const handleSetCurrent = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/api/set-current-school-year/${pendingCurrentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) { 
                alert(data.message || "Error setting current semester"); 
                return; 
            }
            setShowConfirmCurrent(false);
            setPendingCurrentId(null);
            fetchSemesters();
            getSY();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };





    const fetchSemesters = async () => {
        try {
            setFetching(true);
            const res = await fetch(`${BASE_URL}/api/get-school-years`);
            const data = await res.json();
            const reversed = [...data].reverse();
            setSemesters(reversed);
            setFilteredSemesters(reversed);
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
    }, []);

    // Filter logic
    useEffect(() => {
        let filtered = [...semesters];

        if (searchYear) {
            filtered = filtered.filter(s =>
                s.schoolYear.toLowerCase().includes(searchYear.toLowerCase())
            );
        }

        if (filterSemester) {
            filtered = filtered.filter(s => s.semester === parseInt(filterSemester));
        }

        if (filterStatus) {
            filtered = filtered.filter(s =>
                filterStatus === "active" ? s.isActive : !s.isActive
            );
        }

        setFilteredSemesters(filtered);
        setCurrentPage(1);
    }, [searchYear, filterSemester, filterStatus, semesters]);

    // Pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentSemesters = filteredSemesters.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredSemesters.length / itemsPerPage);

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
            pages.push(<li key={1} className="page-item"><button className="page-link" onClick={() => handlePageChange(1)}>1</button></li>);
            if (start > 2) pages.push(<li key="e1" className="page-item disabled"><span className="page-link">...</span></li>);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
                </li>
            );
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push(<li key="e2" className="page-item disabled"><span className="page-link">...</span></li>);
            pages.push(<li key={totalPages} className="page-item"><button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button></li>);
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

    const handleCreate = async () => {
        try {
            if (!form.startYear || !form.endYear) return;
            if (parseInt(form.endYear) !== parseInt(form.startYear) + 1) {
                alert("End year must be start year + 1");
                return;
            }
            setLoading(true);
            const schoolYear = `${form.startYear}-${form.endYear}`;
            const res = await fetch(`${BASE_URL}/api/create-school-year`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schoolYear, semester: parseInt(form.semester) }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message || "Error creating semester"); return; }
            setShowModal(false);
            setForm({ startYear: "", endYear: "", semester: 1 });
            fetchSemesters();
            getSY();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/api/update-school-year/${pendingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message || "Error switching semester"); return; }
            setShowConfirm(false);
            setPendingId(null);
            fetchSemesters();
            getSY();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open("", "", "height=600,width=800");
        printWindow.document.write("<html><head><title>Semester List</title>");
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-family: Arial, sans-serif; padding: 20px; }");
        printWindow.document.write("h2 { text-align: center; color: #dc3545; margin-bottom: 10px; }");
        printWindow.document.write("h3 { text-align: center; color: #6c757d; margin-bottom: 20px; }");
        printWindow.document.write("table { width: 100%; border-collapse: collapse; font-size: 12px; }");
        printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
        printWindow.document.write("th { background-color: #dc3545; color: white; }");
        printWindow.document.write("tr:nth-child(even) { background-color: #f8f9fa; }");
        printWindow.document.write(".badge { padding: 3px 6px; border-radius: 3px; font-size: 11px; color: white; }");
        printWindow.document.write("</style></head><body>");
        printWindow.document.write("<h2>Semester Management</h2>");
        printWindow.document.write("<h3>Semester List Report</h3>");
        printWindow.document.write(`<p><strong>Date Generated:</strong> ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })}<br>`);
        printWindow.document.write(`<strong>Total Semesters:</strong> ${filteredSemesters.length}</p>`);
        printWindow.document.write("<table><thead><tr><th>#</th><th>School Year</th><th>Semester</th><th>Status</th><th>Created At</th></tr></thead><tbody>");

        filteredSemesters.forEach((s, i) => {
            const { date, time } = formatDateTime(s.createdAt);
            printWindow.document.write(`<tr>
                <td>${i + 1}</td>
                <td>${s.schoolYear}</td>
                <td>${s.semester === 1 ? "1st Semester" : "2nd Semester"}</td>
                <td><span class="badge" style="background-color: ${s.isActive ? "#198754" : "#ffc107"}; color: ${s.isActive ? "white" : "black"}">${s.isActive ? "Active Now" : "Archived"}</span></td>
                <td>${date}<br><small>${time}</small></td>
            </tr>`);
        });

        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadPDF = () => {
        const element = document.createElement("div");
        element.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; color: #dc3545; margin-bottom: 10px;">Semester Management</h2>
                <h3 style="text-align: center; color: #6c757d; margin-bottom: 20px;">Semester List Report</h3>
                <p>
                    <strong>Date Generated:</strong> ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })}<br>
                    <strong>Total Semesters:</strong> ${filteredSemesters.length}
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #dc3545; color: white;">
                            <th style="border: 1px solid #ddd; padding: 8px;">#</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">School Year</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Semester</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSemesters.map((s, i) => {
                            const { date, time } = formatDateTime(s.createdAt);
                            return `<tr style="${i % 2 === 0 ? "background-color: #f8f9fa;" : ""}">
                                <td style="border: 1px solid #ddd; padding: 8px;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${s.schoolYear}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${s.semester === 1 ? "1st Semester" : "2nd Semester"}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                    <span style="padding: 3px 6px; border-radius: 3px; font-size: 11px; background-color: ${s.isActive ? "#198754" : "#ffc107"}; color: ${s.isActive ? "white" : "black"};">
                                        ${s.isActive ? "Active Now" : "Archived"}
                                    </span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${date}<br><small>${time}</small></td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;

        html2pdf().set({
            margin: 10,
            filename: `semester_list_${new Date().toISOString().split("T")[0]}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        }).from(element).save();
    };








    return (
        <div className="p-4">

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 col-md-6 ">
                    <p className="text-capitalize fs-4 fw-bold m-0">semester management</p>
                    <p className="text-muted mb-0">Create and switch active semester</p>
                </div>
                <div className="col-12 col-md-6 d-flex gap-2 align-items-center justify-content-start justify-content-md-end
                 mt-2 mt-md-0">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={fetchSemesters}
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
                        + Create semester
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
                            placeholder="Search school year..."
                            value={searchYear}
                            onChange={(e) => setSearchYear(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-2">
                    <select
                        className="form-select"
                        value={filterSemester}
                        onChange={(e) => setFilterSemester(e.target.value)}
                    >
                        <option value="">All Semesters</option>
                        <option value="1">First Semester</option>
                        <option value="2">Second Semester</option>
                    </select>
                </div>
                <div className="col-12 col-md-2">
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div className="col-12 col-md-4 d-flex justify-content-md-end align-items-center">
                    <p className="text-muted mb-0">
                        Total: <strong>{filteredSemesters.length}</strong>
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
                                    <th>School year</th>
                                    <th>Semester</th>
                                    <th>Status</th>
                                    <th>Created at</th>
                                    <th className="text-center">Action</th>

                                </tr>
                            </thead>
                            <tbody>
                                {fetching ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <div className="spinner-border text-danger mb-2" />
                                            <p className="text-muted mb-0">Loading semesters...</p>
                                        </td>
                                    </tr>
                                ) : currentSemesters.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5 text-muted">
                                            No semesters found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentSemesters.map((s, index) => {
                                        const { date, time } = formatDateTime(s.createdAt);
                                        return (
                                            <tr key={s._id} className={s.isActive ? "table-secondary" : ""}>
                                                <td className="text-muted">{indexOfFirst + index + 1}</td>
                                                <td className="fw-medium">{s.schoolYear}</td>
                                                <td>{s.semester === 1 ? "First" : "Second"}</td>
                                                <td>
                                                    <span className={`badge  ${s.isActive ? "text-bg-success" : "text-bg-warning"}`}>
                                                        {s.isActive ? "Active " : "Archived"}
                                                    </span>
                                                </td>

                                                <td className="text-muted">
                                                    <div>{date}</div>
                                                    <small className="text-muted">{time}</small>
                                                </td>
                                            
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                                        
                                                        {/* Toggle switch para sa isActive */}
                                                        <div className="form-check form-switch d-flex justify-content-center m-0">
                                                            <input
                                                                className="form-check-input "
                                                                type="checkbox"
                                                                role="switch"
                                                                checked={s.isActive}
                                                                onChange={() => {
                                                                    if (!s.isActive) {
                                                                        setPendingId(s._id);
                                                                        setPendingLabel(s.label);
                                                                        setShowConfirm(true);
                                                                    }
                                                                }}
                                                                style={{
                                                                    cursor: s.isActive ? 'default' : 'pointer',
                                                                    width: '2.5em',
                                                                    height: '1.3em',
                                                                    backgroundColor: s.isActive ? '#198754' : '',
                                                                    borderColor: s.isActive ? '#198754' : '',
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Set Current button — same logic */}
                                                        {s.isCurrent 
                                                            ? <button disabled className="btn btn-sm btn-dark" style={{ width: "90px" }}>Current</button>
                                                            : <button className="btn btn-sm btn-outline-dark" style={{ width: "90px" }}
                                                                onClick={() => { setPendingCurrentId(s._id); setPendingCurrentLabel(s.label); setShowConfirmCurrent(true); }}>
                                                                Set current
                                                            </button>
                                                        }



                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => {
                                                                setPendingDeleteId(s._id);
                                                                setPendingDeleteLabel(s.label);
                                                                setShowConfirmDelete(true);
                                                            }}
                                                        >
                                                            <i className="fa fa-trash small" />
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

                    {/* Pagination + Print/PDF */}
                    {totalPages > 0 && (
                        <div className="p-3 border-top">
                            <div className="row align-items-center g-2">
                                <div className="col-12 col-md-6">
                                    <p className="text-muted small mb-0 text-center text-md-start">
                                        Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredSemesters.length)} of {filteredSemesters.length} entries
                                    </p>
                                </div>
                                <div className="col-12 col-md-6 d-flex justify-content-end gap-3 flex-column flex-md-row mt-2 mt-md-0">
                                    <div className="d-flex justify-content-center gap-2">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={handlePrint}
                                        >
                                            <i className="fa fa-print me-1" />Print
                                        </button>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={handleDownloadPDF}
                                        >
                                            <i className="fa fa-file-pdf me-1" />PDF
                                        </button>
                                    </div>
                                    <nav className="d-flex justify-content-md-end justify-content-center">
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

            {/* Create Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <div>
                                    <h5 className="modal-title">Create new semester</h5>
                                    <p className="text-muted mb-0">This will be added to the semester list</p>
                                </div>
                                <button className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <div className="modal-body pt-0">
                                <div className="mb-3">
                                    <label className="form-label text-muted">School year</label>
                                    <div className="row g-2">
                                        <div className="col">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="2027"
                                                value={form.startYear}
                                                onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                                            />
                                        </div>
                                        <div className="col">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="2028"
                                                value={form.endYear}
                                                onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label text-muted">Semester</label>
                                    <select
                                        className="form-select"
                                        value={form.semester}
                                        onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                    >
                                        <option value={1}>1st semester</option>
                                        <option value={2}>2nd semester</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-dark" onClick={handleCreate} disabled={loading}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Switch Modal */}
            {showConfirm && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">Switch active semester?</h5>
                                <button className="btn-close" onClick={() => setShowConfirm(false)} />
                            </div>
                            <div className="modal-body pt-0">
                                <p className="text-muted mb-0">
                                    Switching to{" "}
                                    <span className="fw-medium text-dark">"{pendingLabel}"</span>
                                    {" "}— all pages will show data for this semester.
                                </p>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
                                <button className="btn btn-dark" onClick={handleActivate} disabled={loading}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Switching...</> : "Yes, switch"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {showConfirmCurrent && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">Set as current semester?</h5>
                                <button className="btn-close" onClick={() => setShowConfirmCurrent(false)} />
                            </div>
                            <div className="modal-body pt-0">
                                <p className="text-muted mb-2">
                                    Setting{" "}
                                    <span className="fw-medium text-dark">"{pendingCurrentLabel}"</span>
                                    {" "}as the current semester. This will:
                                </p>
                                <ul className="text-muted small mb-0">
                                    <li>Create new sections for the incoming semester</li>
                                    <li>Promote G11 students to G12 (if new school year)</li>
                                    <li>Mark G12 students as graduated (if new school year)</li>
                                </ul>
                                <p className="text-danger small mt-2 mb-0">
                                    <i className="fa fa-triangle-exclamation me-1" />
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-dark" onClick={() => setShowConfirmCurrent(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-dark" onClick={handleSetCurrent} disabled={loading}>
                                {loading 
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> 
                                    : "Yes, set current"
                                }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {showConfirmDelete && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 rounded-4">
                        <div className="modal-header border-0">
                            <h5 className="modal-title text-danger">
                                <i className="fa fa-triangle-exclamation me-2" />
                                Delete semester?
                            </h5>
                            <button className="btn-close" onClick={() => setShowConfirmDelete(false)} />
                        </div>
                        <div className="modal-body pt-0">
                            <p className="text-muted mb-0">
                                You are about to delete{" "}
                                <span className="fw-medium text-dark">"{pendingDeleteLabel}"</span>.
                                This cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer border-0">
                            <button className="btn btn-outline-secondary" onClick={() => setShowConfirmDelete(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteSemester} disabled={loading}>
                                {loading
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</>
                                    : "Yes, delete"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}




        </div>
    );
};

export default Semester;