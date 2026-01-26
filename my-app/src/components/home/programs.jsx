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

                {/* Video Section */}
                <div className="row mb-5">
                <div className="col-12">
                    <div
                    className="rounded-2 shadow-lg overflow-hidden"
                    style={{ background: "#000" }}
                    >
                    <div
                        style={{
                        position: "relative",
                        paddingBottom: "56.25%", // 16:9 ratio
                        height: 0,
                        }}
                    >
{/* Custom Play Button Overlay */}
<div 
  id="playButtonOverlay"
  onClick={() => {
    const video = document.getElementById('schoolVideo');
    const overlay = document.getElementById('playButtonOverlay');
    if (video && overlay) {
      video.play();
      overlay.style.display = 'none';
    }
  }}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(0, 0, 0, 0.3)",
    zIndex: 2,
    pointerEvents: "auto",
  }}
>
  <div
    style={{
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      background: "rgba(220, 38, 38, 0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
    }}
    className="play-button-circle"
  >
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="white"
      style={{ marginLeft: "4px" }}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </div>
</div>

<video
  id="schoolVideo"
  src="https://res.cloudinary.com/dqg9d0gbp/video/upload/v1769434972/sd_k1tju4.mp4"
  poster="https://res.cloudinary.com/dqg9d0gbp/image/upload/v1769333741/profiles/students/1769333720577-shsBackground.jpg"
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1,
  }}
  controls
  controlsList="nofullscreen nodownload noremoteplayback"
  disablePictureInPicture
  title="School Introduction Video"
/>

{/* Facebook iframe embed - commented out
<iframe
  src="https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=1426824341829847&show_text=false"
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: "none",
  }}
  scrolling="no"
  frameBorder="0"
  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  allowFullScreen
  title="School Introduction Video"
/>
*/}

                    </div>
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
                        <div className="rounded-2 p-4 p-md-5 position-relative overflow-hidden" 
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
                
                video::-webkit-media-controls-picture-in-picture-button {
                    display: none !important;
                }
                
                video::-webkit-media-controls-fullscreen-button {
                    display: none !important;
                }
                
                .play-button-circle:hover {
                    transform: scale(1.1);
                    background: rgba(220, 38, 38, 1) !important;
                }
                
                #schoolVideo:not([paused]) ~ #playButtonOverlay {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}

export default Programs;