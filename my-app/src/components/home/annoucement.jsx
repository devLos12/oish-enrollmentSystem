import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import image1 from "../../assets/image/image1.jpeg";
import image2 from "../../assets/image/image2.jpeg";
import image3 from "../../assets/image/image3.jpeg";

const Announcement = () => {
    const [annoucement, setAnnouncement] = useState([]);
    const prevRef = useRef();
    const nextRef = useRef();



    
    useEffect(() => {
        getAnnoucement();
    }, []);

    const getAnnoucement = async() => {
        try {   
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
        }
    }


    return (
        <div className="container-fluid bg-white">
            <div className="container my-5">
                <div className="row py-4 position-relative">
                    {/* Custom Navigation Buttons */}
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


                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={{
                                prevEl: prevRef.current,
                                nextEl: nextRef.current,
                            }
                        }
                         onBeforeInit={(swiper) => {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                        }}
                        pagination={{ clickable: true,  }}
                    >
                        {annoucement.map((slide, slideIndex) => (
                            <SwiperSlide key={slideIndex}>
                                <p className="m-0 text-center text-capitalize fw-bold text-danger fs-3 pb-3 ">{slide.title}</p>
                                <p className="m-0 text-center text-capitalize fw-semibold pb-5">{slide.description}</p>
                                <div className="row g-2">
                                    {slide.files.map((data, i) => (
                                        <div key={i} className="col-6 col-md-4 ">
                                            <div className="overflow-hidden h-100 d-flex align-items-center bg-danger rounded">
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL}/api${data.url}`} 
                                                    alt={data.name} 
                                                  className="img-fluid w-100"
                                                />
                                            </div>
                                        </div>
                                    ))}
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