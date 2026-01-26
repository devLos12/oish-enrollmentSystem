import React from "react";

const Programs = () => {
    return (
        <div className="container-fluid py-5" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
            <div className="container">
                {/* Header Section */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="rounded-2 p-4 p-md-5 text-center shadow-lg position-relative overflow-hidden" 
                             style={{background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'}}>
                            <div className="position-absolute top-0 start-0 w-100 h-100" 
                                 style={{background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'}}></div>
                            <h2 className="text-white fw-bold mb-3 display-6 position-relative">
                                SENIOR HIGH SCHOOL PROGRAM
                            </h2>
                            <p className="text-white fs-5 mb-0 position-relative" 
                            >
                                Choose the right program that fits you
                            </p>
                        </div>
                    </div>
                </div>

                {/* Featured Programs */}
                <div className="row g-4 mb-5">
                    <div className="col-12 col-md-6">
                        <div className="card border-0 h-100 hover-card" 
                             style={{background: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
                            <div className="card-body p-4 p-md-5 text-center">
                                <h2 className="fw-bold mb-3 display-6" style={{color: '#dc2626'}}>STEM</h2>
                                <p className="mb-2 fw-semibold" style={{color: '#4b5563'}}>SCIENCE, TECHNOLOGY</p>
                                <p className="fw-semibold" style={{color: '#4b5563'}}>ENGINEERING & MATHEMATICS</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6">
                        <div className="card border-0 h-100 hover-card" 
                             style={{background: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
                            <div className="card-body p-4 p-md-5 text-center">
                                <h2 className="fw-bold mb-3 display-6" style={{color: '#dc2626'}}>TVL - ICT</h2>
                                <p className="fw-semibold" style={{color: '#4b5563'}}>TECHNICAL DRAFTING</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Programs Section */}
                <div className="row">
                    <div className="col-12">
                        <div className="rounded-4 p-4 p-md-5 position-relative overflow-hidden" 
                             style={{background: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
                            <h3 className="text-center fw-bold mb-4" style={{color: '#1f2937'}}>
                                Also Offering:
                            </h3>
                            
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <div className="p-3 border-start border-4 rounded position-relative program-item" 
                                         style={{borderColor: '#6b7280', background: 'linear-gradient(90deg, rgba(107,114,128,0.08) 0%, rgba(107,114,128,0.02) 100%)', transition: 'all 0.3s ease'}}>
                                        <h5 className="fw-bold mb-1" style={{color: '#dc2626'}}>HUMMS</h5>
                                        <p className="small mb-0 fw-medium" style={{color: '#4b5563'}}>HUMANITIES & SOCIAL SCIENCE</p>
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="p-3 border-start border-4 rounded position-relative program-item" 
                                         style={{borderColor: '#6b7280', background: 'linear-gradient(90deg, rgba(107,114,128,0.08) 0%, rgba(107,114,128,0.02) 100%)', transition: 'all 0.3s ease'}}>
                                        <h5 className="fw-bold mb-1" style={{color: '#dc2626'}}>ABM</h5>
                                        <p className="small mb-0 fw-medium" style={{color: '#4b5563'}}>ACCOUNTANCY, BUSINESS & MANAGEMENT</p>
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="p-3 border-start border-4 rounded position-relative program-item" 
                                         style={{borderColor: '#6b7280', background: 'linear-gradient(90deg, rgba(107,114,128,0.08) 0%, rgba(107,114,128,0.02) 100%)', transition: 'all 0.3s ease'}}>
                                        <h5 className="fw-bold mb-2" style={{color: '#dc2626'}}>TVL - HOME ECONOMICS</h5>
                                        <p className="small mb-0 fw-medium" style={{color: '#4b5563'}}>BREAD & PASTRY PRODUCTION, FOOD & BEVERAGE SERVICES, COOKERY</p>
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="p-3 border-start border-4 rounded position-relative program-item" 
                                         style={{borderColor: '#6b7280', background: 'linear-gradient(90deg, rgba(107,114,128,0.08) 0%, rgba(107,114,128,0.02) 100%)', transition: 'all 0.3s ease'}}>
                                        <h5 className="fw-bold mb-2" style={{color: '#dc2626'}}>TVL - INDUSTRIAL ARTS</h5>
                                        <p className="small mb-0 fw-medium" style={{color: '#4b5563'}}>SHIELDED METAL ARC WELDING (SMAW)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-card {
                    transition: all 0.3s ease;
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
                }
                
                .program-item {
                    cursor: pointer;
                }
                
                .program-item:hover {
                    background: linear-gradient(90deg, rgba(107,114,128,0.15) 0%, rgba(107,114,128,0.05) 100%) !important;
                    transform: translateX(5px);
                    border-color: #dc2626 !important;
                }
            `}</style>
        </div>
    );
}

export default Programs;