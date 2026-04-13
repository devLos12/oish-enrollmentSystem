import React, { useContext, useLayoutEffect, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import html2pdf from "html2pdf.js";



const Dashboard = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    
    // ✅ Dinagdag ang pwdStudents, indigenousStudents, fourPsStudents
    const [stats, setStats] = useState({
        totalStudents: 0,
        regularStudents: 0,
        returnees: 0,
        transferees: 0,
        maleStudents: 0,
        femaleStudents: 0,
        pwdStudents: 0,
        indigenousStudents: 0,
        fourPsStudents: 0
    });
    const [strandStats, setStrandStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStrand, setLoadingStrand] = useState(true);

    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [isFiltering, setIsFiltering] = useState(false);
    const [dateError, setDateError] = useState('');


    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        fetchStats();
        fetchStrandStats();
    }, []);

    const fetchStats = async (startDate = '', endDate = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/dashboardStats?${params.toString()}`, 
                { method: "GET", credentials: "include" }
            );
            const result = await response.json();
            if(!response.ok) throw new Error(result.message);
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error("Error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStrandStats = async (startDate = '', endDate = '') => {
        try {
            setLoadingStrand(true);
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/enrollmentStatsByStrand?${params.toString()}`, 
                { method: "GET", credentials: "include" }
            );
            const result = await response.json();
            if(!response.ok) throw new Error(result.message);
            if (result.success) setStrandStats(result.data);
        } catch (error) {
            console.error("Error:", error.message);
        } finally {
            setLoadingStrand(false);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const validateDate = (dateString) => {
        if (!dateString) return true;
        return new Date(dateString) <= new Date(getTodayDate());
    };

    const handleStartDateBlur = () => {
        if (dateRange.startDate && !validateDate(dateRange.startDate)) {
            setDateError('Future dates are not allowed. Please select a past or current date.');
            setDateRange({...dateRange, startDate: ''});
        } else {
            setDateError('');
        }
    };

    const handleEndDateBlur = () => {
        if (dateRange.endDate && !validateDate(dateRange.endDate)) {
            setDateError('Future dates are not allowed. Please select a past or current date.');
            setDateRange({...dateRange, endDate: ''});
            return;
        }
        if (dateRange.startDate && dateRange.endDate && new Date(dateRange.endDate) < new Date(dateRange.startDate)) {
            setDateError('End date cannot be before start date.');
            setDateRange({...dateRange, endDate: ''});
            return;
        }
        setDateError('');
    };

    const handleApplyFilter = () => {
        if (!dateRange.startDate || !dateRange.endDate) { alert("Please select both start and end dates"); return; }
        if (!validateDate(dateRange.startDate) || !validateDate(dateRange.endDate)) { alert("Future dates are not allowed."); return; }
        if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) { alert("Start date cannot be after end date"); return; }
        setIsFiltering(true);
        fetchStats(dateRange.startDate, dateRange.endDate);
        fetchStrandStats(dateRange.startDate, dateRange.endDate);
    };

    const handleClearFilter = () => {
        setDateRange({ startDate: '', endDate: '' });
        setIsFiltering(false);
        setDateError('');
        fetchStats();
        fetchStrandStats();
    };


    // ============================
    // REUSABLE COMPONENTS
    // ============================

    const StatCard = ({ title, count, icon, bgColor, textColor }) => (
        <div className="col-12 col-sm-6 col-lg-4 mb-4">
            <div className="card h-100 border-0 shadow-sm"
                style={{ background: bgColor, transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    {loading ? (
                        <div className="w-100 d-flex justify-content-center align-items-center" style={{ height: '80px' }}>
                            <div className={`spinner-border text-${textColor}`} role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className={`text-${textColor} mb-2 small fw-medium text-uppercase`}>{title}</p>
                                <p className={`text-${textColor} fw-semibold mb-0 m-0 fs-2`}>{count}</p>
                            </div>
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-white"
                                style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                                <i className={`fa-solid ${icon} fs-4 text-${textColor}`}></i>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const ProgressBar = ({ name, count, maxCount }) => {
        const percentage = (count / maxCount) * 100;
        return (
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-dark">{name}</span>
                    <span className="badge rounded-pill" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', padding: '6px 12px' }}>
                        {count} students
                    </span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${percentage}%`, height: '100%',
                        background: 'linear-gradient(90deg, #dc3545 0%, #ff6b7a 100%)',
                        borderRadius: '10px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                </div>
            </div>
        );
    };

    // ✅ Reusable Mini Pie Chart - PWD / Indigenous / 4Ps
    const MiniPieChart = ({ title, icon, data, colors }) => {
        const total = data.reduce((sum, d) => sum + d.value, 0);

        const CustomMiniTooltip = ({ active, payload }) => {
            if (active && payload && payload.length) {
                return (
                    <div style={{ backgroundColor: 'white', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <p className="mb-1 fw-semibold text-dark small">{payload[0].name}</p>
                        <p className="mb-0 fw-bold small" style={{ color: payload[0].payload.fill }}>
                            {payload[0].value} students
                        </p>
                    </div>
                );
            }
            return null;
        };

        return (
            <div className="col-12 col-lg-4 mb-4">
                <div className="card shadow-sm h-100 border-0">
                    <div className="card-header bg-white border-bottom">
                        <h5 className="mb-0 fw-semibold text-dark">
                            <i className={`fa-solid ${icon} me-2 text-danger`}></i>
                            {title}
                        </h5>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: '220px' }}>
                                <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
                            </div>
                        ) : total === 0 ? (
                            <div className="d-flex flex-column justify-content-center align-items-center text-muted" style={{ height: '220px' }}>
                                <i className="fa-solid fa-chart-pie fs-1 mb-2 opacity-25"></i>
                                <p className="small mb-0">No data available</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column align-items-center gap-3">
                                <div style={{ width: '180px', height: '180px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                cx="50%" cy="50%"
                                                outerRadius={75} innerRadius={40}
                                                dataKey="value" paddingAngle={3}
                                                labelLine={false} label={false}
                                            >
                                                {data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomMiniTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Legend */}
                                <div className="d-flex flex-column gap-2 w-100 px-2">
                                    {data.map((item, index) => (
                                        <div key={index} className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded" style={{ width: '12px', height: '12px', backgroundColor: colors[index], flexShrink: 0 }}></div>
                                                <span className="small text-dark">{item.name}</span>
                                            </div>
                                            <span className="badge rounded-pill small fw-semibold"
                                                style={{ background: `${colors[index]}25`, color: colors[index] }}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // ============================
    // CHART DATA
    // ============================

    // ✅ Isang pie chart — kasama na Regular, Returnees, Transferees, PWD, Indigenous, 4Ps
    const pieChartData = [
        { name: 'Regular Students',  value: stats.regularStudents },
        { name: 'Returnees',         value: stats.returnees },
        { name: 'Transferees',       value: stats.transferees },
        { name: 'PWD Students',      value: stats.pwdStudents },
        { name: 'Indigenous',        value: stats.indigenousStudents },
        { name: '4Ps Beneficiaries', value: stats.fourPsStudents }
    ];

    const COLORS = ['#dc3545', '#fd7e14', '#ffc107', '#a78bfa', '#86efac', '#d97706'];

    const maxStrandCount = Math.max(...strandStats.map(s => s.count), 1);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    <p className="mb-1 fw-semibold text-dark">{payload[0].name}</p>
                    <p className="mb-0 text-danger fw-bold">{payload[0].value} students</p>
                </div>
            );
        }
        return null;
    };


    const handleDownloadPDF = () => {
        const filterText = isFiltering 
            ? `<p><strong>Date Range:</strong> ${new Date(dateRange.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(dateRange.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
            : '<p><strong>Showing:</strong> All Time Data</p>';

        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; color: #dc3545; margin-bottom: 10px;">Dashboard Overview</h2>
                <h3 style="text-align: center; color: #6c757d; margin-bottom: 20px;">Enrollment Statistics Report</h3>
                <div style="margin-bottom: 30px;">
                    <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    ${filterText}
                </div>
                <h4 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 8px; margin-bottom: 20px;">Student Statistics</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr style="background-color: #f8f9fa;"><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Total Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.totalStudents}</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Male Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.maleStudents}</td></tr>
                    <tr style="background-color: #f8f9fa;"><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Female Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.femaleStudents}</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Regular Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.regularStudents}</td></tr>
                    <tr style="background-color: #f8f9fa;"><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Returnees</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.returnees}</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Transferees</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.transferees}</td></tr>
                    <tr style="background-color: #f8f9fa;"><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">PWD Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.pwdStudents}</td></tr>
                    <tr><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Indigenous Students</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.indigenousStudents}</td></tr>
                    <tr style="background-color: #f8f9fa;"><td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">4Ps Beneficiaries</td><td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${stats.fourPsStudents}</td></tr>
                </table>
                <h4 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 8px; margin-bottom: 20px;">Popular Strands</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #dc3545; color: white;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Strand</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Student Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${strandStats.map((strand, index) => `
                            <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                                <td style="border: 1px solid #ddd; padding: 12px;">${strand.name}</td>
                                <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">${strand.count}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        html2pdf().set({
            margin: 10,
            filename: `dashboard_report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
    };


    return (
        <div className="container-fluid py-4">

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 col-md-6">
                    <h4 className="text-capitalize fw-bold mb-1">Dashboard Overview</h4>
                    <p className="text-muted small mb-0">Overview of enrollment statistics</p>
                </div>
                <div className="col-12 col-md-6 mt-2 mt-md-0">
                    <div className="d-flex justify-content-md-end gap-2">
                        <button type="button" className="btn btn-outline-danger btn-sm"
                            onClick={handleDownloadPDF} disabled={loading || loadingStrand}>
                            <i className="fa fa-file-pdf me-1"></i>Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="row g-3 align-items-end">
                                <div className="col-12 col-md-3">
                                    <label className="form-label fw-semibold mb-2">
                                        <i className="fa fa-calendar me-2 text-danger"></i>Start Date
                                    </label>
                                    <input type="date"
                                        className={`form-control ${dateError && !dateRange.startDate ? 'is-invalid' : ''}`}
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                                        onBlur={handleStartDateBlur} max={getTodayDate()} />
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="form-label fw-semibold mb-2">
                                        <i className="fa fa-calendar me-2 text-danger"></i>End Date
                                    </label>
                                    <input type="date"
                                        className={`form-control ${dateError && !dateRange.endDate ? 'is-invalid' : ''}`}
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                                        onBlur={handleEndDateBlur} max={getTodayDate()} min={dateRange.startDate || undefined} />
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-danger" onClick={handleApplyFilter}
                                            disabled={!dateRange.startDate || !dateRange.endDate || loading || loadingStrand}>
                                            <i className="fa fa-filter me-2"></i>Apply Filter
                                        </button>
                                        {isFiltering && (
                                            <button type="button" className="btn btn-outline-secondary" onClick={handleClearFilter}>
                                                <i className="fa fa-times me-2"></i>Clear Filter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {dateError && (
                                <div className="alert alert-danger mt-3 mb-0">
                                    <i className="fa fa-exclamation-circle me-2"></i>{dateError}
                                </div>
                            )}
                            {isFiltering && !dateError && (
                                <div className="alert alert-warning mt-3 mb-0">
                                    <i className="fa fa-info-circle me-2"></i>
                                    Showing data from <strong>{new Date(dateRange.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>{new Date(dateRange.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row">
                <StatCard title="Total Students" count={stats.totalStudents} icon="fa-users" bgColor="#fee2e2" textColor="danger" />
                <StatCard title="Male Students" count={stats.maleStudents} icon="fa-mars" bgColor="#dbeafe" textColor="primary" />
                <StatCard title="Female Students" count={stats.femaleStudents} icon="fa-venus" bgColor="#fce7f3" textColor="danger" />
            </div>

            {/* Charts Row - Student Type + Strands */}
            <div className="row">
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="mb-0 fw-semibold text-dark">
                                <i className="fa fa-chart-pie me-2 text-danger"></i>Student Statistics
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                                    <div style={{ width: '220px', height: '220px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={false}
                                                    outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {pieChartData.map((item, index) => (
                                            <div key={index} className="d-flex align-items-center gap-3">
                                                <div className="rounded" style={{ width: '16px', height: '16px', backgroundColor: COLORS[index], flexShrink: 0 }}></div>
                                                <div>
                                                    <p className="mb-0 fw-semibold text-dark small">{item.name}</p>
                                                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>{item.value} students</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="mb-0 fw-semibold text-dark">
                                <i className="fa fa-star me-2 text-danger"></i>Popular Strands
                            </h5>
                        </div>
                        <div className="card-body">
                            {loadingStrand ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
                                </div>
                            ) : (
                                <div>
                                    {strandStats.map((strand, index) => (
                                        <ProgressBar key={index} name={strand.name} count={strand.count} maxCount={maxStrandCount} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>



        </div>
    );
}

export default Dashboard;