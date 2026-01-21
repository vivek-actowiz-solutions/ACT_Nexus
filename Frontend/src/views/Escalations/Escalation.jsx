import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Modal, Spinner, Badge, Tab, Tabs, Card } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import axios from 'axios';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import { api } from 'views/api';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TextField from '@mui/material/TextField';
import { data } from 'jquery';
import { useRef } from 'react';
import { sl } from 'date-fns/locale';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';

const ITEMS_PER_PAGE = 10;

const EscalationList = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('rca');
  /* ================= STATES ================= */
  const [escalation, setEscalation] = useState({
    title: '',
    description: '',
    department: '',
    priority: '',
    // Severity: '',
    assignTo: '',
    assignToName: '',
    watchers: [],
    project: '',
    feed: '',
    SLADate: null,
    status: 'Open'
  });
  const [closeData, setCloseData] = useState({
    rootCauseCategory: '',
    rcaMethod: '',
    rcaDescription: '',

    correctiveActionDescription: '',
    actionType: '',
    actionOwner: '',
    dateImplemented: null,
    fixVerificationMethod: '',

    preventiveActionDescription: '',
    preventiveActionType: '',
    preventiveActionOwner: '',
    targetCompletionDate: null,
    preventiveActionStatus: '',
    slaBreachReason: ''
  });
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [watchers, setwatchers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [permission, setPermission] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [history, setHistory] = useState([]);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  /* ================= STATIC OPTIONS ================= */
  const departmentOptions = [
    { value: 'Sales', label: 'Sales' },
    { value: 'Development', label: 'Development' },
    { value: 'Client Success', label: 'Client Success' },
    { value: 'R&D', label: 'R&D' }
  ];

  const priorityOptions = [
    { value: 'P0 - Immediate', label: 'P0 - Immediate' },
    { value: 'P1 - High', label: 'P1 - High' },
    { value: 'P2 - Medium', label: 'P2 - Medium' },
    { value: 'P3 - Low', label: 'P3 - Low' }
  ];
  // const SeverityOptions = [
  //   { value: 'Critical', label: 'Critical' },
  //   { value: 'High', label: 'High' },
  //   { value: 'Medium', label: 'Medium' },
  //   { value: 'Low', label: 'Low' }
  // ];

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'ReEscalation', label: 'Re-Escalation' },
    { value: 'Closed', label: 'Closed' }
  ];
  const rootCauseOptions = [
    'Process Gap',
    'Human Error',
    'Technical Bug',
    'Design Limitation',
    'Dependency Failure',
    'Resource Constraint',
    'Communication Gap',
    'External Dependency',
    'Unknown (Require Justification)'
  ].map((v) => ({ label: v, value: v }));

  const rcaMethodOptions = ['5 Whys', 'Fishbone (Ishikawa)', 'Timeline Analysis', 'Brainstorming', 'N/A'].map((v) => ({
    label: v,
    value: v
  }));

  const actionTypeOptions = [
    'Code Fix',
    'Configuration Change',
    'Data Correction',
    'Manual Intervention',
    'Restart / Re-run Job',
    'Rollback',
    'Temporary Workaround'
  ].map((v) => ({ label: v, value: v }));

  const verificationMethodOptions = [
    'Manual Validation',
    'Automated Test',
    'Monitoring Check',
    'Client Confirmation',
    'Log Verification'
  ].map((v) => ({ label: v, value: v }));

  const preventiveActionTypeOptions = [
    'Process Improvement',
    'Automation Enhancement',
    'Monitoring / Alert Setup',
    'Documentation Update',
    'Training / Knowledge Sharing',
    'Architecture Change'
  ].map((v) => ({ label: v, value: v }));

  const preventiveStatusOptions = ['Planned', 'In Progress', 'Completed'].map((v) => ({ label: v, value: v }));
  /* ================= API ================= */
  const fetchUsers = async (projectId) => {
    const res = await axios.get(`${api}/Escalation-users/${projectId}`, { withCredentials: true });
    setUsers(res.data.data || []);
  };
  const fetchwatchers = async (projectId) => {
    const res = await axios.get(`${api}/Escalation-users/${projectId}?isAdmin=true`, { withCredentials: true });
    setwatchers(res.data.data || []);
  };

  const fetchProjects = async () => {
    const res = await axios.get(`${api}/Escalation-projects`, { withCredentials: true });
    setProjects(res.data.data || []);
    setPermission(res.data.permission);
    setUserId(res.data.userId);
  };

  const fetchFeeds = async (projectId) => {
    try {
      const res = await axios.get(`${api}/Escalation-feeds/${projectId}`, { withCredentials: true });
      setFeeds(res.data.data || []);
    } catch {
      toast.error('Failed to fetch feeds');
    }
  };

  const fetchEscalations = async (pageNo = 1, reset = false) => {
    try {
      setLoading(true);

      const res = await axios.get(`${api}/get-escalations`, {
        withCredentials: true,
        params: {
          page: pageNo,
          limit: ITEMS_PER_PAGE,
          search,
          status: statusFilter,
          department: departmentFilter
        }
      });

      const newData = res.data.data || [];

      setEscalations((prev) => (reset ? newData : [...prev, ...newData]));

      // 🚨 HARD STOP
      if (newData.length < ITEMS_PER_PAGE) {
        hasMoreRef.current = false;
      } else {
        pageRef.current = pageNo;
      }
    } catch {
      toast.error('Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEscalations(1, true);
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchEscalations(1, true);
  }, [search, statusFilter, departmentFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const validPattern = /^[a-zA-Z0-9()_ ]*$/;
    if (name === 'title') {
      if (!validPattern.test(value)) return;
    }
    setEscalation((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  const handleSelect = (name, value) => {
    setEscalation((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  const validateEscalation = (data) => {
    const errors = {};

    if (!data.title?.trim()) errors.title = 'Title is required';

    if (!data.department) errors.department = 'Department is required';
    if (!data.description) errors.description = 'Description is required';
    if (!data.SLADate) errors.SLADate = 'SLA Date is required';
    if (!data.watchers || data.watchers.length === 0) errors.watchers = 'At least one watcher is required';

    if (!data.priority) errors.priority = 'Priority is required';

    if (!data.assignTo) errors.assignTo = 'Assign To is required';

    if (!data.project) errors.project = 'Project is required';

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEscalation(escalation)) return;

    setLoading(true);
    try {
      const res = await axios.post(`${api}/create-escalation`, escalation, { withCredentials: true });
      if (res.status === 201) {
        toast.success('Escalation created');
        setShowModal(false);
        fetchEscalations(1, true);
        resetForm();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  // Sync selectedEscalation with updated list
  useEffect(() => {
    if (escalations.length > 0) {
      if (selectedEscalation) {
        const found = escalations.find((e) => e._id === selectedEscalation._id);
        if (found) {
          setSelectedEscalation(found);
        } else {
          setSelectedEscalation(escalations[0]);
        }
      } else {
        setSelectedEscalation(escalations[0]);
      }
    } else {
      setSelectedEscalation(null);
    }
  }, [escalations]);

  const validateCloseData = (data) => {
    const errors = {};

    if (!data.rootCauseCategory) errors.rootCauseCategory = 'Root Cause Category is required';

    if (!data.rcaMethod) errors.rcaMethod = 'RCA Method is required';

    if (!data.rcaDescription) errors.rcaDescription = 'RCA Description is required';

    if (!data.correctiveActionDescription) errors.correctiveActionDescription = 'Corrective Action Description is required';

    if (!data.actionType) errors.actionType = 'Action Type is required';

    if (!data.actionOwner) errors.actionOwner = 'Action Owner is required';

    if (!data.dateImplemented) errors.dateImplemented = 'Date Implemented is required';

    if (!data.fixVerificationMethod) errors.fixVerificationMethod = 'Fix Verification Method is required';

    if (!data.preventiveActionStatus) errors.preventiveActionStatus = 'Preventive Action Status is required';

    if (!data.preventiveActionType) errors.preventiveActionType = 'Preventive Action Type is required';

    if (!data.preventiveActionDescription) errors.preventiveActionDescription = 'Preventive Action Description is required';

    if (!data.preventiveActionOwner) errors.preventiveActionOwner = 'Preventive Action Owner is required';

    if (!data.targetCompletionDate) errors.targetCompletionDate = 'Target Completion Date is required';

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleCloseEscalation = async (e) => {
    e.preventDefault();

    if (!validateCloseData(closeData)) return;

    try {
      setLoading(true);

      await axios.post(`${api}/close-escalation/${selectedEscalation._id}`, closeData, { withCredentials: true });

      toast.success('Escalation closed successfully');
      setShowClosedModal(false);
      fetchEscalations(1, true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close escalation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEscalation({
      title: '',
      description: '',
      department: '',
      priority: '',
      // Severity: '',
      assignTo: '',
      watchers: [],
      project: '',
      feed: '',
      SLADate: null,
      status: 'Open'
    });
    setFeeds([]);
    setErrors({});
  };
  const handleDepartmentChange = (e) => {
    const departmentValue = e ? e.value : null;
    console.log('depamne', departmentValue);
    setEscalation((prev) => ({
      ...prev,
      department: departmentValue,
      assignTo: '',
      assignToName: ''
    }));
    setErrors((prev) => ({ ...prev, department: '' }));
  };
  const handleCloseEscalationModel = (escalation) => {
    setSelectedEscalation(escalation);
    setShowClosedModal(true);
    setActiveTab('rca');
    fetchUsers(escalation.project._id);
  };

  const handleEscalationDetails = (escalation) => {
    setSelectedEscalation(escalation); // Ensure it's selected
    setShowDetailsModal(true);
  };
  const formatDateTime = (date) => {
    if (!date) return 'N/A';

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const time = d.toLocaleTimeString();

    return `${year}-${month}-${day}, ${time}`;
  };

  const calculateResolutionTime = (start, end) => {
    if (!start || !end) return 'N/A';

    const diffMs = new Date(end) - new Date(start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return `${hours}h ${minutes}m`;
  };

  const handleChangeCloseModalcancel = () => {
    setShowClosedModal(false);
    setCloseData({
      rootCauseCategory: '',
      rcaMethod: '',
      rcaDescription: '',
      correctiveActionDescription: '',
      actionType: '',
      actionOwner: '',
      dateImplemented: '',
      fixVerificationMethod: '',
      preventiveActionDescription: '',
      preventiveActionType: '',
      preventiveActionOwner: '',
      targetCompletionDate: '',
      preventiveActionStatus: '',
      slaBreachReason: ''
    });
    setErrors({});
  };
  const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'min', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  };

  const truncateQuillHTML = (html = '', limit = 120) => {
    const cleanHTML = DOMPurify.sanitize(html);

    // Convert HTML to plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHTML;

    const text = tempDiv.textContent || tempDiv.innerText || '';

    if (text.length <= limit) return text;

    return text.substring(0, limit).trim() + '...';
  };
  return (
    <>
      <ToastContainer />

      <MainCard title="Escalations">
        {/* ===== Filters ===== */}
        <Row className="mb-3 align-items-center">
          <Col md={4}>
            <Form.Control placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Col>
          <Col md={2}>
            <Select
              placeholder="Status"
              isClearable
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === statusFilter) || null}
              onChange={(e) => setStatusFilter(e?.value || '')}
            />
          </Col>
          <Col md={2}>
            <Select
              placeholder="Department"
              isClearable
              options={departmentOptions}
              value={departmentOptions.find((opt) => opt.value === departmentFilter) || null}
              onChange={(e) => setDepartmentFilter(e?.value || '')}
            />
          </Col>
          <Col md={2}>
            <Button
              variant="outline-dark"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDepartmentFilter('');
              }}
              className="w-100"
            >
              Clear All
            </Button>
          </Col>
          <Col md={2} className="text-end">
            <Button variant="dark" onClick={() => setShowModal(true)}>
              Create Escalation
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : (
          <div>
            <Row>
              <Col xs={12} md={12} lg={7}>
                <div
                  style={{
                    maxHeight: '100vh',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}
                  onScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.target;

                    if (scrollTop + clientHeight >= scrollHeight - 20 && hasMoreRef.current && !loading) {
                      fetchEscalations(pageRef.current + 1);
                    }
                  }}
                >
                  {escalations.map((e) => (
                    <Card
                      key={e._id}
                      className="mb-4 shadow-sm escalation-card"
                      onClick={() => setSelectedEscalation(e)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedEscalation?._id === e._id ? '#dfe9f3' : '#ffffff',
                        borderRadius: '10px',
                        borderLeft: `4px solid ${
                          e.priority === 'P1 - High' ? '#dc3545' : e.priority === 'P2 - Medium' ? '#fd7e14' : '#0d6efd'
                        }`
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-start">
                          {/* ICON */}
                          <div className="me-3 mt-1">
                            <i
                              className={`bi ${
                                e.priority === 'P1 - High'
                                  ? 'bi-exclamation-triangle-fill text-danger'
                                  : e.priority === 'P2 - Medium'
                                    ? 'bi-exclamation-circle-fill text-warning'
                                    : 'bi-info-circle-fill text-primary'
                              }`}
                              style={{ fontSize: '18px' }}
                            />
                          </div>

                          {/* CONTENT */}
                          <div className="flex-grow-1 overflow-hidden">
                            {/* Title + Badges */}
                            <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
                              <h6 className="fw-bold mb-0 text-truncate" title={e.title}>
                                {e.title}
                              </h6>

                              <div className="d-flex gap-2 flex-wrap justify-content-end">
                                <Badge bg={e.priority === 'P1 - High' ? 'danger' : e.priority === 'P2 - Medium' ? 'warning' : 'primary'}>
                                  {e.priority}
                                </Badge>

                                <Badge bg={e.status === 'Open' ? 'warning' : e.status === 'Closed' ? 'danger' : 'secondary'}>
                                  {e.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-muted small mb-2">{truncateQuillHTML(e.description, 120) || 'No description provided'}</p>

                            {/* Assigned + Time */}
                            <div className="d-flex flex-wrap align-items-center small text-secondary gap-2">
                              <span className="text-truncate">
                                <b>
                                  {e.createdbyName || 'N/A'} ({e.createdBy?.designation || 'N/A'})
                                </b>
                              </span>

                              <i className="bi bi-arrow-right"></i>

                              <span className="text-truncate">
                                <b>{e.assignToName || 'N/A'}</b>
                              </span>

                              <span className="ms-auto text-muted" title={formatDateTime(e.createdAt)}>
                                {timeAgo(e.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}

                  {loading && (
                    <div className="text-center py-3">
                      <Spinner />
                    </div>
                  )}
                </div>
              </Col>

              <Col xs={12} md={12} lg={5}>
                <div style={{ position: 'sticky', top: '80px' }}>
                  {selectedEscalation ? (
                    <MainCard title={<div className="card-title-safe">{selectedEscalation?.title}</div>}>
                      <div className="mb-4">
                        <h6 className="text-secondary small fw-bold mb-2">Description</h6>

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
                              __html: DOMPurify.sanitize(selectedEscalation.description)
                            }}
                          />
                        </div>
                      </div>

                      <hr className="my-4 text-muted" style={{ opacity: 0.1 }} />

                      {/* <Row className="mb-4">
                        <Col md={6} className="mb-3 mb-md-0">
                          <h6 className="text-uppercase text-secondary small fw-bold mb-2">Status & Priority</h6>
                          <div className="d-flex flex-wrap gap-2">
                            <Badge bg={selectedEscalation.status === 'Closed' ? 'danger' : 'success'} pill className="px-3 py-2">
                              {selectedEscalation.status}
                            </Badge>

                            <Badge
                              bg={
                                selectedEscalation.priority === 'High'
                                  ? 'danger'
                                  : selectedEscalation.priority === 'Medium'
                                    ? 'warning'
                                    : 'primary'
                              }
                              pill
                              className="px-3 py-2"
                            >
                              {selectedEscalation.priority}
                            </Badge>
                          </div>
                        </Col>
                      </Row> */}
                      <Row className="mb-4">
                        <Col md={12} className="mb-3 mb-md-0">
                          <div className="mb-2 d-flex flex-column flex-sm-row">
                            <div className="text-secondary small fw-bold me-sm-3" style={{ minWidth: '120px' }}>
                              Status
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              <Badge bg={selectedEscalation.status === 'Closed' ? 'danger' : 'success'} pill className="px-3 py-2">
                                {selectedEscalation.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mb-2 d-flex flex-column flex-sm-row">
                            <div className="text-secondary small fw-bold me-sm-3" style={{ minWidth: '120px' }}>
                              Priority
                            </div>
                            <Badge
                              bg={
                                selectedEscalation.priority === 'High'
                                  ? 'danger'
                                  : selectedEscalation.priority === 'Medium'
                                    ? 'warning'
                                    : 'primary'
                              }
                              pill
                              className="px-3 py-2"
                            >
                              {selectedEscalation.priority}
                            </Badge>
                          </div>
                          <div className="mb-2 d-flex flex-column flex-sm-row">
                            <div className="text-secondary small fw-bold me-sm-3" style={{ minWidth: '120px' }}>
                              Created By
                            </div>
                            <div className="fw-medium text-break">
                              {selectedEscalation?.createdBy?.name || 'N/A'}({selectedEscalation?.createdBy?.designation || 'N/A'})
                            </div>
                          </div>
                          <div className="mb-2 d-flex flex-column flex-sm-row">
                            <div className="text-secondary small fw-bold me-sm-3" style={{ minWidth: '120px' }}>
                              Assigned To
                            </div>
                            <div className="fw-medium text-break">
                              {selectedEscalation?.assignTo?.name || 'N/A'}({selectedEscalation?.assignTo?.designation || 'N/A'})
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <div className="p-3 bg-light rounded-3 mb-4 border">
                        <Row>
                          <Col md={12} className="mb-3">
                            <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                Project
                              </div>
                              <div className="fw-bold text-break">{selectedEscalation?.project?.projectName ?? 'N/A'}</div>
                            </div>

                            <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                Feed
                              </div>
                              <div className="fw-bold text-break">{selectedEscalation?.feed?.feedName ?? 'N/A'}</div>
                            </div>
                            <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                Department
                              </div>
                              <div className="fw-bold text-break">{selectedEscalation?.department ?? 'N/A'}</div>
                            </div>

                            <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                SLA Target Date
                              </div>
                              <div className="fw-bold text-break">{selectedEscalation?.SLADate ?? 'N/A'}</div>
                            </div>
                            {/* <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                Severity
                              </div>
                              <div className="fw-bold text-break">{selectedEscalation?.Severity ?? 'N/A'}</div>
                            </div> */}
                            <div className="mb-2 d-flex flex-column flex-sm-row">
                              <div className="text-secondary small fw-medium me-sm-3" style={{ minWidth: '120px' }}>
                                Created By
                              </div>
                              <div className="fw-bold text-break">{formatDateTime(selectedEscalation?.createdAt)}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <div className="mb-4">
                        <h6 className="text-uppercase text-secondary small fw-bold mb-2">
                          <i className="bi bi-eye me-2"></i>Watchers
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedEscalation.watchers?.length > 0 ? (
                            selectedEscalation.watchers.map((w) => (
                              <div key={w._id} className="d-flex align-items-center bg-white border rounded-pill px-3 py-1 shadow-sm">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                >
                                  {w.name.charAt(0)}
                                </div>
                                <span className="small fw-medium">{w.name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted small fst-italic">No watchers</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-auto pt-3 border-top">
                        <Button
                          variant="primary"
                          className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                          onClick={() => handleEscalationDetails(selectedEscalation)}
                        >
                          View Details
                        </Button>
                      </div>
                      {selectedEscalation.status !== 'Closed' &&
                        (permission[0].action.includes('UpdateStatus') ||
                          selectedEscalation.createdBy._id === userId ||
                          selectedEscalation.assignTo._id === userId) && (
                          <div className="mt-auto pt-3 ">
                            <Button
                              variant="danger"
                              className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                              onClick={() => handleCloseEscalationModel(selectedEscalation)}
                            >
                              Close Escalation
                            </Button>
                          </div>
                        )}
                    </MainCard>
                  ) : (
                    <div className="text-muted text-center mt-5">Select an escalation to view details</div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </MainCard>

      {/* ================= CREATE MODAL (UNCHANGED) ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Create Escalation</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  {' '}
                  <Form.Label className="required">Title</Form.Label>{' '}
                  <Form.Control
                    type="text"
                    name="title"
                    value={escalation.title}
                    onChange={handleChange}
                    maxLength={60}
                    placeholder="Enter Escalation Title (Max 60 characters)"
                  />
                </Form.Group>{' '}
                {errors.title && <p className="text-danger">{errors.title}</p>}
              </Col>
              <Col md={4}>
                {' '}
                <Form.Group className="mb-3">
                  <Form.Label className="required">Project</Form.Label>
                  <Select
                    options={projects.map((p) => ({ value: p._id, label: `[${p.projectCode}] ${p.projectName}` }))}
                    placeholder="Select Project"
                    isClearable
                    value={
                      projects.map((p) => ({ value: p._id, label: p.projectName })).find((p) => p.value === escalation.project) || null
                    }
                    onChange={(e) => {
                      setEscalation((prev) => ({
                        ...prev,
                        project: e?.value || '',
                        feed: ''
                      }));
                      setErrors((prev) => ({ ...prev, project: '' }));

                      if (e?.value) fetchFeeds(e.value);
                      if (e?.value) fetchUsers(e.value);
                      if (e?.value) fetchwatchers(e.value);
                      else setFeeds([]);
                    }}
                  />
                </Form.Group>
                {errors.project && <p className="text-danger">{errors.project}</p>}
              </Col>
              <Col md={4}>
                {' '}
                <Form.Group className="mb-3">
                  <Form.Label>Feed (Optional) </Form.Label>
                  <Select
                    options={feeds.map((f) => ({ value: f._id, label: f.feedName }))}
                    placeholder={escalation.project ? 'Select Feed' : 'Select Project first'}
                    isDisabled={!escalation.project}
                    value={feeds.map((f) => ({ value: f._id, label: f.feedName })).find((f) => f.value === escalation.feed) || null}
                    onChange={(e) => handleSelect('feed', e?.value || '')}
                  />
                </Form.Group>
                {errors.feed && <p className="text-danger">{errors.feed}</p>}
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="required">Department</Form.Label>
                  <Select options={departmentOptions} onChange={handleDepartmentChange} />
                </Form.Group>
                {errors.department && <p className="text-danger">{errors.department}</p>}
              </Col>

              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="required">Priority </Form.Label>
                  <Select options={priorityOptions} onChange={(e) => handleSelect('priority', e?.value)} />
                </Form.Group>
                {errors.priority && <p className="text-danger">{errors.priority}</p>}
              </Col>
              {/* <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="required">Severity</Form.Label>
                  <Select options={SeverityOptions} onChange={(e) => handleSelect('Severity', e?.value)} />
                </Form.Group>
                {errors.Severity && <p className="text-danger">{errors.Severity}</p>}
              </Col> */}
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="required">SLA Expected Resolution Date</Form.Label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={escalation.SLADate ? dayjs(escalation.SLADate) : null}
                      format="YYYY-MM-DD"
                      disablePast
                      onChange={(newValue) => {
                        setEscalation({
                          ...escalation,
                          SLADate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : null
                        });
                        setErrors((prev) => ({ ...prev, SLADate: '' }));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Form.Group>
                {errors.SLADate && <p className="text-danger">{errors.SLADate}</p>}
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="required">Assign To </Form.Label>
                  <Select
                    options={users
                      .filter((u) => u.department === escalation.department)
                      .map((u) => ({ value: u.userId, label: `${u.name} (${u.role})` }))}
                    value={
                      users
                        .filter((u) => u.department === escalation.department)
                        .map((u) => ({
                          value: u.userId,
                          label: `${u.name} (${u.role})`
                        }))
                        .find((opt) => opt.value === escalation.assignTo) || null
                    }
                    onChange={(e) => {
                      handleSelect('assignTo', e?.value);
                      handleSelect('assignToName', e?.label);
                    }}
                  />
                </Form.Group>
                {errors.assignTo && <p className="text-danger">{errors.assignTo}</p>}
              </Col>
              <Col md={4}>
                {' '}
                <Form.Group className="mb-3">
                  <Form.Label className="required">watchers</Form.Label>
                  <Select
                    isMulti
                    options={watchers.map((u) => ({ value: u.userId, label: u.name }))}
                    onChange={(e) =>
                      handleSelect(
                        'watchers',
                        e.map((x) => x.value)
                      )
                    }
                  />
                </Form.Group>
                {errors.watchers && <p className="text-danger">{errors.watchers}</p>}
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="required">Description</Form.Label>

              <ReactQuill
                theme="snow"
                value={escalation.description}
                onChange={(value) =>
                  setEscalation((prev) => ({
                    ...prev,
                    description: value
                  }))
                }
                placeholder="Enter description"
              />

              {errors.description && <p className="text-danger mt-1">{errors.description}</p>}
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                resetForm();
                setShowModal(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {loading ? <Spinner size="sm" /> : 'Create Escalation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showClosedModal} onHide={() => setShowClosedModal(false)} size="xl">
        <Form onSubmit={handleCloseEscalation}>
          <Modal.Header closeButton>
            <Modal.Title>Close Escalation</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="close-escalation-tabs" className="mb-3 custom-tabs" fill>
              <Tab eventKey="rca" title="1. Root Cause Analysis (RCA)">
                <Row>
                  <Col md={6}>
                    <Form.Label className="required">Root Cause Category</Form.Label>
                    <Select
                      options={rootCauseOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, rootCauseCategory: e?.value });
                        setErrors((prev) => ({ ...prev, rootCauseCategory: '' }));
                      }}
                    />
                    {errors.rootCauseCategory && <small className="text-danger">{errors.rootCauseCategory}</small>}
                  </Col>
                  <Col md={6}>
                    <Form.Label className="required">RCA Method</Form.Label>
                    <Select
                      options={rcaMethodOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, rcaMethod: e?.value });
                        setErrors((prev) => ({ ...prev, rcaMethod: '' }));
                      }}
                    />
                    {errors.rcaMethod && <small className="text-danger">{errors.rcaMethod}</small>}
                  </Col>
                  <Col md={12} className="mt-3">
                    <Form.Label className="required">RCA Description</Form.Label>
                    <ReactQuill
                      theme="snow"
                      value={closeData.rcaDescription}
                      onChange={(value) => {
                        setCloseData({ ...closeData, rcaDescription: value });
                        setErrors((prev) => ({ ...prev, rcaDescription: '' }));
                      }}
                    />
                    {errors.rcaDescription && <small className="text-danger">{errors.rcaDescription}</small>}
                    {/* <Form.Control
                      as="textarea"
                      rows={3}
                      maxLength={500}
                      placeholder="Enter description (max 500 characters)"
                      onChange={(e) => {
                        setCloseData({ ...closeData, rcaDescription: e.target.value });
                        setErrors((prev) => ({ ...prev, rcaDescription: '' }));
                      }}
                    />
                    {errors.rcaDescription && <small className="text-danger">{errors.rcaDescription}</small>} */}
                  </Col>
                </Row>
                {/* </div> */}
                <div className="d-flex justify-content-end mt-3">
                  <Button variant="primary" onClick={() => setActiveTab('corrective')}>
                    Next <i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                </div>
              </Tab>

              {/* ===== CORRECTIVE ACTION TAB ===== */}
              <Tab eventKey="corrective" title="2. Corrective Action (CA)">
                <Row>
                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Action Type</Form.Label>
                    <Select
                      options={actionTypeOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, actionType: e?.value });
                        setErrors((prev) => ({ ...prev, actionType: '' }));
                      }}
                    />
                    {errors.actionType && <small className="text-danger">{errors.actionType}</small>}
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Action Owner</Form.Label>
                    <Select
                      options={users.map((u) => ({ label: u.name, value: u.userId }))}
                      onChange={(e) => {
                        setCloseData({ ...closeData, actionOwner: e?.value });
                        setErrors((prev) => ({ ...prev, actionOwner: '' }));
                      }}
                    />
                    {errors.actionOwner && <small className="text-danger">{errors.actionOwner}</small>}
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Date Implemented</Form.Label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        onChange={(d) => {
                          setCloseData({ ...closeData, dateImplemented: dayjs(d).format('YYYY-MM-DD') });
                          setErrors((prev) => ({ ...prev, dateImplemented: '' }));
                        }}
                        minDate={dayjs(selectedEscalation?.createdAt)}
                        format="YYYY-MM-DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small'
                          }
                        }}
                      />
                    </LocalizationProvider>
                    {errors.dateImplemented && <small className="text-danger">{errors.dateImplemented}</small>}
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Fix Verification Method</Form.Label>
                    <Select
                      options={verificationMethodOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, fixVerificationMethod: e?.value });
                        setErrors((prev) => ({ ...prev, fixVerificationMethod: '' }));
                      }}
                    />
                    {errors.fixVerificationMethod && <small className="text-danger">{errors.fixVerificationMethod}</small>}
                  </Col>
                  <Col md={12}>
                    <Form.Label className="required">Corrective Action Description</Form.Label>
                    <ReactQuill
                      theme="snow"
                      value={closeData.correctiveActionDescription}
                      onChange={(value) => {
                        setCloseData({ ...closeData, correctiveActionDescription: value });
                        setErrors((prev) => ({ ...prev, correctiveActionDescription: '' }));
                      }}
                    />
                    {errors.correctiveActionDescription && <small className="text-danger">{errors.correctiveActionDescription}</small>}
                    {/* <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={500}
                      placeholder="Enter description (max 500 characters)"
                      onChange={(e) => {
                        setCloseData({ ...closeData, correctiveActionDescription: e.target.value });
                        setErrors((prev) => ({ ...prev, correctiveActionDescription: '' }));
                      }}
                    />
                    {errors.correctiveActionDescription && <small className="text-danger">{errors.correctiveActionDescription}</small>} */}
                  </Col>
                </Row>
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="secondary" onClick={() => setActiveTab('rca')}>
                    <i className="bi bi-arrow-left me-2"></i> Previous
                  </Button>
                  <Button variant="primary" onClick={() => setActiveTab('preventive')}>
                    Next <i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                </div>
              </Tab>

              {/* ===== PREVENTIVE ACTION TAB ===== */}
              <Tab eventKey="preventive" title="3. Preventive Action (PA)">
                <Row>
                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Preventive Action Type</Form.Label>
                    <Select
                      options={preventiveActionTypeOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, preventiveActionType: e?.value });
                        setErrors((prev) => ({ ...prev, preventiveActionType: '' }));
                      }}
                    />
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Preventive Action Owner</Form.Label>
                    <Select
                      options={users.map((u) => ({ label: u.name, value: u.userId }))}
                      onChange={(e) => {
                        setCloseData({ ...closeData, preventiveActionOwner: e?.value });
                        setErrors((prev) => ({ ...prev, preventiveActionOwner: '' }));
                      }}
                    />
                    {errors.preventiveActionOwner && <small className="text-danger">{errors.preventiveActionOwner}</small>}
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Target Completion Date</Form.Label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        onChange={(d) => {
                          setCloseData({ ...closeData, targetCompletionDate: dayjs(d).format('YYYY-MM-DD') });
                          setErrors((prev) => ({ ...prev, targetCompletionDate: '' }));
                        }}
                        format="YYYY-MM-DD"
                        minDate={dayjs(selectedEscalation?.createdAt)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small'
                          }
                        }}
                      />
                    </LocalizationProvider>
                    {errors.targetCompletionDate && <small className="text-danger">{errors.targetCompletionDate}</small>}
                  </Col>

                  <Col md={6} className="mt-3">
                    <Form.Label className="required">Preventive Action Status</Form.Label>
                    <Select
                      options={preventiveStatusOptions}
                      onChange={(e) => {
                        setCloseData({ ...closeData, preventiveActionStatus: e?.value });
                        setErrors((prev) => ({ ...prev, preventiveActionStatus: '' }));
                      }}
                    />
                    {errors.preventiveActionStatus && <small className="text-danger">{errors.preventiveActionStatus}</small>}
                  </Col>
                  <Col md={12}>
                    <Form.Label className="required">Preventive Action Description</Form.Label>
                    <ReactQuill
                      theme="snow"
                      value={closeData.preventiveActionDescription}
                      onChange={(value) => {
                        setCloseData({ ...closeData, preventiveActionDescription: value });
                        setErrors((prev) => ({ ...prev, preventiveActionDescription: '' }));
                      }}
                    />
                    {errors.preventiveActionDescription && <small className="text-danger">{errors.preventiveActionDescription}</small>}
                    {/* <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={500}
                      placeholder="Enter description (max 500 characters)"
                      onChange={(e) => {
                        setCloseData({ ...closeData, preventiveActionDescription: e.target.value });
                        setErrors((prev) => ({ ...prev, preventiveActionDescription: '' }));
                      }}
                    />
                    {errors.preventiveActionDescription && <small className="text-danger">{errors.preventiveActionDescription}</small>} */}
                  </Col>
                </Row>
                <div className="d-flex justify-content-start mt-3">
                  <Button variant="secondary" onClick={() => setActiveTab('corrective')}>
                    <i className="bi bi-arrow-left me-2"></i> Previous
                  </Button>
                </div>
              </Tab>
            </Tabs>

            {/* SLA Expected Resolution Date */}
            {selectedEscalation?.SLADate > dayjs().format('YYYY-MM-DD') ? (
              <Badge bg="success" className="mt-3">
                Resolved within SLA
              </Badge>
            ) : (
              <>
                <hr />
                <Row>
                  <h6 className="mb-3 mt-1">SLA Expected Resolution Date</h6>

                  <Col md={12}>
                    <Form.Label className="required">SLA Breach Reason</Form.Label>
                    <ReactQuill
                      theme="snow"
                      value={closeData.slaBreachReason}
                      onChange={(value) => {
                        setCloseData({ ...closeData, slaBreachReason: value });
                        setErrors((prev) => ({ ...prev, slaBreachReason: '' }));
                      }}
                    />
                    {errors.slaBreachReason && <small className="text-danger">{errors.slaBreachReason}</small>}
                    {/* <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={500}
                      placeholder="Enter description (max 500 characters)"
                      onChange={(e) => {
                        setCloseData({ ...closeData, slaBreachReason: e.target.value });
                        setErrors((prev) => ({ ...prev, slaBreachReason: '' }));
                      }}
                    />
                    {errors.slaBreachReason && <small className="text-danger">{errors.slaBreachReason}</small>} */}
                  </Col>
                </Row>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleChangeCloseModalcancel}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              {loading ? <Spinner size="sm" /> : 'Close Escalation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ================= DETAILS MODAL ================= */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Escalation Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEscalation && (
            <>
              {/* Header Info */}
              <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-4">
                <div>
                  <h5 className="mb-1 fw-bold">{selectedEscalation.title}</h5>
                  <small className="text-muted">Created on {formatDateTime(selectedEscalation.createdAt)}</small>
                </div>
                <div>
                  <Badge bg={selectedEscalation.status === 'Closed' ? 'danger' : 'success'} className="me-2 p-2">
                    {selectedEscalation.status}
                  </Badge>
                  <Badge bg="warning" text="dark" className="p-2">
                    {selectedEscalation.priority}
                  </Badge>
                </div>
              </div>

              <Row>
                {/* Left Column: Core Details */}
                <Col md={6}>
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Core Information</h6>
                  <Row className="mb-2">
                    <Col sm={4} className="text-secondary fw-medium">
                      Project
                    </Col>
                    <Col sm={8} className="fw-bold">
                      {selectedEscalation.project?.projectName || '-'}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={4} className="text-secondary fw-medium">
                      Feed
                    </Col>
                    <Col sm={8} className="fw-bold">
                      {selectedEscalation.feed?.feedName || '-'}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={4} className="text-secondary fw-medium">
                      Department
                    </Col>
                    <Col sm={8}>{selectedEscalation.department?.label || selectedEscalation.department || '-'}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={4} className="text-secondary fw-medium">
                      Assigned To
                    </Col>
                    <Col sm={8} className="text-primary fw-bold">
                      {selectedEscalation.assignTo?.name || '-'}
                    </Col>
                  </Row>
                  {/* <Row className="mb-2">
                    <Col sm={4} className="text-secondary fw-medium">
                      Severity
                    </Col>
                    <Col sm={8}>{selectedEscalation.Severity || '-'}</Col>
                  </Row> */}
                  <Row>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {/* <MdDescription size={18} /> */}
                      <h6 className="text-secondary mb-0 fw-semibold">Description</h6>
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
                          __html: DOMPurify.sanitize(selectedEscalation.description)
                        }}
                      />
                    </div>
                  </Row>
                </Col>

                {/* Right Column: SLA & Timelines */}
                <Col md={6}>
                  <h6 className="fw-bold border-bottom pb-2 mb-3">SLA & Timelines</h6>
                  <div className="p-3 bg-light rounded border">
                    <Row className="mb-2">
                      <Col sm={6} className="text-secondary fw-medium">
                        Resolution Start Time
                      </Col>
                      <Col sm={6}>{formatDateTime(selectedEscalation.createdAt)}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={6} className="text-secondary fw-medium">
                        Resolution End Time
                      </Col>
                      <Col sm={6}>
                        {selectedEscalation.status === 'Closed' ? formatDateTime(selectedEscalation.closedAt) : 'In Progress'}
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={6} className="text-secondary fw-medium">
                        Total Resolution Time
                      </Col>
                      <Col sm={6}>
                        {selectedEscalation.status === 'Closed'
                          ? calculateResolutionTime(selectedEscalation.createdAt, selectedEscalation.closedAt)
                          : '-'}
                      </Col>
                    </Row>
                    <hr className="my-2" />
                    <Row className="mb-2">
                      <Col sm={6} className="text-secondary fw-medium">
                        SLA Target Date
                      </Col>
                      <Col sm={6} className="fw-bold">
                        {selectedEscalation.SLADate || '-'}
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={6} className="text-secondary fw-medium">
                        SLA Met?
                      </Col>
                      <Col sm={6}>
                        {selectedEscalation.status === 'Closed' ? (
                          new Date(selectedEscalation.closedAt) <= new Date(selectedEscalation.SLADate) ? (
                            <Badge bg="success">Yes</Badge>
                          ) : (
                            <Badge bg="danger">No</Badge>
                          )
                        ) : (
                          <Badge bg="secondary">Pending</Badge>
                        )}
                      </Col>
                    </Row>
                    {/* Show SLA Breach Reason only if breached (or if data exists) */}
                    {selectedEscalation.slaBreachReason && (
                      <div className="mt-3 p-2 border border-danger rounded bg-white">
                        <strong className="text-danger d-block mb-1">SLA Breach Reason:</strong>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {/* <MdDescription size={18} /> */}
                          <h6 className="text-secondary mb-0 fw-semibold">Description</h6>
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
                              __html: DOMPurify.sanitize(selectedEscalation.slaBreachReason)
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Closing Details Section (Only if Closed) */}
              {selectedEscalation.status === 'Closed' && (
                <div className="mt-4">
                  <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Closure Details</h5>

                  <Tabs defaultActiveKey="rca" id="closure-details-tabs" className="mb-3 custom-tabs" fill>
                    {/* RCA Tab */}
                    <Tab eventKey="rca" title="Root Cause Analysis">
                      <Row className="g-3">
                        <Col md={6}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Category</small>
                            <strong>{selectedEscalation.closureDetails.rootCauseCategory || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Method</small>
                            <strong>{selectedEscalation.closureDetails.rcaMethod || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="p-2 border rounded bg-light">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {/* <MdDescription size={18} /> */}
                              <h6 className="text-secondary mb-0 fw-semibold">Description</h6>
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
                                  __html: DOMPurify.sanitize(selectedEscalation.closureDetails.rcaDescription)
                                }}
                              />
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Tab>

                    {/* Corrective Action Tab */}
                    <Tab eventKey="corrective" title="Corrective Action">
                      <Row className="g-3">
                        <Col md={12}>
                          <div className="p-2 border rounded bg-light">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {/* <MdDescription size={18} /> */}
                              <h6 className="text-secondary mb-0 fw-semibold">Description</h6>
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
                                  __html: DOMPurify.sanitize(selectedEscalation.closureDetails.correctiveActionDescription)
                                }}
                              />
                            </div>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Action Type</small>
                            <strong>{selectedEscalation.closureDetails.actionType || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Fix Verification Method</small>
                            <strong>{selectedEscalation.closureDetails.fixVerificationMethod || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Action Owner</small>
                            <strong>
                              {selectedEscalation.closureDetails.actionOwner?.name ||
                                selectedEscalation.closureDetails.actionOwner ||
                                'N/A'}
                            </strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Date Implemented</small>
                            <strong>{selectedEscalation.closureDetails.dateImplemented || 'N/A'}</strong>
                          </div>
                        </Col>
                      </Row>
                    </Tab>

                    {/* Preventive Action Tab */}
                    <Tab eventKey="preventive" title="Preventive Action">
                      <Row className="g-3">
                        <Col md={12}>
                          <div className="p-2 border rounded bg-light">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              {/* <MdDescription size={18} /> */}
                              <h6 className="text-secondary mb-0 fw-semibold">Description</h6>
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
                                  __html: DOMPurify.sanitize(selectedEscalation.closureDetails.preventiveActionDescription)
                                }}
                              />
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Action Type</small>
                            <strong>{selectedEscalation.closureDetails.preventiveActionType || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Preventive Action Owner</small>
                            <strong>
                              {selectedEscalation.closureDetails.preventiveActionOwner?.name ||
                                selectedEscalation.closureDetails.preventiveActionOwner ||
                                'N/A'}
                            </strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Target Date</small>
                            <strong>{selectedEscalation.closureDetails.targetCompletionDate || 'N/A'}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="p-2 border rounded bg-light">
                            <small className="text-muted d-block">Status</small>
                            <strong>{selectedEscalation.closureDetails.preventiveActionStatus || 'N/A'}</strong>
                          </div>
                        </Col>
                      </Row>
                    </Tab>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EscalationList;
