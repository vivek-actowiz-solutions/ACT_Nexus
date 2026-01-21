import React, { useEffect, useState } from 'react';
import { Row, Col, Badge, Spinner, Card, ListGroup, Button, Modal } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';
import { api } from 'views/api';
import { FaArrowRight } from 'react-icons/fa6';
import { IoArrowBack } from 'react-icons/io5';
import DOMPurify from 'dompurify';
/* ===== ICONS ===== */
import {
  FaLayerGroup,
  FaCalendarAlt,
  FaUsers,
  FaUserTie,
  FaGlobe,
  FaClipboardList,
  FaStickyNote,
  FaCheckCircle,
  FaEdit,
  FaPlusCircle
} from 'react-icons/fa';
import { IoIosPersonAdd } from 'react-icons/io';
import { MdDescription } from 'react-icons/md';

const FeedView = () => {
  const { feedId: feedId } = useParams();
  const navigate = useNavigate();
  const [feed, setFeed] = useState(null);
  const [feedActivities, setFeedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line
  }, [feedId]);

  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${api}/feed-view/${feedId}`, { withCredentials: true });
      setFeed(res?.data?.data || null);
      setFeedActivities(res?.data?.feedActivities || []);
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => (date ? dayjs(date).format('DD MMM YYYY') : '--');

  const getActivityIcon = (title) => {
    if (title.includes('created')) return <FaPlusCircle className="text-success" />;
    if (title.includes('Updated')) return <FaEdit className="text-warning" />;
    if (title.includes('assigned')) return <IoIosPersonAdd className="text-info" />;
    return <FaCheckCircle className="text-primary" />;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!feed) return null;

  const {
    feedName,
    feedCode,
    status,
    platformName,
    platformType,
    scopeType,
    feedPriority,
    feedfrequency,
    developers = [],
    countries = [],
    description,
    createdBy,
    createdAt,
    frameworkType
  } = feed;
  const latestActivities = feedActivities.slice(0, 10);
  const ActivityTimeline = ({ activities }) => {
    if (!activities.length) {
      return <div className="text-muted text-center py-3">No activity found</div>;
    }

    return (
      <div className="position-relative">
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: 0,
            bottom: 0,
            width: '3px',
            background: '#dee2e6'
          }}
        />
        {activities.map((log) => (
          <div key={log._id} className="d-flex gap-3 mb-4">
            <div
              className="bg-white rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '26px',
                height: '26px',
                border: '2px solid #dee2e6',
                zIndex: 1
              }}
            >
              {getActivityIcon(log.actionTitle)}
            </div>

            <div>
              <div className="fw-semibold">{log.actionTitle}</div>

              {log.actionTitle.includes('Active Status Updated') && (
                <div className="text-muted small">
                  {' '}
                  old status : <strong>{formatValue(log.oldData)}</strong> <FaArrowRight /> New status :{' '}
                  <strong>{formatValue(log.newData)}</strong>
                </div>
              )}
              {log.actionTitle.includes('Feed Status Updated') && log.newData && (
                <div className="text-muted small">
                  {' '}
                  old status : <strong>{log.oldData}</strong> <FaArrowRight /> New status : <strong>{log.newData}</strong>
                </div>
              )}
              <div className="text-muted small">
                {log.ActionUserName} • {dayjs(log.createdAt).format('DD MMM YYYY, hh:mm A')}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const formatValue = (val) => {
    if (val === true) return 'Active';
    if (val === false) return 'Inactive';
    return val ?? '--';
  };
  return (
    <>
      <Row className="g-3">
        <Col md={8}>
          <MainCard
            title={
              <>
                <FaLayerGroup /> {''}
                {feedName}
              </>
            }
          >
            <Row className="g-1 mb-2">
              <Col md={6}>
                <Card className="h-100 p-3">
                  <Card.Body className="py-2 px-2">
                    <small className="text-semibold d-flex align-items-center gap-2">
                      <FaCalendarAlt /> Frequency
                    </small>
                    <h6 className="fw-bold mt-1 mb-0">{feedfrequency?.frequencyType || '--'}</h6>
                    <small className="text-muted">
                      {feedfrequency?.frequencyType === 'Daily' && (
                        <small className="text-muted"> Every Day •{feedfrequency?.deliveryTime}</small>
                      )}
                      {(feedfrequency?.frequencyType === 'Weekly' || feedfrequency?.frequencyType === 'Bi-Weekly') && (
                        <small className="text-muted">
                          {' '}
                          every Week {feedfrequency?.deliveryDay} • {feedfrequency?.deliveryTime}
                        </small>
                      )}
                      {(feedfrequency?.frequencyType === 'Monthly' || feedfrequency?.frequencyType === 'Bi-Monthly') && (
                        <small className="text-muted">
                          {' '}
                          every Month {feedfrequency?.deliveryDate}th {feedfrequency?.firstDate}th & {feedfrequency?.secondDate}th •{' '}
                          {feedfrequency?.deliveryTime}
                        </small>
                      )}
                      {feedfrequency?.frequencyType === 'Custom' && (
                        <small className="text-muted">
                          {' '}
                          {feedfrequency?.deliveryDate} • {feedfrequency?.deliveryTime}
                        </small>
                      )}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} sm={6} xs={6}>
                <Card className="h-100 p-3">
                  <Card.Body className="p-1">
                    <small className="text-semibold d-flex align-items-center gap-1">
                      <FaLayerGroup />
                      Platform Name
                    </small>
                    <div className="fw-semibold small mt-1">{platformName || '--'}</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="g-2 mb-1">
              <Col md={12}>
                <Card className="h-100 p-3 ">
                  <Card.Body className="p-2">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <MdDescription size={18} />
                      <h6 className="mb-0 fw-semibold">Description</h6>
                    </div>

                    <div
                      className=" p-3"
                      style={{
                        minHeight: '150px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      <div
                        className="ql-editor p-0"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(description)
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </MainCard>
        </Col>
        <Col md={4}>
          <MainCard title="Feed Details ">
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Feed Id :
              </Col>
              <Col md={8}>{feedCode || '--'}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Feed Name :
              </Col>
              <Col md={8}>{feedName}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Scope Type :
              </Col>
              <Col md={8}>{scopeType}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Feed Priority :
              </Col>
              <Col md={8}>{feedPriority}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                frameworkType :
              </Col>
              <Col md={8}>{frameworkType}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Platform Type :
              </Col>
              <Col md={8}>{platformType}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Region :
              </Col>
              <Col md={8}>{countries.map((c) => `${c.name} (${c.code})`).join(', ')}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Posted by :
              </Col>
              <Col md={8}>{createdBy.name}</Col>
            </Row>
            <Row className="py-2 border-bottom align-items-center">
              <Col md={4} className="text-dark fw-medium">
                Posted on :
              </Col>
              <Col md={8}>{formatDate(createdAt)}</Col>
            </Row>
          </MainCard>
        </Col>
      </Row>
      <Row className="g-3">
        <Col md={8}>
          <MainCard
            title={
              <span className="d-flex align-items-center gap-2">
                <FaUsers /> Assigned To
              </span>
            }
          >
            {developers?.length > 0 && (
              <div className="p-2 rounded border-start border-4 border-warning bg-light">
                <h6 className="fw-bold text-warning mb-2">Developers</h6>

                <Row className="g-2">
                  {developers.map((dev, i) => (
                    <Col md={3} key={i}>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex justify-content-center align-items-center text-white"
                          style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: '#ffc107',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          {dev?.name?.charAt(0).toUpperCase() || 'B'}
                        </div>

                        <small className="fs-6 fw-bold">{dev.name}</small>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </MainCard>
        </Col>

        {/* RIGHT */}
        <Col md={4}>
          <MainCard title="📜 History">
            <ActivityTimeline activities={latestActivities} />
            {feedActivities.length > 10 && (
              <Button variant="link" size="sm" onClick={() => setShowActivityModal(true)}>
                View All
              </Button>
            )}
          </MainCard>
        </Col>
      </Row>

      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>All Feed History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <ActivityTimeline activities={feedActivities} />
        </Modal.Body>
      </Modal>
      <div className="mt-3  d-flex justify-content-end align-items-center">
        <Button variant="dark" onClick={() => navigate(-1)}>
          <IoArrowBack /> Back
        </Button>
      </div>
    </>
  );
};

export default FeedView;
