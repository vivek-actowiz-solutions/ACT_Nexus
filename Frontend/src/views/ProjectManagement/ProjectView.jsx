import React, { useEffect, useState } from 'react';
import { Row, Col, Badge, Spinner, Card, ListGroup, Button, Modal } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import { useNavigate, useParams } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import dayjs from 'dayjs';
import { FaCheckCircle, FaEdit, FaPlusCircle } from 'react-icons/fa';
import { FaRegUserCircle } from 'react-icons/fa';
import { api } from 'views/api';

/* ===== ICONS ===== */
import {
  FaIndustry,
  FaBuilding,
  FaTruck,
  FaFlag,
  FaCalendarAlt,
  FaLayerGroup,
  FaUsers,
  FaUserTie,
  FaUserCog,
  FaFileAlt,
  FaStickyNote,
  FaDownload
  
} from 'react-icons/fa';
import { RiDeleteBin5Line } from "react-icons/ri";
import { FaArrowRight } from 'react-icons/fa6';
import axios from 'axios';

const ProjectView = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectActivities, setProjectActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${api}/Project-list/${projectId}`, { withCredentials: true });
      const json = await res.data;
      setProject(json?.data || null);
      setProjectActivities(json?.projectActivities || []);
    } catch (err) {
      console.error('Project fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => (date ? dayjs(date).format('DD MMM YYYY') : '--');

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!project) return null;

  const {
    projectName,
    projectCode,
    status,
    industryType,
    department,
    deliveryType,
    projectPriority,
    deliveryMode,
    projectFrequency,
    sowDocument = [],
    inputDocument = [],
    annotationDocument = [],
    projectManager,
    projectTechManager,
    projectCoordinator,
    bde,
    teamLead,
    developers,
    createdBy,
    feedCount,
    createdAt
  } = project;
  const latestActivities = projectActivities.slice(0, 10);

  const getActivityIcon = (title) => {
    if (title.includes('Created')) return <FaPlusCircle className="text-success" />;
    if (title.includes('Updated')) return <FaEdit className="text-warning" />;
    if (title.includes('Deleted')) return <RiDeleteBin5Line className="text-danger" />;
    return <FaCheckCircle className="text-primary" />;
  };
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
              {log.actionTitle.includes('Feed created') && log.newData && (
                <div className="text-muted small">
                  New create Feed : <strong>{log.newData.FeedName}</strong>
                </div>
              )}
           
              {log.actionTitle.includes('Active Status Updated') && log.newData && (
                <div className="text-muted small">
                  {' '}
                  old status : <strong>{formatValue(log.oldData)}</strong> <FaArrowRight /> New status :{' '}
                  <strong>{formatValue(log.newData)}</strong>
                </div>
              )}
                 {log.actionTitle.includes('Project Status Updated') && log.newData && (
                <div className="text-muted small">
                  {' '}
                  old status : <strong>{log.oldData}</strong> <FaArrowRight /> New status : <strong>{log.newData}</strong>
                </div>
              )}
                 {log.actionTitle.includes('Feed Deleted') && log.oldData && (
                <div className="text-muted small">
                  {' '}
                  Feed have been deleted : <strong>{log.oldData}</strong> 
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
      {/* ===== HEADER ===== */}

      <MainCard
        title={
          <div>
            <h4 className=" mb-1 d-flex align-items-center gap-2" style={{ color: '#a9b7d0' }}>
              <FaLayerGroup />[{projectCode}] {projectName}
              <Badge bg="warning" text="dark" className="ms-2">
                <span style={{ fontSize: '13px' }}> {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}</span>
              </Badge>
            </h4>

            <small style={{ color: '#a9b7d0' }}>
              • Created By {createdBy?.name || '--'} on {formatDate(createdAt)}
            </small>
          </div>
        }
      >
        {/* ===== BASIC INFO ===== */}
        <Row className="g-1 mb-2">
          {[
            { label: 'Industry', value: industryType, icon: <FaIndustry /> },
            { label: 'Department', value: department, icon: <FaBuilding /> },
            { label: 'Delivery Type', value: deliveryType, icon: <FaTruck /> },
            {
              label: 'Priority',
              value: projectPriority,
              icon: <FaFlag />
            }
          ].map((item, idx) => (
            <Col md={3} sm={6} xs={6} key={idx}>
              <Card className={`h-100 ${item.highlight ? 'border border-danger' : ''} p-3 `}>
                <Card.Body className="p-1">
                  <small className="text-semibold d-flex align-items-center gap-1">
                    {item.icon}
                    {item.label}
                  </small>
                  <div className="fw-semibold small mt-1">{item.value || '--'}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== DELIVERY INFO ===== */}
        <Row className="g-2 mb-1">
          <Col xs={12} sm={6} md={3}>
            <Card style={{ minHeight: '120px' }} className="p-3">
              <Card.Body className="py-2 px-2">
                <small className="text-semibold d-flex align-items-center gap-2">
                  <FaRegUserCircle /> Project Manager
                </small>
                <h6 className="fw-bold mt-1 mb-0">{projectManager?.name || '--'}</h6>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card style={{ minHeight: '120px' }} className="p-3">
              <Card.Body className="py-2 px-2">
                <small className="text-semibold d-flex align-items-center gap-2">
                  <FaCalendarAlt /> Delivery Schedule
                </small>
                <h6 className="fw-bold mt-1 mb-0">{projectFrequency?.frequencyType || '--'}</h6>
                <small className="text-muted">
                  {projectFrequency?.frequencyType === 'Daily' && (
                    <small className="text-muted"> Every Day {projectFrequency?.deliveryTime}</small>
                  )}
                  {(projectFrequency?.frequencyType === 'Weekly' || projectFrequency?.frequencyType === 'Bi-Weekly') && (
                    <small className="text-muted">
                      {' '}
                      Every Week {projectFrequency?.deliveryDay} On {projectFrequency?.deliveryTime}
                    </small>
                  )}
                  {(projectFrequency?.frequencyType === 'Monthly' || projectFrequency?.frequencyType === 'Bi-Monthly') && (
                    <small className="text-muted">
                      Every Month {projectFrequency?.deliveryDate} {projectFrequency?.firstDate}th  & 
                     {" "} {projectFrequency?.secondDate}th On {projectFrequency?.deliveryTime}
                    </small>
                  )}
                  {(projectFrequency?.frequencyType === 'Custom' || projectFrequency?.frequencyType === 'Bi-Monthly') && (
                    <small className="text-muted">
                      {' '}
                      {projectFrequency?.deliveryDate} On {projectFrequency?.deliveryTime}
                    </small>
                  )}
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card style={{ minHeight: '120px' }} className="p-3">
              <Card.Body className="py-2 px-2">
                <small className="text-semibold d-flex align-items-center gap-2">
                  <FaTruck /> Delivery Mode
                </small>
                <h6 className="fw-bold mt-1 mb-0">{deliveryMode || '--'}</h6>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Card
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/Project-feeds/${projectId}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/Project-feeds/${projectId}`)}
              className=" clickable-card p-3"
              style={{
                minHeight: '120px',
                cursor: 'pointer'
              }}
            >
              <Card.Body className="py-2 px-2">
                <small className="text-semibold d-flex align-items-center gap-2">
                  <FaLayerGroup /> Total Feeds
                </small>
                <h6 className="fw-bold mt-1 mb-0">{feedCount ?? 0}</h6>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </MainCard>
      {/* ===== DOCUMENTS & TEAM ===== */}
      <Row className="g-3">
        {/* DOCUMENTS */}
        <Col md={8}>
          <MainCard title="Project Documents">
            {/* SOW Documents */}
            <div className="mb-4">
              <h6 className="fw-semibold mb-2">SOW Documents</h6>
              <ListGroup>
                {sowDocument.length ? (
                  sowDocument.map((doc, i) => (
                    <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <FaFileAlt />
                        <span>{doc.split('/').pop()}</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_FILES_URL}${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success"
                      >
                        <FaDownload />
                      </a>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-muted">No SOW documents</ListGroup.Item>
                )}
              </ListGroup>
            </div>

            {/* Annotation Documents */}
            <div className="mb-4">
              <h6 className="fw-semibold mb-2">Annotation Documents</h6>
              <ListGroup>
                {annotationDocument.length ? (
                  annotationDocument.map((doc, i) => (
                    <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <FaFileAlt />
                        <span>{doc.split('/').pop()}</span>
                      </div>
                      <a
                        h
                        href={`${import.meta.env.VITE_BACKEND_FILES_URL}${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success"
                      >
                        <FaDownload />
                      </a>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-muted">No Annotation documents</ListGroup.Item>
                )}
              </ListGroup>
            </div>

            {/* Input Documents */}
            <div>
              <h6 className="fw-semibold mb-2">Input Documents</h6>
              <ListGroup>
                {inputDocument.length ? (
                  inputDocument.map((doc, i) => (
                    <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <FaFileAlt />
                        <span>{doc.split('/').pop()}</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_FILES_URL}${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success"
                      >
                        <FaDownload />
                      </a>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-muted">No Input documents</ListGroup.Item>
                )}
              </ListGroup>
            </div>
          </MainCard>

          <Row className="g-3">
            <Col xs={12} md={12}>
              <MainCard
                title={
                  <span className="d-flex align-items-center gap-2">
                    <FaUsers /> Project Team
                  </span>
                }
              >
                {/* ===== PROJECT MANAGER ===== */}
                 {bde && (
                  <div className="mb-3 p-2 rounded border-start border-4 border-danger bg-light">
                    <h6 className="mb-2" style={{ color: '#6f42c1' }}>
                      Business  Development Executive
                    </h6>

                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center text-white"
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#dc3545',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {bde?.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <small className='fs-6 '>{bde.name}</small>
                      </div>
                    </div>
                  </div>
                )}
                {projectManager && (
                  <div className="mb-3 p-2 rounded border-start border-4 border-primary bg-light">
                    <h6 className="fw-bold text-primary mb-2">Project Manager</h6>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center text-white"
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#38cee6',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {projectManager?.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <small className='fs-6 '>{projectManager.name}</small>
                   
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== TECH MANAGER ===== */}
                {projectTechManager && (
                  <div className="mb-3 p-2 rounded border-start border-4 border-purple bg-light">
                    <h6 className="fw-bold mb-2" style={{ color: '#6f42c1' }}>
                      Technical Manager
                    </h6>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center text-white"
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#6f42c1',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {projectTechManager?.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <small className='fs-6 '>{projectTechManager.name}</small>
                      </div>
                    </div>
                  </div>
                )}
                {projectCoordinator && (
                  <div className="mb-3 p-2 rounded border-start border-4 border-success bg-light">
                    <h6 className="fw-bold mb-2" style={{ color: '#198754' }}>
                      Project Coordinator
                    </h6>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center text-white"
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#198754',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {projectCoordinator?.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <small className='fs-6 '>{projectCoordinator.name}</small>
                      </div>
                    </div>
                  </div>
                )}
               

                {/* ===== TEAM LEADS ===== */}
                {teamLead?.length > 0 && (
                  <div className="mb-3 p-2 rounded border-start border-4 border-info bg-light">
                    <h6 className="fw-bold text-info mb-2">Team Leads</h6>

                    <Row className="g-2">
                      {teamLead.map((tl, i) => (
                        <Col md={3} key={i}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex justify-content-center align-items-center text-white"
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: '#38cee6',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                              }}
                            >
                              {tl?.name?.charAt(0).toUpperCase() || 'B'}
                            </div>
                            <small className='fs-6'>{tl.name}</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* ===== DEVELOPERS ===== */}
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

                            <small className='fs-6 '>{dev.name}</small>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </MainCard>
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <MainCard title="📜 Project activity">
            <ActivityTimeline activities={latestActivities} />
            {projectActivities.length > 10 && (
              <Button variant="link" size="sm" onClick={() => setShowActivityModal(true)}>
                View All
              </Button>
            )}
          </MainCard>
        </Col>
      </Row>

      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>All Project Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <ActivityTimeline activities={projectActivities} />
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

export default ProjectView;
