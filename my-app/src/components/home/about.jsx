import React from "react";
import banner from "../../assets/image/banner.jpg"


const About = () => {

    return (
        <div className="container-fluid " 
        >
            <div className="container my-5">
                <div className="row  g-0 justify-content-center gap-3">
                    <div className="col-12 col-md-5 text-center rounded-4 p-4 bg-light shadow">
                        <p className="fs-3 text-uppercase fw-bold text-danger">vision</p>

                        <p className="m-0 text-capitalize">We dream of Filipinos who passionately
                            love their country and whose values 
                            and competencies enable them 
                            to realize their full potential and
                            contribute meaningfully to building
                            the nation. 

                            As a learner-centered public institution,
                            the Department of Education 
                            continuously improves itself to
                            better serve its stakeholders. 
                        </p>
                    </div>
                    <div className="col-12 col-md-5  text-center  rounded-4 p-4 bg-light shadow">
                        <p className="fs-3 text-uppercase fw-bold text-danger">Mission</p>

                        <p className="text-capitalize m-0">To protect and promote the right of every Filipino to quality,
                        equitable, culture-based, and complete basic education where: 

                        Students learn in a child-friendly, gender-sensitive, safe, and  
                        motivating environment 


                        Teachers facilitate learning and constantly nurture every learner. 

                        Administrators and staff, as stewards of the institution, ensure an
                        enabling and supportive environment for effective learning to happen. 

                        Family, community, and other stakeholders are actively engaged a
                        nd share responsibility for developing life-long learners. 

                        </p>

                    </div>
                    <div className="col-12 col-md-5  text-center rounded-4 p-4 bg-light shadow">
                        <p className="fs-3 text-uppercase fw-bold text-danger">our core values</p>

                        <p className="m-0 text-capitalize d-flex flex-column">
                            <span>Makadiyos</span>
                            <span>Makatao</span>
                            <span>Makakalikasan</span>
                            <span>Makabansa</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )

}
export default About;