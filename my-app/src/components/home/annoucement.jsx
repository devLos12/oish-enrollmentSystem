import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Announcement = () => {
    const [annoucement, setAnnouncement] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const prevRef = useRef();
    const nextRef = useRef();

    useEffect(() => {
        getAnnoucement();
    }, []);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && selectedImage) {
                setSelectedImage(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [selectedImage]);

    const getAnnoucement = async() => {
        try {   
            setLoading(true);
            setError(null);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getHomeAnnouncement`, {
                method: "GET",
                credentials: "include"
            });
            
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            console.log(data);
            setAnnouncement(data);
        } catch (error) {
            console.log("Error: ", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // LOADING STATE
    if (loading) {
        return (
            <div className="container-fluid" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
                <div className="container py-5">
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{background: '#ffffff'}}>
                                <div className="card-body text-center py-5">
                                    <div className="spinner-border text-danger mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="text-muted mb-0">Loading announcements...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ERROR STATE
    if (error) {
        return (
            <div className="container-fluid" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
                <div className="container py-5">
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{background: '#ffffff'}}>
                                <div className="card-body text-center py-5">
                                    <i className="fa fa-exclamation-circle fa-3x text-danger mb-3"></i>
                                    <h5 className="text-danger mb-2">Failed to Load Announcements</h5>
                                    <p className="text-muted mb-4">{error}</p>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={getAnnoucement}
                                    >
                                        <i className="fa fa-refresh me-2"></i>
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EMPTY/NO ANNOUNCEMENTS STATE
    if (annoucement.length === 0) {
        return (
            <div className="container-fluid" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
                <div className="container py-5">
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{background: '#ffffff'}}>
                                <div className="card-body text-center py-5">
                                    <i className="fa fa-bullhorn fa-3x mb-3" style={{color: '#9ca3af'}}></i>
                                    <h5 className="mb-2" style={{color: '#6b7280'}}>No Announcements Yet</h5>
                                    <p className="text-muted mb-0">Check back later for updates!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // SUCCESS - SHOW ANNOUNCEMENTS
    return (
        <div className="container-fluid py-5" style={{background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 position-relative" style={{background: '#ffffff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
                            <div className="card-body p-4 p-md-5 pb-5">
                                {/* Custom Navigation Buttons - Show only if more than 1 slide */}
                                {annoucement.length > 1 && (
                                    <>
                                        <div 
                                            ref={prevRef} 
                                            className="position-absolute top-50 translate-middle-y d-none d-md-flex justify-content-center align-items-center rounded-circle"
                                            style={{
                                                left: '-25px',
                                                width: '50px', 
                                                height: '50px', 
                                                cursor: 'pointer', 
                                                zIndex: 10,
                                                background: '#ffffff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                color: '#dc2626',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#dc2626';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.color = '#dc2626';
                                            }}
                                        >
                                            <i className="fa-solid fa-chevron-left"></i>
                                        </div>
                                        <div 
                                            ref={nextRef} 
                                            className="position-absolute top-50 translate-middle-y d-none d-md-flex justify-content-center align-items-center rounded-circle"
                                            style={{
                                                right: '-25px',
                                                width: '50px', 
                                                height: '50px', 
                                                cursor: 'pointer', 
                                                zIndex: 10,
                                                background: '#ffffff',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                color: '#dc2626',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#dc2626';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.color = '#dc2626';
                                            }}
                                        >
                                            <i className="fa-solid fa-chevron-right"></i>
                                        </div>
                                    </>
                                )}

                                <Swiper
                                    modules={[Navigation, Pagination]}
                                    spaceBetween={30}
                                    slidesPerView={1}
                                    navigation={annoucement.length > 1 ? {
                                            prevEl: prevRef.current,
                                            nextEl: nextRef.current,
                                        } : false
                                    }
                                    onBeforeInit={(swiper) => {
                                        if (annoucement.length > 1) {
                                            swiper.params.navigation.prevEl = prevRef.current;
                                            swiper.params.navigation.nextEl = nextRef.current;
                                        }
                                    }}
                                    pagination={annoucement.length > 1 ? { clickable: true } : false}
                                >
                                    {annoucement.map((slide, slideIndex) => (
                                        <SwiperSlide key={slideIndex}>
                                            <div className="mb-4">
                                                <h2 className="text-center fw-bold mb-3 fs-3 text-capitalize" 
                                                style={{color: '#dc2626', }}
                                                >
                                                    {slide.title}
                                                </h2>
                                                <p className="text-center mb-5 text-capitalize fs-5" 
                                                >
                                                    {slide.description}
                                                </p>
                                            </div>
                                            
                                            <div className="row g-3">
                                                {slide.files && slide.files.length > 0 ? (
                                                    slide.files.map((data, i) => (
                                                        <div key={i} className="col-6 col-md-4">
                                                            <div 
                                                                className="overflow-hidden rounded position-relative image-container" 
                                                                style={{
                                                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)', 
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => setSelectedImage(data.url)}
                                                            >
                                                                <img 
                                                                    src={data.url}
                                                                    alt={data.name} 
                                                                    className="img-fluid w-100"
                                                                    style={{
                                                                        aspectRatio: '4/3',
                                                                        objectFit: 'cover',
                                                                        transition: 'transform 0.3s ease'
                                                                    }}
                                                                    onError={(e) => {
                                                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                                    }}
                                                                />
                                                                <div 
                                                                    className="image-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        background: 'rgba(0,0,0,0.6)',
                                                                        opacity: 0,
                                                                        transition: 'opacity 0.3s ease',
                                                                        pointerEvents: 'none'
                                                                    }}
                                                                >
                                                                    <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                                                                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                                                        <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-12 text-center py-5">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" className="mb-3">
                                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                        </svg>
                                                        <p className="text-muted mb-0">No images attached</p>
                                                    </div>
                                                )}
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal/Lightbox */}
            {selectedImage && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                        background: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="position-absolute btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            top: '20px',
                            right: '20px',
                            width: '50px',
                            height: '50px',
                            zIndex: 10000
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <i className="fa fa-times fa-lg"></i>
                    </button>
                    <div 
                        className="position-relative"
                        style={{maxWidth: '90%', maxHeight: '90vh'}}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={selectedImage}
                            alt="Preview"
                            className="img-fluid rounded"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </div>
            )}

            <style>{`
                .image-container:hover img {
                    transform: scale(1.1);
                }
                
                .image-container:hover .image-overlay {
                    opacity: 1 !important;
                }

                @keyframes zoomIn {
                    from {
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .swiper-pagination {
                    position: relative !important;
                    bottom: auto !important;
                    margin-top: 30px;
                }
                
                .swiper-pagination-bullet {
                    background: #9ca3af;
                    opacity: 0.5;
                    width: 10px;
                    height: 10px;
                }
                .swiper-pagination-bullet-active {
                    background: #dc2626;
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}

export default Announcement;