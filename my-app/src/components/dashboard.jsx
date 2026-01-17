import React, { useContext, useLayoutEffect, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { globalContext } from "../context/global";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const Dashboard = () => {
    const { setTextHeader } = useContext(globalContext);
    const location = useLocation();
    
    const [stats, setStats] = useState({
        totalStudents: 0,
        regularStudents: 0,
        returnees: 0,
        transferees: 0,
        maleStudents: 0,
        femaleStudent: 0
    });
    const [gradeStats, setGradeStats] = useState([]);
    const [trackStats, setTrackStats] = useState([]);
    const [strandStats, setStrandStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingGrade, setLoadingGrade] = useState(true);
    const [loadingTrack, setLoadingTrack] = useState(true);
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

    // Fetch enrollment statistics by grade
    useEffect(() => {
        const fetchGradeStats = async () => {
            try {
                setLoadingGrade(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollmentStatsByGrade`, {
                    method: "GET",
                    credentials: "include"
                });
                const result = await response.json();
                if(!response.ok) throw new Error(result.message);

                if (result.success) {
                    setGradeStats(result.data);
                }
            } catch (error) {
                console.error("Error:", error.message);
            } finally {
                setLoadingGrade(false);
            }
        };

        fetchGradeStats();
    }, []);

    // Fetch track statistics
    useEffect(() => {
        const fetchTrackStats = async () => {
            try {
                setLoadingTrack(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollmentStatsByTrack`, {
                    method: "GET",
                    credentials: "include"
                });
                const result = await response.json();
                if(!response.ok) throw new Error(result.message);

                if (result.success) {
                    setTrackStats(result.data);
                }
            } catch (error) {
                console.error("Error:", error.message);
            } finally {
                setLoadingTrack(false);
            }
        };

        fetchTrackStats();
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

    const StatCard = ({ title, count, bgColor, icon }) => (
        <div className="col-6 col-sm-6 col-lg-4 mb-4 ">
            <div className={`card h-100 border-0 overflow-hidden shadow-sm border-start border-5
                 border-danger `}>
                <div className="card-body text-center d-flex flex-column justify-content-center shadow-sm gap-2">
                    {loading ? (
                        <div className="spinner-border text-white" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <>
                        <div className="d-flex flex-column align-items-center justify-content-center gap-2 ">
                             <div className={`fa-solid fs-3 ${icon} small p-2 bg-danger bg-opacity-10 text-danger rounded-pill`}></div>
                            <p className="m-0 fw-bold text-danger fs-3">{count}</p>
                            <p className="m-0 fw-bold text-muted small">{title}</p>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const HorizontalBarItem = ({ name, count, maxCount, color = '#ec4899' }) => {
        const percentage = (count / maxCount) * 100;
        
        return (
            <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-dark fw-medium">{name}</span>
                    <span className="fw-bold text-dark">{count}</span>
                </div>
                <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
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
    const trackScale = 25;

    // Prepare track data with colors and maxCount
    const trackData = trackStats.map(track => ({
        name: track.name,
        count: track.count,
        color: track.name === 'Academic' ? '#fd7e14' : '#20c997',
        maxCount: Math.max(...trackStats.map(t => t.count), 1) * trackScale  
    }));

    // Prepare strand data with maxCount
    const strandData = strandStats.map(strand => ({
        name: strand.name,
        count: strand.count,
        maxCount: Math.max(...strandStats.map(s => s.count), 1) * trackScale
    }));

    return (
        <div className="container">
            {/* Stat Cards Row */}
            <div className="row my-4 my-md-0 p-md-3">
                <StatCard 
                    title="Total Students" 
                    count={stats.totalStudents} 
                    bgColor={"bg-white"}
                    icon={"fa-users"}
                />
                 <StatCard 
                    title="Male" 
                    count={stats.maleStudents} 
                    bgColor={"bg-white"}
                    icon={"fa-mars"}
                />
                  <StatCard 
                    title="Female" 
                    count={stats.femaleStudents} 
                    bgColor={"bg-white"}
                    icon={"fa-venus"}
                />
            </div>

            {/* Pie Chart Row */}
            <div className="row p-0 p-md-3">
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-1 text-capitalize">pie </h5>
                            <p className="text-muted small mb-4 text-capitalize">student statistics</p>
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center gap-3">
                                    {/* Pie Chart */}
                                    <div style={{ width: '200px', height: '200px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        padding: '10px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Custom Legend */}
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#dc3545' 
                                            }}></div>
                                            <span className="text-muted small fw-medium">Regular Students</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#fd7e14' 
                                            }}></div>
                                            <span className="text-muted small fw-medium">Returnees</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ 
                                                width: '12px', 
                                                height: '12px', 
                                                borderRadius: '50%', 
                                                backgroundColor: '#ffc107' 
                                            }}></div>
                                            <span className="text-muted small fw-medium">Transferees</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <i className="fa-solid fa-chart-line text-danger"></i>
                                <h5 className="card-title fw-bold mb-0">Popular Strands</h5>
                            </div>
                            {loadingStrand ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '100px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {strandData.map((strand, index) => (
                                        <HorizontalBarItem
                                            key={index}
                                            name={strand.name}
                                            count={strand.count}
                                            maxCount={strand.maxCount}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>



                {/* Bar Chart */}
                {/* <div className="col-12 col-lg-4 mb-4">
                    <div className="card border-0  h-100 bg-transparent">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-1">Charts</h5>
                            <p className="text-muted small mb-4">Grade Statistic</p>
                            {loadingGrade ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={gradeStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="_id" 
                                            tick={{ fontSize: 12 }}
                                            label={{ value: 'Grade Level', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12 }}
                                            label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
                                            domain={[0, (dataMax) => dataMax * 1.1]}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                            {gradeStats.map((entry, index) => (
                                                <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry._id === 12 ? "#ffc107" : "#dc3545"} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div> */}
            </div>

            {/* Tracks and Strands Row */}
            {/* <div className="row p-3">
                <div className="col-12 col-lg-6 mb-4">
                    <div className="card border-0 bg-transparent  h-100 ">
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <i className="fa-solid fa-graduation-cap text-warning"></i>
                                <h5 className="card-title fw-bold mb-0">Senior High School Tracks</h5>
                            </div>
                            {loadingTrack ? (
                                <div className="d-flex justify-content-center align-items-center" style={{ height: '100px' }}>
                                    <div className="spinner-border text-danger" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {trackData.map((track, index) => (
                                        <HorizontalBarItem
                                            key={index}
                                            name={track.name}
                                            count={track.count}
                                            maxCount={track.maxCount}
                                            color={track.color}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
}

export default Dashboard;