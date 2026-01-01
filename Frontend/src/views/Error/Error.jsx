import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import loginbg from '../../assets/images/login-bg.jpg';

const ErrorPage = ({ code, message }) => {
  const navigate = useNavigate();
  const params = useParams();

  // Allow dynamic error (props > params > fallback)
  const errorCode = code || params.code || "404";
  const errorMessage =
    message ||
    (errorCode === "404"
      ? "The page you are looking for could not be found."
      : "Something went wrong. Please try again later.");

  return (


        <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center text-center text-white"
      style={{
        backgroundImage: `url(${loginbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <h1 className="display-1 fw-bold fs-9" style={{ color: "#3B02A9" }}>{errorCode}</h1>
          <h3 className="fw-semibold mb-3 text-dark">Oops! {errorMessage}</h3>
          <p className="text-dark mb-4">
            Please check the URL or go back to the homepage.
          </p>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Button variant="outline-dark" onClick={() => navigate(-1)}>
              🔙 Go Back
            </Button>
            <Button variant="outline-dark" onClick={() => navigate("/")}>
              🏠 Go Home
            </Button>
          </div>
        </Col>
      </Row>
    </Container>

  );
};

export default ErrorPage;
