import React, { useContext, useLayoutEffect, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const Dashboard = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    
    const [stats, setStats] = useState({
        totalStudents: 0,
        regularStudents: 0,
        returnees: 0,
        transferees: 0,
        maleStudents: 0,
        femaleStudents: 0
    });
    const [strandStats, setStrandStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStrand, setLoadingStrand] = useState(true);

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    // Fetch enrollment statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboardStats`, {
                    method: "GET",
                    credentials: "include"
                });
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

        fetchStats();
    }, []);

    // Fetch strand statistics
    useEffect(() => {
        const fetchStrandStats = async () => {
            try {
                setLoadingStrand(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollmentStatsByStrand`, {
                    method: "GET",
                    credentials: "include"
                });
                const result = await response.json();
                if(!response.ok) throw new Error(result.message);

                if (result.success) {
                    setStrandStats(result.data);
                }
            } catch (error) {
                console.error("Error:", error.message);
            } finally {
                setLoadingStrand(false);
            }
        };

        fetchStrandStats();
    }, []);

    const StatCard = ({ title, count, icon, bgColor, textColor }) => (
        <div className="col-12 col-sm-6 col-lg-4 mb-4">
            <div 
                className="card h-100 border-0 shadow-sm"
                style={{
                    background: bgColor,
                    transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    {loading ? (
                        <div className="w-100 d-flex justify-content-center align-items-center" 
                        style={{ height: '80px' }}>
                            <div className={`spinner-border text-${textColor}`} role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className={`text-${textColor} mb-2 small fw-medium text-uppercase`}>
                                    {title}
                                </p>
                                <p className={`text-${textColor} fw-semibold mb-0 m-0 fs-2  `}>
                                    {count}
                                </p>
                            </div>
                            <div 
                                className={`rounded-circle d-flex align-items-center justify-content-center bg-white`}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    flexShrink: 0
                                }}
                            >
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
                    <span 
                        className="badge rounded-pill"
                        style={{
                            background: 'rgba(220, 53, 69, 0.1)',
                            color: '#dc3545',
                            padding: '6px 12px'
                        }}
                    >
                        {count} students
                    </span>
                </div>
                <div style={{ 
                    width: '100%', 
                    height: '10px', 
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #dc3545 0%, #ff6b7a 100%)',
                        borderRadius: '10px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                </div>
            </div>
        );
    };

    const pieChartData = [
        { name: 'Regular Students', value: stats.regularStudents },
        { name: 'Returnees', value: stats.returnees },
        { name: 'Transferees', value: stats.transferees }
    ];

    const COLORS = ['#dc3545', '#fd7e14', '#ffc107'];
    const maxStrandCount = Math.max(...strandStats.map(s => s.count), 1);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <p className="mb-1 fw-semibold text-dark">{payload[0].name}</p>
                    <p className="mb-0 text-danger fw-bold">{payload[0].value} students</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid py-4">
            {/* Header Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <h4 className="text-capitalize fw-bold mb-1">Dashboard Overview</h4>
                    <p className="text-muted small mb-0">Overview of enrollment statistics</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row">
                <StatCard 
                    title="Total Students" 
                    count={stats.totalStudents} 
                    icon="fa-users"
                    bgColor="#fee2e2"
                    textColor="danger"
                />
                <StatCard 
                    title="Male Students" 
                    count={stats.maleStudents} 
                    icon="fa-mars"
                    bgColor="#dbeafe"
                    textColor="primary"
                />
                <StatCard 
                    title="Female Students" 
                    count={stats.femaleStudents} 
                    icon="fa-venus"
                    bgColor="#fce7f3"
                    textColor="danger"
                />
            </div>

            {/* Charts Row */}
            <div className="row">
                {/* Student Statistics Pie Chart */}
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="mb-0 fw-semibold text-dark">
                                <i className="fa fa-chart-pie me-2 text-danger"></i>
                                Student Statistics
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                                    <div style={{ width: '220px', height: '220px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={false}
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    paddingAngle={3}
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="d-flex flex-column gap-3">
                                        {pieChartData.map((item, index) => (
                                            <div key={index} className="d-flex align-items-center gap-3">
                                                <div 
                                                    className="rounded"
                                                    style={{ 
                                                        width: '16px', 
                                                        height: '16px', 
                                                        backgroundColor: COLORS[index],
                                                        flexShrink: 0
                                                    }}
                                                ></div>
                                                <div>
                                                    <p className="mb-0 fw-semibold text-dark small">{item.name}</p>
                                                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {item.value} students
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Popular Strands */}
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-white border-bottom">
                            <h5 className="mb-0 fw-semibold text-dark">
                                <i className="fa fa-star me-2 text-danger"></i>
                                Popular Strands
                            </h5>
                        </div>
                        <div className="card-body">
                            {loadingStrand ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {strandStats.map((strand, index) => (
                                        <ProgressBar
                                            key={index}
                                            name={strand.name}
                                            count={strand.count}
                                            maxCount={maxStrandCount}
                                        />
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