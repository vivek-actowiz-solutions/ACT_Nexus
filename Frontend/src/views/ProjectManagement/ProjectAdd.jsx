import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import Select from 'react-select';
import { IoArrowBack } from 'react-icons/io5';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { api } from 'views/api';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { TextField, MenuItem } from '@mui/material';
// import { set } from 'date-fns';

import ReactQuill from 'react-quill';

const priorityOptions = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
];

const frequencyOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Bi-Weekly', value: 'Bi-Weekly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Bi-Monthly', value: 'Bi-Monthly' },
  { label: 'Custom', value: 'Custom' }
];

const deliveryOptions = [
  { label: 'API', value: 'API' },
  { label: 'DaaS', value: 'DaaS' },
  { label: 'Both (API & DaaS)', value: 'Both (API & DaaS)' }
];
const deliveryModeOptions = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'FTP Server', value: 'FTP' },
  { label: 'SFTP Server', value: 'SFTP' },
  { label: 'AWS S3 Bucket', value: 'S3' },
  { label: 'Google Drive', value: 'GOOGLE DRIVE' },
  { label: 'Azure Blob Storage (ABS)', value: 'ABS' },
  { label: 'Database-Level Delivery ', value: 'DB Delivery' },
  { label: 'Google Cloud Storage (GCS)', value: 'GCS' }
];

const industryOptions = [
  { label: 'E-Commerce', value: 'E-com' },
  { label: 'Food & Beverage', value: 'Food' },
  { label: 'Quick Commerce (Q-Commerce)', value: 'Q-com' },
  { label: 'Sports & Fitness', value: 'Sports' },
  { label: 'Travel & Tourism', value: 'Travel' },
  { label: 'OTT & Media Streaming', value: 'OTT' },
  { label: 'Real Estate & Property', value: 'Real Estate' },
  { label: 'Government & Public Sector', value: 'Gov' },
  { label: 'Events & Entertainment', value: 'Event' },
  { label: 'Social Media & Networking', value: 'Social Media' },
  { label: 'Music & Audio Streaming', value: 'Music' }
];
const departments = [
  { label: 'Development', value: 'Development' },
  { label: 'R&D', value: 'R&D' }
];
const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ label: d, value: d }));
/* ================= COMPONENT ================= */

