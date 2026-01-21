import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import Select from 'react-select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { api } from 'views/api';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

// import ReactQuill from 'react-quill';

/* ================= CONSTANT OPTIONS ================= */

const priorityOptions = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
];
const scopeTypeOptions = [
  { label: 'By Search term', value: 'By Search term' },
  { label: 'By Product', value: 'By Product' },
  { label: 'By Review', value: 'By Review' },
  { label: 'By Category', value: 'By Category' }
];
const frequencyOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' }
];

const deliveryOptions = [
  { label: 'API', value: 'API' },
  { label: 'DaaS', value: 'DaaS' },
  { label: 'Both (API & DaaS)', value: 'Both (API & DaaS)' }
];

const industryOptions = [
  { label: 'E-com', value: 'E-com' },
  { label: 'Food', value: 'Food' },
  { label: 'Q-com', value: 'Q-com' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Travel', value: 'Travel' },
  { label: 'OTT', value: 'OTT' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Gov', value: 'Gov' },
  { label: 'Event', value: 'Event' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Music', value: 'Music' }
];
const departments = [
  { label: 'Operation', value: 'Operation' },
  { label: 'R&D', value: 'R&D' }
];

/* ================= COMPONENT ================= */

const CreateProject = () => {
  document.title = 'Create Project';
  const navigator = useNavigate();
  const [loading, setLoading] = useState(false);
  const [Manager, setManager] = useState([]);
  const [sales, setSales] = useState([]);

  const [sowFile, setSowFile] = useState([]);
  const [inputFile, setInputFile] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    deliveryType: '',
    IndustryType: '',
    department: '',
    projectPriority: 'Medium',
    projectFrequency: '',
    projectManager: null,
    salesPerson: null
  });
  console.log('formData', formData);
  /* ================= FETCH USERS ================= */

  useEffect(() => {
    fetchSales('Sales');
  }, []);

  const fetchmanager = async (department) => {
    try {
      const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}`, {
        withCredentials: true
      });
      setManager(res.data.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }
  };
  const fetchSales = async (department) => {
    try {
      const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}`, {
        withCredentials: true
      });
      setSales(res.data.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const ManagerOptions = Manager.map((u) => ({
    value: u._id,
    label: u.name
  }));
  const SalesOptions = sales.map((u) => ({
    value: u._id,
    label: u.name
  }));
  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectName?.trim()) newErrors.projectName = 'Project Name is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.deliveryType) newErrors.deliveryType = 'Delivery Type is required';
    if (!formData.IndustryType) newErrors.IndustryType = 'Industry Type is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.projectPriority) newErrors.projectPriority = 'Project Priority is required';
    if (!formData.projectFrequency) newErrors.projectFrequency = 'Project Frequency is required';
    if (!formData.projectManager) newErrors.projectManager = 'Project Manager is required';
    if (!formData.salesPerson) newErrors.salesPerson = 'Sales Person is required';
    if (!sowFile || sowFile.length === 0) newErrors.sowFile = 'SOW document is required';
    if (!inputFile || inputFile.length === 0) newErrors.inputFile = 'Input document is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const form = new FormData();

      /* ---------- Text Fields ---------- */
      Object.entries({
        projectName: formData.projectName,
        description: formData.description,
        deliveryType: formData.deliveryType,
        IndustryType: formData.IndustryType,
        department: formData.department,
        projectPriority: formData.projectPriority,
        projectFrequency: formData.projectFrequency,
        projectManager: formData.projectManager?.value,
        projectManagerName: formData.projectManager?.label,
        salesPerson: formData.salesPerson?.value
      }).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });

      /* ---------- Files ---------- */
      sowFile.forEach((file) => {
        form.append('sowDocument', file);
      });

      inputFile.forEach((file) => {
        form.append('inputDocument', file);
      });

      await axios.post(`${api}/Project-Integration`, form, {
        withCredentials: true
        // headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201) {
        toast.success('Project created successfully');
        setFormData({
          projectName: '',
          description: '',
          deliveryType: '',
          IndustryType: '',
          department: '',
          projectPriority: 'Medium',
          projectFrequency: '',
          projectManager: null,
          salesPerson: null
        });
        setSowFile([]);
        setInputFile([]);
        navigator('/Projects');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Project creation failed');
    } finally {
      setLoading(false);
    }
  };
  const FileDropZone = ({ label, file, setFile, error }) => {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // ✅ Reset file input when state changes
    useEffect(() => {
      if (inputRef.current) inputRef.current.value = null;
    }, [file]);

    const handleDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) {
        setFile((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      }
    };

    return (
      <>
        <Form.Label className="required">{label}</Form.Label>

        <div
          className="text-center p-4 rounded"
          style={{
            cursor: 'pointer',
            border: error ? '2px dashed #dc3545' : '2px dashed #3F4D67',
            backgroundColor: dragOver ? '#f8f9fa' : 'transparent'
          }}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="fw-semibold">Drag & Drop file here</div>
          <small>or click to browse</small>

          <Form.Control
            ref={inputRef}
            type="file"
            multiple
            className="d-none"
            onChange={(e) => setFile((prev) => [...prev, ...Array.from(e.target.files)])}
          />
        </div>

        {/* ✅ Preview */}
        {file.map((f, i) => (
          <div key={i} className="mt-2 p-2 border rounded d-flex justify-content-between">
            <div>
              <div className="fw-semibold">{f.name}</div>
              <small>{(f.size / 1024).toFixed(2)} KB</small>
            </div>
            <Button size="sm" onClick={() => setFile(file.filter((_, idx) => idx !== i))}>
              Remove
            </Button>
          </div>
        ))}
        {error && <div className="text-danger mt-1 text-sm">{error}</div>}
      </>
    );
  };

  return (
    <>
      <ToastContainer />
      <Card title="Create Project">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Label className="required text-bold">Project Name</Form.Label>
              <Form.Control
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                isInvalid={!!errors.projectName}
              />
              <Form.Control.Feedback type="invalid">{errors.projectName}</Form.Control.Feedback>
            </Col>
            <Col md={6}>
              <Form.Label className="required">Industry Type</Form.Label>
              <Select
                options={industryOptions}
                value={industryOptions.find((o) => o.value === formData.IndustryType)}
                isClearable
                onChange={(v) => setFormData({ ...formData, IndustryType: v?.value || '' })}
              />
              {errors.IndustryType && <div className="text-danger mt-1">{errors.IndustryType}</div>}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Label className="required">Frequency</Form.Label>
              <Select
                options={frequencyOptions}
                value={frequencyOptions.find((o) => o.value === formData.projectFrequency)}
                onChange={(v) => setFormData({ ...formData, projectFrequency: v?.value || '' })}
                isClearable
              />
              {errors.projectFrequency && <div className="text-danger mt-1">{errors.projectFrequency}</div>}
            </Col>
            <Col md={4}>
              <Form.Label className="required">Delivery Type</Form.Label>
              <Select
                options={deliveryOptions}
                value={deliveryOptions.find((o) => o.value === formData.deliveryType)}
                onChange={(v) => setFormData({ ...formData, deliveryType: v?.value || '' })}
                isClearable
              />
              {errors.deliveryType && <div className="text-danger mt-1">{errors.deliveryType}</div>}
            </Col>
            <Col md={4}>
              <Form.Label className="required">Priority</Form.Label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find((o) => o.value === formData.projectPriority)}
                onChange={(v) => setFormData({ ...formData, projectPriority: v.value })}
                isClearable
              />
              {errors.projectPriority && <div className="text-danger mt-1">{errors.projectPriority}</div>}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Label className="required">Department</Form.Label>
              <Select
                options={departments}
                value={departments.find((o) => o.value === formData.department)}
                onChange={(v) => {
                  setFormData((prev) => ({
                    ...prev,
                    department: v?.value || '',
                    projectManager: null
                  }));

                  fetchmanager(v?.value);
                }}
                isClearable
              />
              {errors.department && <div className="text-danger mt-1">{errors.department}</div>}
            </Col>
            <Col md={4}>
              <Form.Label className="required">Project Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectManager}
                onChange={(v) => setFormData({ ...formData, projectManager: v })}
                isClearable
              />
              {errors.projectManager && <div className="text-danger mt-1">{errors.projectManager}</div>}
            </Col>

            <Col md={4}>
              <Form.Label className="required">Sales Person</Form.Label>
              <Select
                options={SalesOptions}
                value={formData.salesPerson}
                onChange={(v) => setFormData({ ...formData, salesPerson: v })}
                isClearable
              />
              {errors.salesPerson && <div className="text-danger mt-1">{errors.salesPerson}</div>}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <FileDropZone label="SOW Document" file={sowFile} setFile={setSowFile} error={errors.sowFile} />
            </Col>

            <Col md={6}>
              <FileDropZone label="Input Document" file={inputFile} setFile={setInputFile} error={errors.inputFile} />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label className="required">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
            </Col>
          </Row>

          <div className="text-end">
            <Button variant="dark" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Project Integration'}
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
};

export default CreateProject;
