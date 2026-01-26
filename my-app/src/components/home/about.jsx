import React from "react";

const About = () => {
    return (
        <div className="container-fluid py-5">
            <div className="container">
                <div className="row g-4justify-content-center">
                    {/* Vision Card */}
                    <div className="col-12 col-lg-4">
                        <div className="card border-0 h-100 position-relative overflow-hidden hover-card" 
                             style={{background: 'linear-gradient(135deg, #ffffff 0%, #fff1f1 100%)', boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)'}}
                             
                             >
                            <div className="position-absolute" 
                                 style={{top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', borderRadius: '50%'}}></div>
                            
                            <div className="card-body p-4 p-md-5 position-relative">
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                                         style={{width: "80px", height: "80px"}}>
                                        <div className="position-absolute w-100 h-100 rounded-circle" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.1}}></div>
                                        <div className="position-absolute w-100 h-100 rounded-circle animate-pulse" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.05, transform: 'scale(1.2)'}}></div>
                                        <svg className="position-relative" width="40" height="40" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </div>
                                    <h3 className="fw-bold text-uppercase mb-0" 
                                        style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '1.75rem'}}>
                                        Vision
                                    </h3>
                                </div>
                                <p className="text-dark mb-0 lh-lg" style={{textAlign: 'justify'}}>
                                    We dream of Filipinos who passionately love their country and whose values 
                                    and competencies enable them to realize their full potential and contribute 
                                    meaningfully to building the nation.
                                    <br/><br/>
                                    As a learner-centered public institution, the Department of Education 
                                    continuously improves itself to better serve its stakeholders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mission Card */}
                    <div className="col-12 col-lg-4">
                        <div className="card border-0 h-100 position-relative overflow-hidden hover-card" 
                             style={{background: 'linear-gradient(135deg, #ffffff 0%, #fff1f1 100%)', boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)'}}>
                            <div className="position-absolute" 
                                 style={{top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', borderRadius: '50%'}}></div>
                            
                            <div className="card-body p-4 p-md-5 position-relative">
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                                         style={{width: "80px", height: "80px"}}>
                                        <div className="position-absolute w-100 h-100 rounded-circle" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.1}}></div>
                                        <div className="position-absolute w-100 h-100 rounded-circle animate-pulse" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.05, transform: 'scale(1.2)'}}></div>
                                        <svg className="position-relative" width="40" height="40" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                    <h3 className="fw-bold text-uppercase mb-0" 
                                        style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '1.75rem'}}>
                                        Mission
                                    </h3>
                                </div>
                                <p className="text-dark mb-0 lh-lg" style={{textAlign: 'justify'}}>
                                    To protect and promote the right of every Filipino to quality, equitable, 
                                    culture-based, and complete basic education where:
                                    <br/><br/>
                                    Students learn in a child-friendly, gender-sensitive, safe, and motivating environment.
                                    <br/><br/>
                                    Teachers facilitate learning and constantly nurture every learner.
                                    <br/><br/>
                                    Administrators and staff, as stewards of the institution, ensure an enabling 
                                    and supportive environment for effective learning to happen.
                                    <br/><br/>
                                    Family, community, and other stakeholders are actively engaged and share 
                                    responsibility for developing life-long learners.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Core Values Card */}
                    <div className="col-12 col-lg-4">
                        <div className="card border-0 h-100 position-relative overflow-hidden hover-card" 
                             style={{background: 'linear-gradient(135deg, #ffffff 0%, #fff1f1 100%)', boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)'}}>
                            <div className="position-absolute" 
                                 style={{bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', borderRadius: '50%'}}></div>
                            
                            <div className="card-body p-4 p-md-5 position-relative">
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                                         style={{width: "80px", height: "80px"}}>
                                        <div className="position-absolute w-100 h-100 rounded-circle" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.1}}></div>
                                        <div className="position-absolute w-100 h-100 rounded-circle animate-pulse" 
                                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', opacity: 0.05, transform: 'scale(1.2)'}}></div>
                                        <svg className="position-relative" width="40" height="40" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                        </svg>
                                    </div>
                                    <h3 className="fw-bold text-uppercase mb-0" 
                                        style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '1.75rem'}}>
                                        Our Core Values
                                    </h3>
                                </div>
                                <div className="d-flex flex-column gap-3">
                                    {['Makadiyos', 'Makatao', 'Makakalikasan', 'Makabansa'].map((value, index) => (
                                        <div key={index} className="value-item p-3 rounded position-relative" 
                                             style={{background: 'linear-gradient(90deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.02) 100%)', borderLeft: '4px solid #dc2626', transition: 'all 0.3s ease'}}>
                                            <p className="mb-0 fw-semibold text-dark">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-card {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .hover-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 60px rgba(220, 38, 38, 0.25) !important;
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.05;
                        transform: scale(1.2);
                    }
                    50% {
                        opacity: 0.1;
                        transform: scale(1.3);
                    }
                }
                
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                .value-item {
                    cursor: pointer;
                }
                
                .value-item:hover {
                    background: linear-gradient(90deg, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.05) 100%) !important;
                    transform: translateX(5px);
                }
            `}</style>
        </div>
    );
}

export default About;