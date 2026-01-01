import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { ToastContainer as ToastifyContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import signupSVG from '../../../public/Sign up-bro.svg'; // You can use the same or another SVG
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

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

    try {
      const res = await axios.post('http://172.28.171.87:5000/api/signup', formData);
      toast.success('Signup successful!');
      console.log('Response:', res.data);

      // Redirect to login after successful signup
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const message = err.response?.data?.msg || 'Signup failed!';
      toast.error(message);
    }
  };

  return (
    <Container fluid className="vh-100">
      <ToastifyContainer position="top-right" autoClose={3000} />
      <Row className="h-100">
        {/* Left Side - Signup Form */}
        <Col md={6} className="d-flex align-items-center justify-content-center bg-white">
          <div style={{ width: '80%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '30px', fontWeight: '600' }}>Create Account</h2>
            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3" controlId="formName">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

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
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                  isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100" style={{ backgroundColor: '#6f42c1', border: 'none' }}>
                Sign Up
              </Button>

              <div className="text-center mt-3" style={{ fontSize: '0.9rem', color: '#555' }}>
                Already have an account?{' '}
                <a href="/API-management/login" style={{ color: '#6f42c1' }}>
                  Sign in
                </a>
              </div>
            </Form>
          </div>
        </Col>

        {/* Right Side - Illustration */}
        <Col md={6} className="d-none d-md-flex align-items-center justify-content-center" style={{ backgroundColor: '#f3f0ff' }}>
          <img src={signupSVG} alt="Signup Visual" className="img-fluid" style={{ maxHeight: '70%' }} />
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;
