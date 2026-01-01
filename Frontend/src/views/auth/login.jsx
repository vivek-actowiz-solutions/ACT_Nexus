import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Card, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer as ToastifyContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import loginSVG from '../../../public/login-svg.svg';
import { useNavigate } from 'react-router-dom';
import loginbg from '../../assets/images/login-bg.jpg';
import { api } from '../api';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(`${api}/login`, formData, {
        withCredentials: true
      });

      if (res.status === 200) {
        toast.success(res.data.Message || 'Login successful');
        setFormData({ email: '', password: '' });
        setLoading(false);
        if (res.data.Rolelevel === 7) {
          setTimeout(() => {
            navigate('/naver');
            window.location.reload();
          }, 500);
        } else {
          setTimeout(() => {
            navigate('/dashboard');
            window.location.reload();
          }, 500);
        }
      }
    } catch (err) {
      const message = err.response?.data?.Message || 'Login failed!';
      toast.error(message);
      setLoading(false);
    } finally {
      // ✅ This ensures loading is stopped in both success and error cases
    }
  };
  console.log('permission login', permission);
  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center " // bg adapts to theme
      style={{
        backgroundImage: `url(${loginbg})`, // <-- your image path
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ToastifyContainer position="top-right" autoClose={3000} />

      <Card className="p-3 border-0 shadow-none" style={{ maxWidth: '900px', width: '100%' }}>
        <Row className="g-0">
          {/* Left Side - Illustration */}
          <Col
            md={6}
            className="d-none d-md-flex flex-column align-items-center justify-content-center p-1"
            style={{ backgroundColor: 'var(--bs-light-bg-subtle)' }}
          >
            <img src={loginSVG} alt="Login Visual" className="img-fluid mb-3" />
            <small
              style={{
                fontSize: '0.85rem',
                color: '#6c757d', // muted gray text
                marginTop: '10px'
              }}
            >
              Powered by{' '}
              <a
                href="https://www.actowizsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6f42c1', fontWeight: '600', textDecoration: 'none' }}
              >
                Actowiz Solutions
              </a>
            </small>
          </Col>

          {/* Right Side - Login Form */}
          <Col md={6} className="d-flex align-items-center justify-content-center p-4">
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <h2 className="mb-4 fw-semibold">Welcome Back</h2>
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleInputChange}
                      isInvalid={!!errors.password}
                    />
                    <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                      {showPassword ?  <FaEye />:  <FaEyeSlash />}
                    </InputGroup.Text>
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <div className="d-flex justify-content-between mb-3 small">
                  <Form.Check type="checkbox" label="Remember me" />
                  {/* Forgot password link could go here */}
                </div>

                <Button style={{ backgroundColor: '#3B02AA' }} type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" /> Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default LoginPage;

// import React, { useState } from 'react';
// import {
//   Container,
//   Row,
//   Col,
//   Form,
//   Button,
//   Spinner,
//   Card,
//   InputGroup
// } from 'react-bootstrap';
// import { ToastContainer as ToastifyContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import axios from 'axios';
// import loginSVG from '../../../public/login-svg.svg';
// import { useNavigate } from 'react-router-dom';
// import loginbg from '../../assets/images/login-bg.jpg';
// import { api } from '../api';

// const LoginPage = () => {
//   const [step, setStep] = useState("email"); // "email" → "otp"
//   const [formData, setFormData] = useState({ email: '', otp: '' });
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Validate email
//   const validateEmail = () => {
//     const newErrors = {};
//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'Email is invalid';
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Validate OTP
//   const validateOtp = () => {
//     const newErrors = {};
//     if (!formData.otp.trim()) {
//       newErrors.otp = 'OTP is required';
//     } else if (formData.otp.length !== 6) {
//       newErrors.otp = 'OTP must be 6 digits';
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setErrors({ ...errors, [e.target.name]: '' });
//   };

//   // Step 1: Send OTP
//   const handleSendOtp = async (e) => {
//     e.preventDefault();
//     if (!validateEmail()) return;

//     setLoading(true);
//     try {
//       const res = await axios.post(`${api}/send-otp`, { email: formData.email });
//       if (res.status === 200) {
//         toast.success(res.data.Message || 'OTP sent to your email');
//         setStep("otp");
//       }
//     } catch (err) {
//       const message = err.response?.data?.Message || 'Failed to send OTP';
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Step 2: Verify OTP
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     if (!validateOtp()) return;

//     setLoading(true);
//     try {
//       const res = await axios.post(`${api}/verify-otp`, {
//         email: formData.email,
//         otp: formData.otp
//       });

//       if (res.status === 200) {
//         toast.success(res.data.Message || 'Login successful');
//         setFormData({ email: '', otp: '' });
//         setTimeout(() => {
//           navigate('/dashboard');
//           window.location.reload();
//         }, 500);
//       }
//     } catch (err) {
//       const message = err.response?.data?.Message || 'Invalid OTP';
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container
//       fluid
//       className="vh-100 d-flex align-items-center justify-content-center"
//       style={{
//         backgroundImage: `url(${loginbg})`,
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         backgroundRepeat: 'no-repeat'
//       }}
//     >
//       <ToastifyContainer position="top-right" autoClose={3000} />

//       <Card className="p-3 border-0 shadow-none" style={{ maxWidth: '900px', width: '100%' }}>
//         <Row className="g-0">
//           {/* Left Side */}
//           <Col
//             md={6}
//             className="d-none d-md-flex flex-column align-items-center justify-content-center p-1"
//             style={{ backgroundColor: 'var(--bs-light-bg-subtle)' }}
//           >
//             <img src={loginSVG} alt="Login Visual" className="img-fluid mb-3" />
//             <small
//               style={{
//                 fontSize: '0.85rem',
//                 color: '#6c757d',
//                 marginTop: '10px'
//               }}
//             >
//               Powered by{' '}
//               <a
//                 href="https://www.actowizsolutions.com"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{ color: '#6f42c1', fontWeight: '600', textDecoration: 'none' }}
//               >
//                 Actowiz Solutions
//               </a>
//             </small>
//           </Col>

//           {/* Right Side */}
//           <Col md={6} className="d-flex align-items-center justify-content-center p-4">
//             <div style={{ width: '100%', maxWidth: '400px' }}>
//               <h2 className="mb-4 fw-semibold">OTP Login</h2>

//               {step === "email" && (
//                 <Form onSubmit={handleSendOtp} noValidate>
//                   <Form.Group className="mb-3" controlId="formEmail">
//                     <Form.Label>Email address</Form.Label>
//                     <Form.Control
//                       type="email"
//                       name="email"
//                       placeholder="Enter email"
//                       value={formData.email}
//                       onChange={handleInputChange}
//                       isInvalid={!!errors.email}
//                     />
//                     <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
//                   </Form.Group>

//                   <Button
//                     style={{ backgroundColor: '#3B02AA' }}
//                     type="submit"
//                     className="w-100"
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <Spinner animation="border" size="sm" className="me-2" /> Sending OTP...
//                       </>
//                     ) : (
//                       'Send OTP'
//                     )}
//                   </Button>
//                 </Form>
//               )}

//               {step === "otp" && (
//                 <Form onSubmit={handleVerifyOtp} noValidate>
//                   <Form.Group className="mb-3" controlId="formOtp">
//                     <Form.Label>Enter OTP</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="otp"
//                       placeholder="Enter 6-digit OTP"
//                       value={formData.otp}
//                       onChange={handleInputChange}
//                       isInvalid={!!errors.otp}
//                       maxLength={6}
//                     />
//                     <Form.Control.Feedback type="invalid">{errors.otp}</Form.Control.Feedback>
//                   </Form.Group>

//                   <Button
//                     style={{ backgroundColor: '#3B02AA' }}
//                     type="submit"
//                     className="w-100"
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <Spinner animation="border" size="sm" className="me-2" /> Verifying...
//                       </>
//                     ) : (
//                       'Verify OTP'
//                     )}
//                   </Button>

//                   <div className="text-center mt-3">
//                     <Button
//                       variant="link"
//                       className="p-0"
//                       onClick={() => setStep("email")}
//                     >
//                       Resend OTP
//                     </Button>
//                   </div>
//                 </Form>
//               )}
//             </div>
//           </Col>
//         </Row>
//       </Card>
//     </Container>
//   );
// };

// export default LoginPage;
