import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../redux/store";

import { login } from "../redux/features/authSlice";
import logo from "../images/logo.png";
import appStore from "../images/app-store.png";
import googlePlay from "../images/google-play.png";
import Helmet from "../components/Helmet";
import FaceBookLogin from "../components/FaceBookLogin";

import "../styles/Login.css";

let schema = yup.object().shape({
  email: yup
    .string()
    .email("Email should be valid")
    .required("Email is Required"),
  password: yup.string().required("Password is Required"),
});

const Login: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      dispatch(login(values));
    },
  });

  const [typePass, setTypePass] = useState<boolean>(false);

  const { auth } = useSelector((state: RootState) => state);
  const { user, message } = auth;

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  //  useEffect hata diya! Ab state turant update hogi bina delay ke
  const isFormValid = 
    formik.values.email.length >= 1 && 
    formik.values.password.length >= 6 && 
    !formik.errors.email;

  return (
    <Helmet title="Login • intwit">
      <div className="login-page">
        <div className="main-login-page">
          <div className="phone-app-demo"></div>
          <div className="form-data-login">
            <form onSubmit={formik.handleSubmit}>
              <div className="logo">
                <img src={logo} alt="logo" />
              </div>

              <input
                type="Email"
                placeholder="Email"
                name="email"
                onChange={formik.handleChange("email")}
                value={formik.values.email}
              />
              {formik.errors.email && formik.values.email ? (
                <div className="error-text">
                  {formik.errors.email}
                </div>
              ) : null}

              {/*  Wapas div use kiya, aur input ka padding adjust kiya */}
              <div 
                className="pass" 
                style={{ position: "relative", display: "flex", alignItems: "center" }}
              >
                <input
                  className="input-password"
                  type={typePass ? "text" : "password"}
                  placeholder="Password"
                  onChange={formik.handleChange("password")}
                  value={formik.values.password}
                  name="password"
                  style={{ 
                    width: "100%", 
                    height: "100%",
                    border: "none", 
                    outline: "none", 
                    background: "transparent",
                    paddingRight: "50px" // Show button ke liye jagah chhodi
                  }}
                />
                <span 
                  style={{ 
                    cursor: "pointer", 
                    position: "absolute",
                    right: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    userSelect: "none",
                    zIndex: 10
                  }}
                  // 🔥 FIX 3: onClick ki jagah onMouseDown use kiya (Pehle click par 100% chalega)
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    setTypePass(!typePass);
                  }}
                >
                  {typePass ? "Hide" : "Show"}
                </span>
              </div>

              {/*   Button direct isFormValid variable se control hoga */}
              <button
                type="submit"
                className={`form-btn ${isFormValid ? "active-btn" : "pe-none"}`}
                disabled={!isFormValid}
              >
                <span>Log in</span>
              </button>

              <div className="has-separator">Or</div>
              
              <div className="facebook-login absolute-center">
                <FaceBookLogin title="Log in with Facebook" />
              </div>

              <div className="invalid-feedback">
                {message === "Rejected"
                  ? "Sorry, your password was incorrect. Please double-check your password."
                  : ""}
              </div>
              
              <Link className="password-reset" to="/forgot-password">
                Forgot password?
              </Link>
            </form>

            <div className="sign-up">
              Don't have an account?{" "}
              <Link to="/signup" className="sign-up-btn">
                Sign up
              </Link>
            </div>

            <div className="get-the-app">
              <span>Get the app.</span>
              <div className="badges">
                <img src={appStore} alt="app-store badge" />
                <img src={googlePlay} alt="google-play badge" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Helmet>
  );
};

export default Login;