const CreateProject = () => {
  document.title = 'Create Project';
  const navigator = useNavigate();
  const [loading, setLoading] = useState(false);
  const [Manager, setManager] = useState([]);
  const [sales, setSales] = useState([]);
  const [csManager, setcsManager] = useState([]);

  const [sowFile, setSowFile] = useState([]);
  const [inputFile, setInputFile] = useState([]);
  const [annotationFile, setAnnotationFile] = useState([]);

  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    description: '',
    deliveryType: '',
    deliveryMode: '',
    IndustryType: '',
    department: '',
    // projectPriority: 'Medium',
    projectFrequency: '',
    projectManager: null,
    projectTechManager: null,
    csprojectManager: null,
    salesPerson: null
  });
  const [errors, setErrors] = useState({});
  console.log('formdata', formData);
  const [schedule, setSchedule] = useState({
    day: '',
    date: null,
    firstDate: null,
    secondDate: null,
    time: null
  });

  console.log('schedule', schedule);
  const handleFrequencyChange = (v) => {
    setFormData({ ...formData, projectFrequency: v?.value || '' });
    setErrors((prev) => ({ ...prev, projectFrequency: '' }));
    setSchedule({
      day: '',
      date: null,
      firstDate: null,
      secondDate: null,
      time: null
    });
  };

  useEffect(() => {
    fetchSales('Sales');
    fetchcsmanager('Client Success');
  }, []);

  const fetchmanager = async (department) => {
    try {
      const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}&manager=true`, {
        withCredentials: true
      });
      setManager(res.data.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const fetchSales = async (department) => {
    try {
      const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}&BDE=true`, {
        withCredentials: true
      });
      setSales(res.data.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }
  };
  const fetchcsmanager = async (department) => {
    try {
      const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}&manager=true`, {
        withCredentials: true
      });
      console.log('csManager', res.data.data || []);
      setcsManager(res.data.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const ManagerOptions = Manager.map((u) => ({
    value: u._id,
    label: u.name
  }));
  const csManagerOptions = csManager.map((u) => ({
    value: u._id,
    label: u.name
  }));
  const SalesOptions = sales.map((u) => ({
    value: u._id,
    label: u.name
  }));
  const validateForm = () => {
    let newErrors = {};

    if (!formData.projectName?.trim()) newErrors.projectName = 'Project Name is required';
    if (!formData.projectCode?.trim()) newErrors.projectCode = 'Project code is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.deliveryType) newErrors.deliveryType = 'Delivery Type is required';
    if (!formData.deliveryMode) newErrors.deliveryMode = 'Delivery Mode is required';
    if (!formData.IndustryType) newErrors.IndustryType = 'Industry Type is required';
    if (!formData.department) newErrors.department = 'Department is required';
    // if (!formData.projectPriority) newErrors.projectPriority = 'Project Priority is required';
    if (!formData.projectFrequency) newErrors.projectFrequency = 'Project Frequency is required';
    if (!formData.projectManager) newErrors.projectManager = 'Project Manager is required';
    if (!formData.csprojectManager) newErrors.csprojectManager = 'CS Manager is required';
    if (!formData.projectTechManager) newErrors.projectTechManager = 'Project Tech Manager is required';
    if (!formData.salesPerson) newErrors.salesPerson = 'Sales Person is required';

    if (!sowFile || sowFile.length === 0) newErrors.sowFile = 'SOW document is required';

    if (formData.projectFrequency) {
      if (!schedule.time) newErrors.time = 'Delivery time is required';

      if (['Weekly', 'Bi-Weekly'].includes(formData.projectFrequency) && !schedule.day) {
        newErrors.day = 'Delivery day is required';
      }

      if (['Custom', 'Monthly'].includes(formData.projectFrequency) && !schedule.date) {
        newErrors.date = 'Delivery date is required';
      }
      if (['Bi-Monthly'].includes(formData.projectFrequency)) {
        if (!schedule.firstDate) newErrors.firstDate = 'First Date is required';
        if (!schedule.secondDate) newErrors.secondDate = 'Second Date is required';
      }
    }
    if (!formData.description?.trim()) newErrors.description = 'Description is required';

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

      /* ---------- TEXT FIELDS ---------- */
      const textFields = {
        projectName: formData.projectName,
        projectCode: formData.projectCode,
        description: formData.description,
        deliveryType: formData.deliveryType,
        deliveryMode: formData.deliveryMode,
        IndustryType: formData.IndustryType,
        department: formData.department,
        // projectPriority: formData.projectPriority,
        projectManager: formData.projectManager?.value,
        csprojectManager: formData.csprojectManager?.value,
        projectTechManager: formData.projectTechManager?.value,
        salesPerson: formData.salesPerson?.value
      };

      Object.entries(textFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          form.append(key, value);
        }
      });

      /* ---------- PROJECT FREQUENCY (NEW SCHEMA) ---------- */
      const projectFrequencyConfig = {
        frequencyType: formData.projectFrequency,
        firstDate: schedule.firstDate ? schedule.firstDate : null,
        secondDate: schedule.secondDate ? schedule.secondDate : null,
        deliveryDay: schedule.day || null,
        deliveryDate: schedule.date ? schedule.date : null,
        deliveryTime: schedule.time ? schedule.time.format('HH:mm') : null
      };

      form.append('projectFrequencyConfig', JSON.stringify(projectFrequencyConfig));

      /* ---------- FILES ---------- */
      sowFile.forEach((file) => {
        form.append('sowDocument', file);
      });

      inputFile.forEach((file) => {
        form.append('inputDocument', file);
      });

      annotationFile.forEach((file) => {
        form.append('annotationDocument', file);
      });

      console.log(form);
      const res = await axios.post(`${api}/Project-Integration`, form, {
        withCredentials: true
        // headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201) {
        toast.success('Project created successfully');
        setFormData({
          projectName: '',
          projectCode: '',
          description: '',
          deliveryType: '',
          deliveryMode: '',
          IndustryType: '',
          department: '',
          // projectPriority: 'Medium',
          projectFrequency: '',
          projectManager: null,
          csprojectManager: null,
          projectTechManager: null,
          salesPerson: null
        });
        setSowFile([]);
        setInputFile([]);
        setAnnotationFile([]);
        setSchedule({});
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
        if (label === 'SOW Document') setErrors((prev) => ({ ...prev, sowFile: '' }));
      }
    };

    return (
      <>
        <Form.Label className={label === 'SOW Document' ? 'required' : ''}>{label}</Form.Label>
        <div
          className="text-center p-4 rounded"
          style={{
            cursor: 'pointer',
            border: '2px dashed #3F4D67',
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
            onChange={(e) => {
              setFile((prev) => [...prev, ...Array.from(e.target.files)]);
              if (label === 'SOW Document') setErrors((prev) => ({ ...prev, sowFile: '' }));
            }}
          />
        </div>
        {/* ✅ Preview */}
        {file.map((f, i) => (
          <div key={i} className="mt-2 p-2 border rounded d-flex justify-content-between align-items-center">
            <div className="me-2" style={{ maxWidth: '220px' }}>
              <div
                className="fw-semibold text-truncate"
                title={f.name} // full name on hover
              >
                {f.name}
              </div>
              <small>{(f.size / 1024).toFixed(2)} KB</small>
            </div>

            <Button size="sm" variant="danger" onClick={() => setFile(file.filter((_, idx) => idx !== i))}>
              Remove
            </Button>
          </div>
        ))}
        {error && <div className="text-danger mt-1 small">{error}</div>}
      </>
    );
  };
  const generateProjectCode = () => {
    const managerCode = formData.projectManager ? getManagerCode(formData.projectManager.label) : 'XX';
    const csprojectManagerCode = formData.csprojectManager ? getManagerCode(formData.csprojectManager.label) : 'XX';
    const bdecode = formData.salesPerson ? getManagerCode(formData.salesPerson.label) : 'XX';
    const random4Digit = Math.floor(1000 + Math.random() * 9000);

    const code = `ACT-${bdecode}${csprojectManagerCode}${managerCode}-${random4Digit}`;
    //ACT-ARSS-1334
    setFormData((prev) => ({
      ...prev,
      projectCode: code
    }));
  };
  const handleCodeEdit = (e) => {
    // allow only 4 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);

    // keep everything before last hyphen
    const prefix = formData.projectCode ? formData.projectCode.replace(/-\d{0,4}$/, '') : 'ACT-XX-XX-XX';

    setFormData((prev) => ({
      ...prev,
      projectCode: `${prefix}-${digits}`
    }));
    setErrors((prev) => ({ ...prev, projectCode: '' }));
  };
  useEffect(() => {
    generateProjectCode();
  }, [formData.projectManager || '', formData.salesPerson || '', formData.csprojectManager || '']);
  const getManagerCode = (name = '') => {
    console.log('name', name);
    const words = name.trim().split(' ').filter(Boolean);

    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    return words[0]?.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <ToastContainer />
      <Card title="Create Project">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Label className="required">Project Name</Form.Label>
              <Form.Control
                value={formData.projectName}
                maxLength={30}
                isInvalid={!!errors.projectName}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow only letters, numbers and space
                  const validChars = /^[a-zA-Z0-9 _()]*$/;

                  // Check if value is only numbers
                  const onlyNumbers = /^[0-9 ]+$/;

                  if (!validChars.test(value)) return;

                  // ❌ Block if input is only numbers
                  if (onlyNumbers.test(value)) {
                    setFormData({ ...formData, projectName: '' });
                    return;
                  }

                  setFormData({ ...formData, projectName: value });
                  if (value) setErrors((prev) => ({ ...prev, projectName: '' }));
                }}
                placeholder="Enter project name"
              />
              <Form.Control.Feedback type="invalid">{errors.projectName}</Form.Control.Feedback>
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Code</Form.Label>

              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={formData.projectCode}
                  onChange={handleCodeEdit}
                  placeholder="Click Generate"
                  isInvalid={!!errors.projectCode}
                />
                <Form.Control.Feedback type="invalid">{errors.projectCode}</Form.Control.Feedback>

                <Button variant="primary" onClick={generateProjectCode}>
                  Generate
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <Form.Label className="required">Industry Type</Form.Label>
              <Select
                options={industryOptions}
                value={industryOptions.find((o) => o.value === formData.IndustryType)}
                isClearable
                onChange={(v) => {
                  setFormData({ ...formData, IndustryType: v?.value || '' });
                  setErrors((prev) => ({ ...prev, IndustryType: '' }));
                }}
              />
              {errors.IndustryType && <div className="text-danger mt-1 small">{errors.IndustryType}</div>}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Label className="required">Frequency</Form.Label>
              <Select
                options={frequencyOptions}
                value={frequencyOptions.find((o) => o.value === formData.projectFrequency)}
                onChange={handleFrequencyChange}
                isClearable
              />
              {errors.projectFrequency && <div className="text-danger mt-1 small">{errors.projectFrequency}</div>}
            </Col>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {formData.projectFrequency === 'Weekly' && (
                <Col md={3}>
                  <Form.Label className="required">Delivery Day</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.find((d) => d.value === schedule.day) || null}
                    onChange={(v) => {
                      setSchedule({ ...schedule, day: v?.value || '' });
                      setErrors((prev) => ({ ...prev, day: '' }));
                    }}
                    isClearable
                  />
                  {errors.day && <div className="text-danger mt-1 small">{errors.day}</div>}
                </Col>
              )}
              {formData.projectFrequency === 'Bi-Weekly' && (
                <Col md={3}>
                  <Form.Label className="required">Delivery Day(s)</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.filter((d) => schedule.day?.split(',').includes(d.value))}
                    onChange={(selectedOptions) => {
                      if (selectedOptions && selectedOptions.length > 2) {
                        toast.error('You can select only 2 days'); // Or any alert method
                        return;
                      }
                      setSchedule({
                        ...schedule,
                        day: selectedOptions ? selectedOptions.map((opt) => opt.value).join(',') : ''
                      });
                      setErrors((prev) => ({ ...prev, day: '' }));
                    }}
                    isClearable
                    isMulti
                    placeholder="Select up to 2 days"
                  />
                  {errors.day && <div className="text-danger mt-1 small">{errors.day}</div>}
                </Col>
              )}

              {/* BI-WEEKLY / BI-MONTHLY → FIRST DATE */}
              {['Bi-Monthly'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">First Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={schedule.firstDate ? dayjs().date(parseInt(schedule.firstDate)) : null}
                    onChange={(v) => {
                      setSchedule({
                        ...schedule,
                        firstDate: v ? dayjs(v).format('DD') : '',
                        secondDate: ''
                      });
                      setErrors((prev) => ({ ...prev, firstDate: '' }));
                    }}
                    slotProps={{
                      textField: { fullWidth: true, size: 'small', error: !!errors.firstDate, helperText: errors.firstDate }
                    }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {['Bi-Monthly'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">Second Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={schedule.secondDate ? dayjs().date(parseInt(schedule.secondDate)) : null}
                    maxDate={schedule.firstDate ? dayjs().date(parseInt(schedule.firstDate)).add(30, 'day') : null}
                    minDate={schedule.firstDate ? dayjs().date(Number(schedule.firstDate)).add(1, 'day') : null}
                    onChange={(v) => {
                      setSchedule({
                        ...schedule,
                        secondDate: v ? dayjs(v).format('DD') : ''
                      });
                      setErrors((prev) => ({ ...prev, secondDate: '' }));
                    }}
                    slotProps={{
                      textField: { fullWidth: true, size: 'small', error: !!errors.secondDate, helperText: errors.secondDate }
                    }}
                    inputFormat="DD"
                  />
                </Col>
              )}
              {/* MONTHLY */}
              {['Custom'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    value={schedule.date ? dayjs(schedule.date, 'YYYY-MM-DD') : null}
                    format="YYYY-MM-DD"
                    minDate={dayjs()}
                    onChange={(v) => {
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('YYYY-MM-DD') : ''
                      });
                      setErrors((prev) => ({ ...prev, date: '' }));
                    }}
                    slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.date, helperText: errors.date } }}
                  />
                </Col>
              )}
              {['Monthly'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only allow selecting the day
                    value={schedule.date ? dayjs().date(parseInt(schedule.date)) : null} // show selected day
                    onChange={(v) => {
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('DD') : '' // store day as string
                      });
                      setErrors((prev) => ({ ...prev, date: '' }));
                    }}
                    slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.date, helperText: errors.date } }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {/* TIME → ALWAYS */}
              {formData.projectFrequency && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Time</Form.Label>
                  <TimePicker
                    ampm={false}
                    value={schedule.time}
                    onChange={(v) => {
                      setSchedule({ ...schedule, time: v });
                      setErrors((prev) => ({ ...prev, time: '' }));
                    }}
                    slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.time, helperText: errors.time } }}
                  />
                </Col>
              )}
            </LocalizationProvider>
          </Row>

          <Row className="mb-3">
            <Col md={3}>
              <Form.Label className="required">Delivery Type</Form.Label>
              <Select
                options={deliveryOptions}
                value={deliveryOptions.find((o) => o.value === formData.deliveryType)}
                onChange={(v) => {
                  setFormData({ ...formData, deliveryType: v?.value || '' });
                  setErrors((prev) => ({ ...prev, deliveryType: '' }));
                }}
                isClearable
              />
              {errors.deliveryType && <div className="text-danger mt-1 small">{errors.deliveryType}</div>}
            </Col>
            <Col md={3}>
              <Form.Label className="required">Delivery Mode</Form.Label>
              <Select
                options={deliveryModeOptions}
                value={deliveryModeOptions.find((o) => o.value === formData.deliveryMode)}
                onChange={(v) => {
                  setFormData({ ...formData, deliveryMode: v?.value || '' });
                  setErrors((prev) => ({ ...prev, deliveryMode: '' }));
                }}
                isClearable
              />
              {errors.deliveryMode && <div className="text-danger mt-1 small">{errors.deliveryMode}</div>}
            </Col>

            <Col md={3}>
              <Form.Label className="required">BDE (Bussiness Development Executive)</Form.Label>
              <Select
                options={SalesOptions}
                value={formData.salesPerson}
                onChange={(v) => {
                  setFormData({ ...formData, salesPerson: v });
                  setErrors((prev) => ({ ...prev, salesPerson: '' }));
                }}
                isClearable
              />
              {errors.salesPerson && <div className="text-danger mt-1 small">{errors.salesPerson}</div>}
            </Col>
            <Col md={3}>
              <Form.Label className="required">Client Success Manager</Form.Label>
              <Select
                options={csManagerOptions}
                value={formData.csprojectManager}
                onChange={(v) => {
                  setFormData({ ...formData, csprojectManager: v });
                  setErrors((prev) => ({ ...prev, csprojectManager: '' }));
                }}
                isClearable
              />
              {errors.csprojectManager && <div className="text-danger mt-1 small">{errors.csprojectManager}</div>}
            </Col>
            {/* <Col md={4}>
              <Form.Label className="required"> Project Priority</Form.Label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find((o) => o.value === formData.projectPriority)}
                onChange={(v) => setFormData({ ...formData, projectPriority: v.value })}
                isClearable
              />
            </Col> */}
          </Row>

          <Row className="mb-3">
            <Col md={3}>
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
                  setErrors((prev) => ({ ...prev, department: '' }));

                  fetchmanager(v?.value);
                }}
                isClearable
              />
              {errors.department && <div className="text-danger mt-1 small">{errors.department}</div>}
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectManager}
                onChange={(v) => {
                  setFormData({ ...formData, projectManager: v });
                  setErrors((prev) => ({ ...prev, projectManager: '' }));
                  toast.success('Project code updated');
                }}
                isClearable
              />
              {errors.projectManager && <div className="text-danger mt-1 small">{errors.projectManager}</div>}
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Technical Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectTechManager}
                onChange={(v) => {
                  setFormData({ ...formData, projectTechManager: v });
                  setErrors((prev) => ({ ...prev, projectTechManager: '' }));
                }}
                isClearable
              />
              {errors.projectTechManager && <div className="text-danger mt-1 small">{errors.projectTechManager}</div>}
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <FileDropZone label="SOW Document" file={sowFile} setFile={setSowFile} error={errors.sowFile} />
            </Col>

            <Col md={4}>
              <FileDropZone label="Input Document" file={inputFile} setFile={setInputFile} />
            </Col>
            <Col md={4}>
              <FileDropZone label="Annotation Document" file={annotationFile} setFile={setAnnotationFile} />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label className="required">Description</Form.Label>

              <div className={errors.description ? 'border border-danger rounded' : ''}>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => {
                    setFormData({ ...formData, description: value });
                    if (value && value !== '<p><br></p>') {
                      setErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Enter detailed description..."
                />
              </div>

              {errors.description && <div className="text-danger mt-1">{errors.description}</div>}
            </Col>
          </Row>

          <div className="d-flex justify-content-end align-items-center mt-3">
            <Button variant="dark" onClick={() => navigator(-1)}>
              <IoArrowBack /> Back
            </Button>

            <Button variant="dark" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Submit'}
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
};

export default CreateProject;
