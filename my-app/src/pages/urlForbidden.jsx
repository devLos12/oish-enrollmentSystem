import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { globalContext } from "../context/global";
import logo from "../assets/image/logo.png";



const UrlForbidden = () => {
    const navigate = useNavigate();
    const { role } = useContext(globalContext);



    return (
        <div className="d-flex  vh-100">
        <div className="container bg-light p-5">
            <div className="row py-5">
                <div className="col-12 col-md-6 ">
                    <p className="m-0 fw-bold fs-1 text-red">404</p>
                    <p className="m-0 text-capitalize fs-5">this site is forbidden. please go back to home page.</p>
                    <div className="d-flex align-items-center gap-2 cursor my-4 "
                    onClick={() => {
                        navigate(role ? `/${role}` : '/')
                    }}
                    >
                        <i className="fa fa-chevron-left text-danger"></i>
                        <p className="m-0 text-capitalize fw-bold text-danger">go back</p>
                    </div>
                </div>
                <div className="col-12 col-md-6 mt-5 mt-md-0  text-center">
                    <div className="row  justify-content-center">
                        <div className="col-4">
                            <img src={logo} alt={logo} className="img-fluid" />
                        </div>
                    </div>
                    <p className="m-0 mt-2 text-red fs-2 fw-bold text-capitalize">
                        fransisco osorio integrated senior high school
                    </p>
                </div>
            </div>
        </div>
        </div>

    )
}

export default UrlForbidden;