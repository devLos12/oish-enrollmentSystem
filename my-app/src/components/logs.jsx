import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";

const Logs = () => {
  const { setTextHeader } = useContext(globalContext);
  const location = useLocation();

  useLayoutEffect(() => {
    setTextHeader(location?.state?.title || "Activity Logs");
  }, [location?.state?.title]);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const roleOptions = ["admin", "staff"];
  const actionOptions = [...new Set(logs.map((log) => log.action).filter(Boolean))];

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchLogsData();
  }, []);

  const fetchLogsData = async () => {
      try {
          setLoading(true);
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getLogs`, {
              method: "GET",
              credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to fetch logs");
          
          // ✅ Ensure laging array — kahit empty message ang return ng API
          setLogs(Array.isArray(data) ? data.reverse() : []);


      } catch (error) {
          console.error("Error fetching logs:", error.message || error);
          setLogs([]); // ✅ Failsafe
      } finally {
          setLoading(false);
      }
  };

  const parseLogDate = (dateString) => {
    if (!dateString) return null;
    const [month, day, year] = dateString.split('-');
    return new Date(year, month - 1, day);
  };

  const formatReadableDate = (dateString) => {
    if (!dateString) return '';
    const date = parseLogDate(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const filtered = logs
    .filter((log) => {
      const name = log.participantName?.toLowerCase() || '';
      const desc = log.description?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || desc.includes(search);
    })
    .filter((log) => (filterRole ? log.role === filterRole : true))
    .filter((log) => (filterAction ? log.action === filterAction : true))
    .filter((log) => {
      if (!filterDate) return true;
      const logDate = parseLogDate(log.Date);
      const selectedDate = new Date(filterDate);
      if (!logDate) return false;
      return logDate.toDateString() === selectedDate.toDateString();
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterAction, filterDate]);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <i className="fa fa-chevron-left"></i>
        </button>
      </li>
    );
    if (startPage > 1) {
      pages.push(<li key={1} className="page-item"><button className="page-link" onClick={() => handlePageChange(1)}>1</button></li>);
      if (startPage > 2) pages.push(<li key="e1" className="page-item disabled"><span className="page-link">...</span></li>);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push(<li key="e2" className="page-item disabled"><span className="page-link">...</span></li>);
      pages.push(<li key={totalPages} className="page-item"><button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button></li>);
    }
    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <i className="fa fa-chevron-right"></i>
        </button>
      </li>
    );
    return pages;
  };


  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Success':    return 'text-success bg-success';
      case 'Failed':     return 'text-danger bg-danger';
      case 'Logged Out': return 'text-secondary bg-secondary';
      default:           return 'text-secondary bg-secondary';
    }
  };



  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN':        return 'text-bg-success';
      case 'LOGIN FAILED': return 'text-bg-danger';
      case 'LOGOUT':       return 'text-bg-secondary';
      default:             return 'text-bg-secondary';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'text-info bg-opacity-10 bg-info';
      case 'staff': return 'text-primary bg-opacity-10 bg-primary';
      default:      return 'text-secondary bg-opacity-10 bg-secondary';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=1000');
    printWindow.document.write('<html><head><title>Activity Logs</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h2 { text-align: center; color: #dc3545; margin-bottom: 4px; }');
    printWindow.document.write('h3 { text-align: center; color: #6c757d; margin-bottom: 16px; font-size: 13px; font-weight: normal; }');
    printWindow.document.write('p { font-size: 12px; margin-bottom: 16px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; font-size: 11px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 7px; text-align: left; }');
    printWindow.document.write('th { background-color: #dc3545; color: white; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #f8f9fa; }');
    printWindow.document.write('.badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; color: white; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2>Activity Logs</h2>');
    printWindow.document.write('<h3>User Login & Logout Report</h3>');
    printWindow.document.write(`<p><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}&nbsp;&nbsp;<strong>Total Records:</strong> ${filtered.length}</p>`);
    printWindow.document.write('<table><thead><tr>');
    printWindow.document.write('<th>#</th><th>Name</th><th>Role</th><th>Action</th><th>Description</th><th>Date & Time</th>');
    printWindow.document.write('</tr></thead><tbody>');

    filtered.forEach((log, index) => {
      const actionColor = log.action === 'LOGIN' ? '#198754' : log.action === 'LOGIN FAILED' ? '#dc3545' : '#6c757d';
      const roleColor   = log.role === 'admin' ? '#dc3545' : '#0d6efd';
      printWindow.document.write(`<tr>
        <td>${index + 1}</td>
        <td style="font-weight:600;text-transform:capitalize">${log.participantName}</td>
        <td><span class="badge" style="background-color:${roleColor}">${log.role === 'staff' ? 'Teacher' : 'Admin'}</span></td>
        <td><span class="badge" style="background-color:${actionColor}">${log.action}</span></td>
        <td>${log.description || '—'}</td>
        <td>${formatReadableDate(log.Date)}, ${log.time}</td>
      </tr>`);
    });

    printWindow.document.write('</tbody></table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding:20px;font-family:Arial,sans-serif;">
        <h2 style="text-align:center;color:#dc3545;margin-bottom:4px;">Activity Logs</h2>
        <h3 style="text-align:center;color:#6c757d;margin-bottom:16px;font-size:13px;font-weight:normal;">User Login & Logout Report</h3>
        <p style="font-size:12px;margin-bottom:16px;">
          <strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}
          &nbsp;&nbsp;<strong>Total Records:</strong> ${filtered.length}
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <thead>
            <tr style="background-color:#dc3545;color:white;">
              <th style="border:1px solid #ddd;padding:6px;">#</th>
              <th style="border:1px solid #ddd;padding:6px;">Name</th>
              <th style="border:1px solid #ddd;padding:6px;">Role</th>
              <th style="border:1px solid #ddd;padding:6px;">Action</th>
              <th style="border:1px solid #ddd;padding:6px;">Description</th>
              <th style="border:1px solid #ddd;padding:6px;">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((log, index) => {
              const actionColor = log.action === 'LOGIN' ? '#198754' : log.action === 'LOGIN FAILED' ? '#dc3545' : '#6c757d';
              const roleColor   = log.role === 'admin' ? '#dc3545' : '#0d6efd';
              return `
                <tr style="${index % 2 === 0 ? 'background-color:#f8f9fa;' : ''}">
                  <td style="border:1px solid #ddd;padding:6px;">${index + 1}</td>
                  <td style="border:1px solid #ddd;padding:6px;font-weight:600;text-transform:capitalize;">${log.participantName}</td>
                  <td style="border:1px solid #ddd;padding:6px;">
                    <span style="padding:2px 6px;border-radius:3px;font-size:9px;background-color:${roleColor};color:white;">
                      ${log.role === 'staff' ? 'Teacher' : 'Admin'}
                    </span>
                  </td>
                  <td style="border:1px solid #ddd;padding:6px;">
                    <span style="padding:2px 6px;border-radius:3px;font-size:9px;background-color:${actionColor};color:white;">
                      ${log.action}
                    </span>
                  </td>
                  <td style="border:1px solid #ddd;padding:6px;">${log.description || '—'}</td>
                  <td style="border:1px solid #ddd;padding:6px;">${formatReadableDate(log.Date)}, ${log.time}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    html2pdf().set({
      margin: 10,
      filename: `activity_logs_${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(element).save();
  };

  return (
    <>
      <div className="container-fluid py-4 g-0 g-md-5">

        {/* Header */}
        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="text-capitalize fw-bold mb-1">activity logs</h4>
              <p className="text-muted small mb-0">View all activities .</p>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogsData} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fa fa-refresh"></i>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3 g-2">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="fa fa-search text-muted"></i></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r === 'staff' ? 'Teacher' : 'Admin'}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="fa fa-calendar text-muted"></i></span>
              <input
                type="date"
                className="form-control border-start-0"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                max={getTodayDate()}
              />
              {filterDate && (
                <button className="btn btn-outline-secondary" onClick={() => setFilterDate("")} title="Clear date">
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-1 d-flex align-items-center justify-content-md-end">
            <p className="text-muted mb-0 small">Total: <strong>{filtered.length}</strong></p>
          </div>
        </div>

        {filterDate && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info py-2 mb-0 small">
                <i className="fa fa-calendar me-2"></i>
                Showing logs for: <strong>{new Date(filterDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <p className="text-muted mt-2">Loading logs...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fa fa-file-text fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No logs found</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Action</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLogs?.map((log, idx) => (
                            <tr key={log._id}>
                              <td className="text-muted">{indexOfFirstItem + idx + 1}</td>
                              <td className="fw-semibold text-capitalize">{log.participantName}</td>
                              <td>
                                <span className={`badge bg-opacity-10 ${getRoleBadgeClass(log.role)}`}>
                                  {log.role === 'staff' ? 'Teacher' : 'Admin'}
                                </span>
                              </td>
                              <td>
                                <span className={'text-muted small fw-medium'}>
                                  {log.action || '—'}
                                </span>
                              </td>
                              <td className="text-muted small "
                              style={{ maxWidth: "320px"}}
                              >{log.description || '—'}</td>

                              <td>
                                <span className={`badge d-flex gap-1 align-items-center bg-opacity-10 ${getStatusBadgeClass(log?.status)}`}>
                                  <i className={`fa-solid small ${log.status === 'Success' ? "fa-check text-success" : "fa-x text-danger"}`}></i>
                                  {log?.status || '—'}
                                </span>
                              </td>

                              <td className="text-muted small">
                                <div>{formatReadableDate(log.Date)}</div>
                                <small>{log.time}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 0 && (
                      <div className="p-3 border-top">
                        <div className="row align-items-center g-2">
                          <div className="col-12 col-md-6">
                            <p className="text-muted small mb-0 text-center text-md-start">
                              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                            </p>
                          </div>
                          <div className="col-12 col-md-6 d-flex justify-content-end gap-3 flex-column flex-md-row mt-2 mt-md-0">
                            <div className="d-flex justify-content-center gap-2">
                              <button className="btn btn-outline-primary btn-sm" onClick={handlePrint}>
                                <i className="fa fa-print me-1"></i>Print
                              </button>
                              <button className="btn btn-outline-danger btn-sm" onClick={handleDownloadPDF}>
                                <i className="fa fa-file-pdf me-1"></i>PDF
                              </button>
                            </div>
                            <nav className="d-flex justify-content-md-end justify-content-center">
                              <ul className="pagination mb-0">{renderPagination()}</ul>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Logs;