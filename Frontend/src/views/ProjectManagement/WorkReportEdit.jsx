import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Spinner, Table, Badge } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from 'views/api';
import Select from 'react-select';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { id } from 'date-fns/locale';

/* ---------------- CONSTANTS ---------------- */

const TASK_TYPES = [
  { value: 'New Development', label: 'New Development' },
  { value: 'Bug Fix', label: 'Bug Fix' },
  { value: 'Change Request', label: 'Change Request' },
  { value: 'Optimization', label: 'Optimization' },
  { value: 'Structure Wise Changes', label: 'Structure Wise Changes' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Team Meeting', label: 'Team Meeting' },
  { value: 'Research', label: 'Research' },
  { value: 'Other', label: 'Other' }
];

const createEmptyForm = () => ({
  projectId: null,
  feedId: null,
  taskType: null,
  description: '',
  workDate: dayjs(),
  hours: 0,
  minutes: 0
});

const WorkReportEdit = () => {
  const { state } = useLocation();
  const date = state?.date || dayjs().format('YYYY-MM-DD');
  const developerId = state?.developerId || null;
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [form, setForm] = useState(createEmptyForm());
  const [workList, setWorkList] = useState([]);

  console.log('work report', workList);
  const [initialWorkList, setInitialWorkList] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState(null);
  console.log('editingId', editingId);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH PROJECTS ---------------- */

  useEffect(() => {
    axios
      .get(`${api}/project-list-workreport?Active=true`, { withCredentials: true })
      .then((res) => setProjects(res.data?.data || []))
      .catch(() => toast.error('Failed to fetch projects'));
    fetchWork();
  }, []);

  const fetchWork = async () => {
    try {
      const res = await axios.get(`${api}/work-list-workreport?developerId=${developerId}&date=${date}`, {
        withCredentials: true
      });
      console.log('res', res);
      const reports = res.data.data[0].reports || [];
      console.log('report ', reports);
      const formatted = reports.map((r) => {
        const [h, m] = r.timeSpent.split(':');
        return {
          id: Date.now() + Math.random(),
          projectId: r.projectId._id,
          projectName: r.projectId.projectName,
          projectCode: r.projectId.projectCode,
          feedId: r.feedId._id,
          feedName: r.feedId.feedName,
          taskType: r.taskType,
          description: r.description,
          workDate: date,
          hours: Number(h),
          minutes: Number(m)
        };
      });

      setWorkList(formatted);
      setInitialWorkList(formatted); // store original snapshot
      setHasChanges(false); // no changes initially
    } catch {
      toast.error('Failed to fetch work');
    }
  };

  const fetchFeeds = async (projectId) => {
    try {
      const res = await axios.get(`${api}/Feeds-list-workreport/${projectId}?Active=true`, {
        withCredentials: true
      });
      setFeeds(res.data?.data || []);
    } catch {
      toast.error('Failed to fetch feeds');
    }
  };

  /* ---------------- DUPLICATE CHECK ---------------- */

  const isDuplicateWork = (newWork) =>
    workList.some(
      (w) =>
        w.projectId === newWork.projectId &&
        w.feedId === newWork.feedId &&
        w.workDate === newWork.workDate &&
        w.description.toLowerCase() === newWork.description.toLowerCase() &&
        w.id !== editingId
    );

  /* ---------------- ADD / UPDATE ---------------- */

  const handleSaveWork = () => {
    if (!form.projectId || !form.feedId || !form.taskType) {
      toast.error('Please complete all required fields');
      return;
    }

    if (form.hours === 0 && form.minutes === 0) {
      toast.error('Time spent cannot be zero');
      return;
    }

    const project = projects.find((p) => p._id === form.projectId);
    const feed = feeds.find((f) => f._id === form.feedId);

    if (!project || !feed) {
      toast.error('Invalid project or feed');
      return;
    }

    const payload = {
      id: editingId || Date.now(),
      projectId: project._id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      feedId: feed._id,
      feedName: feed.feedName,
      taskType: form.taskType,
      description: form.description.trim(),
      workDate: form.workDate.format('YYYY-MM-DD'),
      hours: Number(form.hours),
      minutes: Number(form.minutes)
    };

    if (isDuplicateWork(payload)) {
      toast.error('Duplicate entry detected');
      return;
    }

    setWorkList((prev) => {
      const updated = editingId ? prev.map((w) => (w.id === editingId ? payload : w)) : [...prev, payload];

      setHasChanges(true); // 🔴 mark change
      return updated;
    });

    toast.success(editingId ? 'Work updated' : 'Work added');
    resetForm();
  };

  /* ---------------- EDIT ---------------- */

  const handleEdit = (item) => {
    console.log('item', item);
    setForm({
      projectId: item.projectId,
      feedId: item.feedId,
      taskType: item.taskType,
      description: item.description,
      workDate: dayjs(item.workDate),
      hours: item.hours,
      minutes: item.minutes
    });

    fetchFeeds(item.projectId);
    setEditingId(item.id);
  };

  /* ---------------- REMOVE ---------------- */

  const handleRemove = (id) => {
    setWorkList((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      setHasChanges(true); // 🔴 mark change
      return updated;
    });

    if (editingId === id) resetForm();
  };

  /* ---------------- RESET ---------------- */

  const resetForm = () => {
    setForm(createEmptyForm());
    setFeeds([]);
    setEditingId(null);
  };

  /* ---------------- TOTAL TIME ---------------- */

  const totalMinutes = workList.reduce((a, c) => a + c.hours * 60 + c.minutes, 0);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmitAll = async () => {
    if (!workList.length) return toast.error('Add at least one work entry');

    setLoading(true);
    try {
      await axios.post(`${api}/update-WorkReport`, { works: workList , developerId , date}, { withCredentials: true });
      toast.success('Work report submitted successfully');
      navigate('/Work-Report');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <ToastContainer />
      <Row>
        <Col>
          <MainCard title={<div className="d-flex gap-2">Add Work Report {editingId && <Badge bg="warning">Editing</Badge>}</div>}>
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Form.Label>Date</Form.Label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={form.workDate}
                    format="YYYY-MM-DD"
                    maxDate={dayjs()}
                    minDate={dayjs().subtract(4, 'day')}
                    onChange={(v) => setForm({ ...form, workDate: v || dayjs() })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    disabled
                  />
                </LocalizationProvider>
              </Col>

              <Col md={3}>
                <Form.Label className="required">Project </Form.Label>
                <Select
                  options={projects.map((p) => ({ value: p._id, label: `[${p.projectCode}] ${p.projectName}` }))}
                  value={
                    projects
                      .map((p) => ({ value: p._id, label: `[${p.projectCode}] ${p.projectName}` }))
                      .find((o) => o.value === form.projectId) || null
                  }
                  onChange={(s) => {
                    setForm({ ...form, projectId: s?.value || null, feedId: null });
                    if (s) fetchFeeds(s.value);
                  }}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="required">Feed </Form.Label>
                <Select
                  isDisabled={!form.projectId}
                  options={feeds.map((f) => ({ value: f._id, label: f.feedName }))}
                  value={feeds.map((f) => ({ value: f._id, label: f.feedName })).find((o) => o.value === form.feedId) || null}
                  onChange={(s) => setForm({ ...form, feedId: s?.value || null })}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="required">Task Type </Form.Label>
                <Select
                  options={TASK_TYPES}
                  value={TASK_TYPES.find((t) => t.value === form.taskType) || null}
                  onChange={(s) => setForm({ ...form, taskType: s?.value || null })}
                />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Label className="required">Time Spent </Form.Label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    ampm={false}
                    value={dayjs().startOf('day').add(form.hours, 'hour').add(form.minutes, 'minute')}
                    onChange={(v) => v && setForm({ ...form, hours: v.hour(), minutes: v.minute() })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Col>
            </Row>
               <Form.Label className="required">Description </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your work..."
              className="mb-3 required"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="mt-3 d-flex gap-2">
              <Button variant={editingId ? 'warning' : 'success'} onClick={handleSaveWork}>
                {editingId ? 'Update Work' : '+ Add Work'}
              </Button>
              {editingId && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>

            {workList.length > 0 && (
              <>
                <hr />
                <Table bordered hover responsive>
                  <tbody>
                    <tr>
                      <th>#</th>
                      <th>Project</th>
                      <th>Feed</th>
                      <th>Date</th>
                      <th>Time Spent</th>
                      <th>Task Type</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                    {workList.map((w, i) => (
                      <tr key={w.id}>
                        <td>{i + 1}</td>
                        <td>
                          [{w.projectCode}]{w.projectName}
                        </td>
                        <td>{w.feedName}</td>
                        <td>{w.workDate}</td>
                        <td>
                          {w.hours}h {w.minutes}m
                        </td>
                        <td>{w.taskType}</td>
                        <td>{w.description}</td>
                        <td>
                          <Button size="sm" variant="warning" onClick={() => handleEdit(w)}>
                            Edit
                          </Button>{' '}
                          <Button size="sm" variant="danger" onClick={() => handleRemove(w.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="text-end fw-bold">
                  Total Time: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </div>
              </>
            )}

            <div className="mt-4 text-end">
              <Button variant="dark" onClick={handleSubmitAll} disabled={loading || !hasChanges}>
                {loading ? <Spinner size="sm" /> : 'Upload Work Report'}
              </Button> 
            </div>
          </MainCard>
        </Col>
      </Row>
    </>
  );
};

export default WorkReportEdit;
