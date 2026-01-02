import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { api } from 'views/api';

const statusVariantMap = (status) => {
  const map = {
    'New': 'primary',
    'Under Development': 'warning',
    'Crawl Running': 'info',
    'Crawl Finished': 'success',
    'Able to Recover': 'secondary',
    'Delayed': 'danger'
  };
  return map[status] || 'dark';
};

const ProjectFeedDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState(null);
  const [feeds, setFeeds] = useState(null);

  const fetchProjectFeedCount = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${api}/project-feed-count`, {
        withCredentials: true
      });

      if (res.data?.success) {
        setProjects(res.data.projects);
        setFeeds(res.data.feeds);
      }
    } catch (error) {
      console.error('Error fetching project-feed-count', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectFeedCount();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      {/* ================= TOTAL COUNTS ================= */}
      <Row className="mb-4">
        <Col md={6} sm={12}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              <h6 className="text-muted mb-1">Total Projects</h6>
              <h2 className="fw-bold text-primary">{projects?.total || 0}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} sm={12}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              <h6 className="text-muted mb-1">Total Feeds</h6>
              <h2 className="fw-bold text-success">{feeds?.total || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= PROJECT STATUS ================= */}
      <Row className="mb-4">
        <Col xs={12}>
          <h5 className="mb-3">Project Status Overview</h5>
        </Col>

        {projects?.statusWiseCount?.map((item, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{item.status}</div>
                  <small className="text-muted">Projects</small>
                </div>
                <Badge bg={statusVariantMap(item.status)} pill className="fs-6">
                  {item.count}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ================= FEED STATUS ================= */}
      <Row>
        <Col xs={12}>
          <h5 className="mb-3">Feed Status Overview</h5>
        </Col>

        {feeds?.statusWiseCount?.map((item, index) => (
          <Col key={index} xs={12} sm={6} md={4} lg={3}>
            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{item.status}</div>
                  <small className="text-muted">Feeds</small>
                </div>
                <Badge bg={statusVariantMap(item.status)} pill className="fs-6">
                  {item.count}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default ProjectFeedDashboard;
