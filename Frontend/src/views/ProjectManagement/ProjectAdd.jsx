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

// import ReactQuill from 'react-quill';

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
      console.log("csManager" , res.data.data || []);
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
    if (!formData.projectName?.trim()) {
      toast.error('Project Name is required');
      return false;
    }
    if (!formData.projectCode?.trim()) {
      toast.error('Project code is required');
      return false;
    }

    if (!formData.description?.trim()) {
      toast.error('Description is required');
      return false;
    }

    if (!formData.deliveryType) {
      toast.error('Delivery Type is required');
      return false;
    }
    if (!formData.deliveryMode) {
      toast.error('Delivery Type is required');
      return false;
    }

    if (!formData.IndustryType) {
      toast.error('Industry Type is required');
      return false;
    }

    if (!formData.department) {
      toast.error('Department is required');
      return false;
    }

    // if (!formData.projectPriority) {
    //   toast.error('Project Priority is required');
    //   return false;
    // }

    if (!formData.projectFrequency) {
      toast.error('Project Frequency is required');
      return false;
    }

    if (!formData.projectManager) {
      toast.error('Project Manager is required');
      return false;
    }
    if (!formData.csprojectManager) {
      toast.error('CS Manager is required');
      return false;
    }
    if (!formData.projectTechManager) {
      toast.error('Project Tech Manager is required');
      return false;
    }

    if (!formData.salesPerson) {
      toast.error('Sales Person is required');
      return false;
    }

    if (!sowFile || sowFile.length === 0) {
      toast.error('SOW document is required');
      return false;
    }

    // if (!inputFile || inputFile.length === 0) {
    //   toast.error('Input document is required');
    //   return false;
    // }
    if (formData.projectFrequency) {
      if (!schedule.time) {
        toast.error('Delivery time is required');
        return false;
      }

      if (['Weekly', 'Bi-Weekly'].includes(formData.projectFrequency) && !schedule.day) {
        toast.error('Delivery day is required');
        return false;
      }

      if (['Custom'].includes(formData.projectFrequency) && !schedule.date) {
        toast.error('Delivery date is required');
        return false;
      }
    }

    // if (!annotationFile || annotationFile.length === 0) {
    //   toast.error('Annotation document is required');
    //   return false;
    // }

    return true;
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
  const FileDropZone = ({ label, file, setFile }) => {
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
      </>
    );
  };
  const generateProjectCode = () => {
    const managerCode = formData.projectManager ? getManagerCode(formData.projectManager.label) : 'XX';
    const bdecode = formData.salesPerson ? getManagerCode(formData.salesPerson.label) : 'XX';
    const random4Digit = Math.floor(1000 + Math.random() * 9000);

    const code = `ACT-${bdecode}${managerCode}-${random4Digit}`;
//ACT-ARSS-1334
    setFormData((prev) => ({
      ...prev,
      projectCode: code
    }));
  };
const handleCodeEdit = (e) => {
  // Get only digits (max 4)
  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);

  // Extract prefix: ACT-BDE-MGR
  const match = (formData.projectCode || '').match(/^([A-Z]+-[A-Z]+-[A-Z]+)/);

  const prefix = match ? match[1] : 'ACT-XX-XX';

  setFormData((prev) => ({
    ...prev,
    projectCode: `${prefix}${digits}`
  }));
};
  useEffect(() => {
    generateProjectCode();
  }, [formData.projectManager || '', formData.salesPerson || '']);
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
                }}
                placeholder="Enter project name"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Code</Form.Label>

              <div className="d-flex gap-2">
                <Form.Control type="text" value={formData.projectCode} onChange={handleCodeEdit} placeholder="Click Generate" />

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
                onChange={(v) => setFormData({ ...formData, IndustryType: v?.value || '' })}
              />
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
            </Col>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {formData.projectFrequency === 'Weekly' && (
                <Col md={3}>
                  <Form.Label className="required">Delivery Day</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.find((d) => d.value === schedule.day) || null}
                    onChange={(v) => setSchedule({ ...schedule, day: v?.value || '' })}
                    isClearable
                  />
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
                    }}
                    isClearable
                    isMulti
                    placeholder="Select up to 2 days"
                  />
                </Col>
              )}

              {/* BI-WEEKLY / BI-MONTHLY → FIRST DATE */}
              {['Bi-Monthly'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">First Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={schedule.firstDate ? dayjs().date(parseInt(schedule.firstDate)) : null}
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        firstDate: v ? dayjs(v).format('DD') : '',
                        secondDate: '' 
                      })

                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
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
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        secondDate: v ? dayjs(v).format('DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
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
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('YYYY-MM-DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
              {['Monthly'].includes(formData.projectFrequency) && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only allow selecting the day
                    value={schedule.date ? dayjs().date(parseInt(schedule.date)) : null} // show selected day
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('DD') : '' // store day as string
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
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
                    onChange={(v) => setSchedule({ ...schedule, time: v })}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
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
                onChange={(v) => setFormData({ ...formData, deliveryType: v?.value || '' })}
                isClearable
              />
            </Col>
            <Col md={3}>
              <Form.Label className="required">Delivery Mode</Form.Label>
              <Select
                options={deliveryModeOptions}
                value={deliveryModeOptions.find((o) => o.value === formData.deliveryMode)}
                onChange={(v) => setFormData({ ...formData, deliveryMode: v?.value || '' })}
                isClearable
              />
            </Col>
                    

            <Col md={3}>
              <Form.Label className="required">BDE (Bussiness Development Executive)</Form.Label>
              <Select
                options={SalesOptions}
                value={formData.salesPerson}
                onChange={(v) => setFormData({ ...formData, salesPerson: v })}
                isClearable
              />
            </Col>
             <Col md={3}>
              <Form.Label className="required">Client Success Manager</Form.Label>
              <Select
                options={csManagerOptions}
                value={formData.csprojectManager}
                onChange={(v) => setFormData({ ...formData, csprojectManager: v })}
                isClearable
              />
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

                  fetchmanager(v?.value);
                }}
                isClearable
              />
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectManager}
                onChange={(v) => {
                  setFormData({ ...formData, projectManager: v });
                  toast.success('Project code updated');
                }}
                isClearable
              />
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Technical Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectTechManager}
                onChange={(v) => setFormData({ ...formData, projectTechManager: v })}
                isClearable
              />
            </Col>
   
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <FileDropZone label="SOW Document" file={sowFile} setFile={setSowFile} />
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
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
