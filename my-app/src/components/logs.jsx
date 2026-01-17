import React, { useState, useEffect, useContext, useLayoutEffect } from "react";
import { globalContext } from "../context/global";
import { useLocation } from "react-router-dom";

const Logs = () => {
  const { setTextHeader } = useContext(globalContext);
  const location = useLocation();

  useLayoutEffect(() => {
    setTextHeader(location?.state?.title || "Activity Logs");
  }, [location?.state?.title]);

  // state
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // options
  const roleOptions = ["admin", "teacher", "student"];
  const statusOptions = ["Logged In", "Logged Out"];

  // fetch logs
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

      setLogs(data.reverse());
    } catch (error) {
      console.error("Error fetching logs:", error.message || error);
      alert("Failed to load logs data");
    } finally {
      setLoading(false);
    }
  };

  // Convert MM-DD-YYYY to Date object for comparison
  const parseLogDate = (dateString) => {
    if (!dateString) return null;
    const [month, day, year] = dateString.split('-');
    return new Date(year, month - 1, day);
  };

  // Format date to readable format: "December 12, 2025"
  const formatReadableDate = (dateString) => {
    if (!dateString) return '';
    const date = parseLogDate(dateString);
    if (!date) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // filtered list for table
  const filtered = logs
    .filter((log) => {
      const name = log.participantName?.toLowerCase() || '';
      const id = log.participantId?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || id.includes(search);
    })
    .filter((log) => (filterRole ? log.role === filterRole : true))
    .filter((log) => (filterStatus ? log.status === filterStatus : true))
    .filter((log) => {
      if (!filterDate) return true;
      
      const logDate = parseLogDate(log.Date);
      const selectedDate = new Date(filterDate);
      
      if (!logDate) return false;
      
      // Compare only date (ignore time)
      return logDate.toDateString() === selectedDate.toDateString();
    });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus, filterDate]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa fa-chevron-left"></i>
        </button>
      </li>
    );

    if (startPage > 1) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>
            1
          </button>
        </li>
      );
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fa fa-chevron-right"></i>
        </button>
      </li>
    );

    return pages;
  };

  // get status badge color
  const getStatusBadgeClass = (status) => {
    return status === "Logged In" ? "bg-success" : "bg-secondary";
  };

  // get role badge color
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-danger";
      case "teacher":
        return "bg-primary";
      case "student":
        return "bg-info";
      default:
        return "bg-secondary";
    }
  };

  const clearDateFilter = () => {
    setFilterDate("");
  };

  return (
    <>
      <div className="container-fluid py-4 g-0 g-md-5">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="text-capitalize fw-bold mb-1">log view</h4>
                <p className="text-muted small mb-0">
                  View user login and logout activities.
                </p>
              </div>
              <button
                className="btn btn-danger"
                onClick={fetchLogsData}
                disabled={loading}
              >
                <i className="fa fa-refresh me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fa fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-2 mt-2 mt-md-0">
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 mt-2 mt-md-0">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 mt-2 mt-md-0">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fa fa-calendar text-muted"></i>
              </span>
              <input
                type="date"
                className="form-control border-start-0"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              
              {filterDate && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={clearDateFilter}
                  title="Clear date filter"
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-2 mt-2 mt-md-0 text-end">
            <p className="text-muted mb-0 mt-2">
              Total: <strong>{filtered.length}</strong>
            </p>
          </div>
        </div>

        {filterDate && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info py-2 mb-0">
                <i className="fa fa-calendar me-2"></i>
                Showing logs for: <strong>{new Date(filterDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-2">Loading logs data...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fa fa-file-text fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No logs found</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="text-capitalize fw-semibold">#</th>
                            <th className="text-capitalize fw-semibold">log ID</th>
                            <th className="text-capitalize fw-semibold">Name</th>
                            <th className="text-capitalize fw-semibold">Role</th>
                            <th className="text-capitalize fw-semibold">Date</th>
                            <th className="text-capitalize fw-semibold">Time</th>
                            <th className="text-capitalize fw-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLogs.map((log, idx) => (
                            <tr key={log._id}>
                              <td className="align-middle">{indexOfFirstItem + idx + 1}</td>
                              <td className="align-middle">
                                <span className="badge bg-secondary font-monospace">
                                  {"ID" + log._id.slice(0, 12)}
                                </span>
                              </td>
                              <td className="align-middle fw-semibold text-capitalize">
                                {log.participantName}
                              </td>
                              <td className="align-middle">
                                <span
                                  className={`badge ${getRoleBadgeClass(
                                    log.role
                                  )}`}
                                >
                                  {log.role.charAt(0).toUpperCase() +
                                    log.role.slice(1)}
                                </span>
                              </td>
                              <td className="align-middle">{formatReadableDate(log.Date)}</td>
                              <td className="align-middle">{log.time}</td>
                              <td className="align-middle">
                                <span
                                  className={`badge ${getStatusBadgeClass(
                                    log.status
                                  )}`}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                      <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <div className="text-muted small">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            {renderPagination()}
                          </ul>
                        </nav>
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