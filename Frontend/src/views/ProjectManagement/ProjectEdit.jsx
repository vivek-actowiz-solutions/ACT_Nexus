import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import Select from 'react-select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { api } from 'views/api';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'react-toastify/dist/ReactToastify.css';
import { IoArrowBack } from 'react-icons/io5';
import { CgLogIn } from 'react-icons/cg';

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

const deliveryModeOptions = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'FTP Server', value: 'FTP' },
  { label: 'SFTP Server', value: 'SFTP' },
  { label: 'AWS S3 Bucket', value: 'S3' },
  { label: 'Google Drive', value: 'GOOGLE_DRIVE' }
];

const departments = [
  { label: 'Operation', value: 'Operation' },
  { label: 'R&D', value: 'R&D' }
];

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ label: d, value: d }));

/* ================= COMPONENT ================= */

const EditProject = () => {
  document.title = 'Edit Project';

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [managerList, setManagerList] = useState([]);
  const [salesList, setSalesList] = useState([]);

  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({});
  console.log('FormData', formData);
  const [updatedFields, setUpdatedFields] = useState({});

  const [schedule, setSchedule] = useState({
    day: '',
    date: '',
    firstDate: '',
    secondDate: '',
    time: null
  });

  const [sowFile, setSowFile] = useState([]);
  const [inputFile, setInputFile] = useState([]);
  const [annotationFile, setAnnotationFile] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [removedSow, setRemovedSow] = useState([]);
  const [removedInput, setRemovedInput] = useState([]);
  const [removedAnnotation, setRemovedAnnotation] = useState([]);

  /* ================= FETCH PROJECT ================= */

  useEffect(() => {
    fetchProject();
    fetchSales();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${api}/Project-list/${id}`, { withCredentials: true });
      const p = res.data.data;

      setOriginalData(p);

      setFormData({
        projectName: p.projectName || '',
        projectCode: p.projectCode || '',
        description: p.description || '',
        deliveryType: p.deliveryType || '',
        deliveryMode: p.deliveryMode || '',
        IndustryType: p.industryType || '',
        department: p.department || '',
        projectPriority: p.projectPriority || '',
        projectFrequency: p.projectFrequency?.frequencyType || '',
        projectManager: p.projectManager ? { value: p.projectManager._id, label: p.projectManager.name } : null,
        projectTechManager: p.projectTechManager ? { value: p.projectTechManager._id, label: p.projectTechManager.name } : null,
        bde: p.bde ? { value: p.bde._id, label: p.bde.name } : null,
        teamLead: Array.isArray(p.teamLead)
          ? p.teamLead.map((u) => ({
              value: u._id,
              label: u.name
            }))
          : [],
        projectCoordinator: p.projectCoordinator ? { value: p.projectCoordinator._id, label: p.projectCoordinator.name } : null
      });

      setSchedule({
        day: p.projectFrequency?.deliveryDay || '',
        date: p.projectFrequency?.deliveryDate || '',
        firstDate: p.projectFrequency?.firstDate || '',
        secondDate: p.projectFrequency?.secondDate || '',
        time: p.projectFrequency?.deliveryTime ? dayjs(p.projectFrequency.deliveryTime, 'HH:mm') : null
      });

      setSowFile(p.sowDocument || []);
      setInputFile(p.inputDocument || []);
      setAnnotationFile(p.annotationDocument || []);

      if (p.department) {
        fetchManagers(p.department);
        fetchAssignUsers(p.department);
      }
    } catch {
      toast.error('Failed to load project');
    }
  };

  const fetchManagers = async (department) => {
    const res = await axios.get(`${api}/users-list?department=${encodeURIComponent(department)}&manager=true`, {
      withCredentials: true
    });
    setManagerList(res.data.data || []);
  };

  const fetchSales = async () => {
    const res = await axios.get(`${api}/users-list?department=Sales&BDE=true`, {
      withCredentials: true
    });
    setSalesList(res.data.data || []);
  };

  const ManagerOptions = managerList.map((u) => ({ value: u._id, label: u.name }));
  const SalesOptions = salesList.map((u) => ({ value: u._id, label: u.name }));
  const fetchAssignUsers = async (department) => {
    try {
      const res = await axios.get(`${api}/project-assign-users?department=${encodeURIComponent(department)}`, { withCredentials: true });

      setTeamLeads(
        (res.data.teamLeads || []).map((u) => ({
          label: u.name,
          value: u._id
        }))
      );

      setCoordinators(
        (res.data.coordinators || []).map((u) => ({
          label: u.name,
          value: u._id
        }))
      );
    } catch (err) {
      toast.error('Failed to load assign users');
    }
  };
  /* ================= CHANGE HANDLER ================= */

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    const originalValue = originalData[key]?._id || originalData[key];

    if (value?.value !== originalValue) {
      setUpdatedFields((prev) => ({ ...prev, [key]: value }));
    } else {
      setUpdatedFields((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasFileChanges =
      sowFile.some((f) => f instanceof File) ||
      inputFile.some((f) => f instanceof File) ||
      annotationFile.some((f) => f instanceof File) ||
      removedSow.length ||
      removedInput.length ||
      removedAnnotation.length;

    if (Object.keys(updatedFields).length === 0 && !hasFileChanges) {
      toast.info('No changes detected');
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append('projectName', formData.projectName);
     Object.entries(updatedFields).forEach(([key, value]) => {

  // ✅ MULTI SELECT (teamLead)
  if (Array.isArray(value) && value.length && value[0]?.value) {
    value.forEach((v) => {
      form.append(`${key}[]`, v.value);
    });
    return;
  }

  // ✅ SINGLE SELECT
  if (value?.value) {
    form.append(key, value.value);
    return;
  }

  // ✅ OBJECT
  if (typeof value === 'object') {
    form.append(key, JSON.stringify(value));
    return;
  }

  // ✅ STRING / NUMBER
  form.append(key, value);
});

      // new uploaded files
      sowFile.forEach((f) => f instanceof File && form.append('sowDocument', f));
      inputFile.forEach((f) => f instanceof File && form.append('inputDocument', f));
      annotationFile.forEach((f) => f instanceof File && form.append('annotationDocument', f));

      // removed existing files
      // removedSow.forEach((f) => form.append('removedSowDocument', f));
      // removedInput.forEach((f) => form.append('removedInputDocument', f));
      // removedAnnotation.forEach((f) => form.append('removedAnnotationDocument', f));

      const res = await axios.put(`${api}/Project-update/${id}`, form, { withCredentials: true });
      if (res.status === 200) {
        toast.success('Project updated successfully');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILE DROP ================= */

  const FileDropZone = ({ label, file, setFile }) => {
    console.log('File', file);
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
        {file.map((f, i) => {
          const isNewFile = typeof f !== 'string'; // File object vs existing file

          return (
            <div key={i} className="mt-2 p-2 border rounded d-flex justify-content-between align-items-center">
              {/* File name */}
              <div className="fw-semibold text-truncate" style={{ maxWidth: '300px' }} title={isNewFile ? f.name : f}>
                {isNewFile ? f.name : f.replace(/^uploads\//, '').replace(/\//g, '_')}
              </div>

              <div className="d-flex gap-2">
                {/* ✅ Existing file → Download only */}
                {!isNewFile && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => window.open(`${import.meta.env.VITE_BACKEND_FILES_URL}${f}`, '_blank')}
                  >
                    Download
                  </Button>
                )}

                {/* ✅ New uploaded file → Remove only */}
                {isNewFile && (
                  <Button size="sm" variant="outline-danger" onClick={() => setFile((prev) => prev.filter((_, idx) => idx !== i))}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };
  const handleFrequencyChange = (v) => {
    const value = v?.value || '';

    setFormData((prev) => ({ ...prev, projectFrequency: value }));

    // reset schedule on frequency change
    const clearedSchedule = {
      day: '',
      date: '',
      firstDate: '',
      secondDate: '',
      time: null
    };
    setSchedule(clearedSchedule);

    // mark as updated
    setUpdatedFields((prev) => ({
      ...prev,
      projectFrequencyConfig: {
        frequencyType: value
      }
    }));
  };
  const handleScheduleChange = (key, value) => {
    setSchedule((prev) => {
      const updated = { ...prev, [key]: value };

      setUpdatedFields((prevFields) => ({
        ...prevFields,
        projectFrequencyConfig: {
          frequencyType: formData.projectFrequency,
          deliveryDay: updated.day || null,
          deliveryDate: updated.date || null,
          firstDate: updated.firstDate || null,
          secondDate: updated.secondDate || null,
          deliveryTime: updated.time ? updated.time.format('HH:mm') : null
        }
      }));

      return updated;
    });
  };

  /* ================= UI ================= */

  return (
    <>
      <ToastContainer />
      <Card title="Edit Project">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>Project Name</Form.Label>
              <Form.Control value={formData.projectName} onChange={(e) => handleChange('projectName', e.target.value)} disabled />
            </Col>
            <Col md={4}>
              <Form.Label>Project Code</Form.Label>
              <Form.Control value={formData.projectCode} onChange={(e) => handleChange('projectCode', e.target.value)} disabled />
            </Col>
            <Col md={4}>
              <Form.Label className="required">Industry Type</Form.Label>
              <Select
                options={industryOptions}
                value={industryOptions.find((o) => o.value === formData.IndustryType)}
                isClearable
                onChange={(v) => handleChange('industryType', v?.value || '')}
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
              {/* WEEKLY */}
              {formData.projectFrequency === 'Weekly' && (
                <Col md={3}>
                  <Form.Label className="required">Delivery Day</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.find((d) => d.value === schedule.day) || null}
                    onChange={(v) => handleScheduleChange('day', v?.value || '')}
                    isClearable
                  />
                </Col>
              )}

              {/* BI-WEEKLY */}
              {formData.projectFrequency === 'Bi-Weekly' && (
                <Col md={3}>
                  <Form.Label className="required">Delivery Day(s)</Form.Label>
                  <Select
                    options={dayOptions}
                    isMulti
                    value={dayOptions.filter((d) => schedule.day?.split(',').includes(d.value))}
                    onChange={(opts) => {
                      if (opts && opts.length > 2) {
                        toast.error('You can select only 2 days');
                        return;
                      }
                      handleScheduleChange('day', opts ? opts.map((o) => o.value).join(',') : '');
                    }}
                  />
                </Col>
              )}

              {/* BI-MONTHLY */}
              {formData.projectFrequency === 'Bi-Monthly' && (
                <>
                  <Col md={2}>
                    <Form.Label className="required">First Date</Form.Label>
                    <DatePicker
                      views={['day']}
                      value={schedule.firstDate ? dayjs().date(Number(schedule.firstDate)) : null}
                      onChange={(v) => handleScheduleChange('firstDate', v ? dayjs(v).format('DD') : '')}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Col>

                  <Col md={2}>
                    <Form.Label className="required">Second Date</Form.Label>
                    <DatePicker
                      views={['day']}
                      value={schedule.secondDate ? dayjs().date(Number(schedule.secondDate)) : null}
                      onChange={(v) => handleScheduleChange('secondDate', v ? dayjs(v).format('DD') : '')}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Col>
                </>
              )}

              {/* CUSTOM */}
              {formData.projectFrequency === 'Custom' && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    value={schedule.date ? dayjs(schedule.date) : null}
                    minDate={dayjs()}
                    onChange={(v) => handleScheduleChange('date', v ? dayjs(v).format('YYYY-MM-DD') : '')}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}

              {/* MONTHLY */}
              {formData.projectFrequency === 'Monthly' && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    views={['day']}
                    value={schedule.date ? dayjs().date(Number(schedule.date)) : null}
                    onChange={(v) => handleScheduleChange('date', v ? dayjs(v).format('DD') : '')}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}

              {/* TIME */}
              {formData.projectFrequency && (
                <Col md={2}>
                  <Form.Label className="required">Delivery Time</Form.Label>
                  <TimePicker
                    ampm={false}
                    value={schedule.time}
                    onChange={(v) => handleScheduleChange('time', v)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
            </LocalizationProvider>
          </Row>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label className="required">Delivery Type</Form.Label>
              <Select
                options={deliveryOptions}
                value={deliveryOptions.find((o) => o.value === formData.deliveryType)}
                onChange={(v) => handleChange('deliveryType', v?.value || '')}
                isClearable
              />
            </Col>
            <Col md={4}>
              <Form.Label className="required">Delivery Mode</Form.Label>
              <Select
                options={deliveryModeOptions}
                value={deliveryModeOptions.find((o) => o.value === formData.deliveryMode)}
                onChange={(v) => handleChange('deliveryMode', v?.value || '')}
                isClearable
              />
            </Col>

            <Col md={4}>
              <Form.Label>Priority</Form.Label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find((o) => o.value === formData.projectPriority)}
                onChange={(v) => handleChange('projectPriority', v?.value)}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Label>Department</Form.Label>
              <Select
                options={departments}
                value={departments.find((o) => o.value === formData.department)}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, projectManager: '' }));
                  setFormData((prev) => ({ ...prev, projectTechManager: '' }));
                  handleChange('department', v?.value);
                  fetchManagers(v?.value);
                }}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Project Manager</Form.Label>
              <Select options={ManagerOptions} value={formData.projectManager} onChange={(v) => handleChange('projectManager', v)} />
            </Col>
            <Col md={3}>
              <Form.Label className="required">Project Technical Manager</Form.Label>
              <Select
                options={ManagerOptions}
                value={formData.projectTechManager}
                onChange={(v) => handleChange('projectTechManager', v || '')}
                isClearable
              />
            </Col>
            <Col md={3}>
              <Form.Label>Sales Person</Form.Label>
              <Select options={SalesOptions} value={formData.bde} onChange={(v) => handleChange('bde', v)} />
            </Col>
          </Row>
          {formData.teamLead && formData.projectCoordinator && (
              <Row className="mb-3">
            <Col md={6}>
              <Form.Label>Team Lead</Form.Label>
              <Select options={teamLeads} value={formData.teamLead} onChange={(v) => handleChange('teamLead', v)} isMulti isClearable />
            </Col>

            <Col md={6}>
              <Form.Label>Project Coordinator</Form.Label>
              <Select
                options={coordinators}
                value={formData.projectCoordinator}
                onChange={(v) => handleChange('projectCoordinator', v)}
                isClearable
              />
            </Col>
          </Row>
          )}
        
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
            <Col>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Col>
          </Row>

          <div className="text-end">
            <Button variant="dark" disabled={loading} onClick={() => navigate(-1)}>
              <IoArrowBack /> Back
            </Button>
            <Button type="submit" variant="dark" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Update Project'}
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
};

export default EditProject;
