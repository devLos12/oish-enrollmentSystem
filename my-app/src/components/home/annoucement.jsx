import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


const Announcement = () => {
    const [annoucement, setAnnouncement] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ ADD LOADING STATE
    const [error, setError] = useState(null); // ✅ ADD ERROR STATE
    const prevRef = useRef();
    const nextRef = useRef();

    useEffect(() => {
        getAnnoucement();
    }, []);

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
            setLoading(false); // ✅ STOP LOADING
        }
    }

    // ✅ LOADING STATE
    if (loading) {
        return (
            <div className="container-fluid bg-white">
                <div className="container my-5">
                    <div className="row py-4">
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-danger" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted mt-3">Loading announcements...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ ERROR STATE
    if (error) {
        return (
            <div className="container-fluid bg-white">
                <div className="container my-5">
                    <div className="row py-4">
                        <div className="col-12 text-center py-5">
                            <i className="fa fa-exclamation-circle fa-3x text-danger mb-3"></i>
                            <h5 className="text-danger">Failed to Load Announcements</h5>
                            <p className="text-muted">{error}</p>
                            <button 
                                className="btn btn-danger btn-sm mt-2"
                                onClick={getAnnoucement}
                            >
                                <i className="fa fa-refresh me-2"></i>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ EMPTY/NO ANNOUNCEMENTS STATE
    if (annoucement.length === 0) {
        return (
            <div className="container-fluid bg-white">
                <div className="container my-5">
                    <div className="row py-4">
                        <div className="col-12 text-center py-5">
                            <i className="fa fa-bullhorn fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No Announcements Yet</h5>
                            <p className="text-muted">Check back later for updates!</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ SUCCESS - SHOW ANNOUNCEMENTS
    return (
        <div className="container-fluid bg-white">
            <div className="container my-5">
                <div className="row py-4 position-relative">
                    {/* Custom Navigation Buttons - Show only if more than 1 slide */}
                    {annoucement.length > 1 && ( // ✅ CONDITIONAL RENDERING
                        <>
                            <div 
                                ref={prevRef} 
                                className="position-absolute top-50 start-0 translate-middle-y bg-white text-danger rounded-circle d-md-flex justify-content-center align-items-center d-none shadow"
                                style={{width: '50px', height: '50px', cursor: 'pointer', zIndex: 10}}
                            >
                                <i className="fa-solid fa-chevron-left fs-4"></i>
                            </div>
                            <div 
                                ref={nextRef} 
                                className="position-absolute top-50 end-0 translate-middle-y bg-white text-danger rounded-circle d-md-flex justify-content-center align-items-center d-none shadow"
                                style={{width: '50px', height: '50px', cursor: 'pointer', zIndex: 10}}
                            >
                                <i className="fa-solid fa-chevron-right fs-4"></i>
                            </div>
                        </>
                    )}

                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={annoucement.length > 1 ? { // ✅ DISABLE NAVIGATION IF ONLY 1 SLIDE
                                prevEl: prevRef.current,
                                nextEl: nextRef.current,
                            } : false
                        }
                        onBeforeInit={(swiper) => {
                            if (annoucement.length > 1) { // ✅ ONLY INIT IF MORE THAN 1
                                swiper.params.navigation.prevEl = prevRef.current;
                                swiper.params.navigation.nextEl = nextRef.current;
                            }
                        }}
                        pagination={annoucement.length > 1 ? { clickable: true } : false} // ✅ HIDE PAGINATION DOTS TOO
                    >
                        {annoucement.map((slide, slideIndex) => (
                            <SwiperSlide key={slideIndex}>
                                <p className="m-0 text-center text-capitalize fw-bold text-danger fs-3 pb-3 ">{slide.title}</p>
                                <p className="m-0 text-center text-capitalize fw-semibold pb-5">{slide.description}</p>
                                <div className="row g-2">
                                    {slide.files && slide.files.length > 0 ? (
                                        slide.files.map((data, i) => (
                                            <div key={i} className="col-6 col-md-4 ">
                                                <div className="overflow-hidden h-100 d-flex align-items-center bg-danger rounded">
                                                    <img 
                                                        src={data.url}
                                                        alt={data.name} 
                                                        className="img-fluid w-100"
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-12 text-center py-3">
                                            <p className="text-muted">No images attached</p>
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </div>
    );
}

export default Announcement;