import React, { useEffect, useLayoutEffect, useState, useContext } from "react";
import { globalContext } from "../../context/global";
import { useLocation } from "react-router-dom";

const GenerateCodeForm = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    const [resData, setResData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoadingLogs(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/access_code_logs`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setLogs(data.data);
        } catch (error) {
            console.error("Error fetching logs:", error.message);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResData(null);
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate_code`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTimeout(() => {
                setResData(data);
                setIsLoading(false);
                fetchLogs();
            }, 1000);
        } catch (error) {
            console.log("Error: ", error.message);
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const map = {
            active:  { cls: 'bg-success',   icon: 'fa-check-circle', label: 'Active'   },
            used:    { cls: 'bg-secondary',  icon: 'fa-user-check',   label: 'Used'     },
            expired: { cls: 'bg-danger',     icon: 'fa-clock',        label: 'Expired'  },
        };
        const s = map[status] || map.expired;
        return (
            <span className={`badge ${s.cls}`}>
                <i className={`fa ${s.icon} me-1`}></i>{s.label}
            </span>
        );
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-10">

                    {/* Generate Card */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0 fw-bold">
                                <i className="fa fa-key me-2"></i>Generate Access Code
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2 text-danger mb-1">
                                <i className="fa-solid fa-info-circle small"></i>
                                <span className="fw-bold small">NOTE:</span>
                            </div>
                            <p className="small fw-semibold mb-3">
                                This will generate a random code to access registration for faculty members.
                            </p>
                            <form onSubmit={handleSubmit}>
                                <button className="btn btn-dark" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Generating...
                                        </>
                                    ) : (
                                        <><i className="fa fa-rotate me-2"></i>Generate Code</>
                                    )}
                                </button>
                            </form>

                            {resData?.code && !isLoading && (
                                <div className="mt-3 text-center">
                                    <p className="mb-0 fw-semibold">{resData?.message}</p>
                                    <p className="mb-0 display-4 fw-bold text-success font-monospace">{resData?.code}</p>
                                    <p className="mb-0 small text-muted">
                                        <i className="fa fa-clock me-1"></i>Expires in 1 hour
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logs Card */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold text-dark">
                                <i className="fa fa-list me-2 text-danger"></i>Access Code Logs
                            </h5>
                            <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogs} disabled={loadingLogs}>
                                <i className={`fa fa-rotate me-1 ${loadingLogs ? 'fa-spin' : ''}`}></i>Refresh
                            </button>
                        </div>
                        <div className="card-body p-0">
                            {loadingLogs ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-dark" role="status"></div>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="fa fa-inbox fa-2x mb-2 d-block"></i>
                                    <small>No logs yet.</small>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover mb-0 small">
                                        <thead>
                                            <tr>
                                                <th className="text-center">#</th>
                                                <th className="text-center">Code</th>
                                                <th className="text-center">Status</th>
                                                <th>Generated At</th>
                                                <th>Expires At</th>
                                                <th>Used By</th>
                                                <th>Used At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log, index) => (
                                                <tr key={log._id}>
                                                    <td className="text-center text-muted">{index + 1}</td>
                                                    <td className="text-center fw-bold font-monospace">{log.code}</td>
                                                    <td className="text-center">{getStatusBadge(log.status)}</td>
                                                    <td>{formatDate(log.generatedAt)}</td>
                                                    <td className={log.status === 'expired' ? 'text-danger' : ''}>
                                                        {formatDate(log.expiresAt)}
                                                    </td>
                                                    <td>
                                                        {log.usedBy?.email ? (
                                                            <div>
                                                                <p className="mb-0 fw-semibold text-capitalize">
                                                                    {log.usedBy.lastName}, {log.usedBy.firstName} {log.usedBy.middleName !== 'N/A' ? log.usedBy.middleName : ''}
                                                                </p>
                                                                <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>{log.usedBy.email}</p>
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                    <td>{formatDate(log.usedAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GenerateCodeForm;