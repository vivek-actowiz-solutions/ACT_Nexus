import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Form, Spinner, Button, Modal } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from 'views/api';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const WorkReportList = () => {
  const navigate = useNavigate();

  /* ------------------- Table Data ------------------- */
  const [reports, setReports] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  /* ------------------- Users ------------------- */
  const [appliedFromDate, setAppliedFromDate] = useState(null);
  const [appliedToDate, setAppliedToDate] = useState(null);

  /* ------------------- TEMP Filters (UI only) ------------------- */

  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);

  /* ------------------- APPLIED Filters ------------------- */
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* ------------------- Trigger ------------------- */
  const [applyTrigger, setApplyTrigger] = useState(0);

  /* ------------------- Modal ------------------- */
  const [showModal, setShowModal] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [projectData, setProjectData] = useState([]);
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  /* ------------------- Dates ------------------- */
  const last5Days = useMemo(() => Array.from({ length: 5 }, (_, i) => dayjs().subtract(i, 'day').format('YYYY-MM-DD')), []);

  const activeDates =
    appliedFromDate && appliedToDate
      ? Array.from({ length: appliedToDate.diff(appliedFromDate, 'day') + 1 }, (_, i) => appliedFromDate.add(i, 'day').format('YYYY-MM-DD'))
      : last5Days;

  /* ------------------- Fetch Users ------------------- */

useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearch(searchText.trim());
    setPage(1);
    setResetPaginationToggle((p) => !p);
  }, 500);

  return () => clearTimeout(handler);
}, [searchText]);
  /* ------------------- Fetch Reports ------------------- */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { page, limit };

      // 🔍 Search (Developer Name)
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // 📅 Date filter
      if (appliedFromDate && appliedToDate) {
        params.fromDate = appliedFromDate.format('YYYY-MM-DD');
        params.toDate = appliedToDate.format('YYYY-MM-DD');
      } else {
        params.lastDays = 5;
      }

      const res = await axios.get(`${api}/work-reports`, {
        params,
        withCredentials: true
      });

      const { data, total } = res.data;

      const formatted = data.map((dev) => {
        const reportMap = {};
        activeDates.forEach((date) => {
          const found = dev.workreport.find((r) => r.date === date);
          reportMap[date] = found ? found.totalTime : 'N/A';
        });

        return {
          developerName: dev.developerName,
          developerId: dev.developerId,
          ...reportMap
        };
      });

      setReports(formatted);
      setTotalRows(total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- Effects ------------------- */

  useEffect(() => {
    fetchReports();
  }, [page, limit, applyTrigger, debouncedSearch]);

  /* ------------------- Columns ------------------- */
  const columns = [
    {
      name: 'Name',
      selector: (row) => row.developerName,
      sortable: true
    },
    ...activeDates.map((date) => ({
      name: date,
      center: true,
      cell: (row) =>
        row[date] !== 'N/A' ? (
          <span
            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
            onClick={() => handleDateClick(row.developerId, row.developerName, date)}
          >
            {row[date]}
          </span>
        ) : (
          'N/A'
        )
    }))
  ];

  /* ------------------- Modal Handler ------------------- */
  const handleDateClick = async (developerId, developerName, date) => {
    setSelectedDeveloper({ id: developerId, name: developerName });
    setSelectedDate(date);
    setShowModal(true);
    setLoading(true);

    try {
      const res = await axios.get(`${api}/project-workreport`, {
        params: { developerId, date },
        withCredentials: true
      });

      setProjectData(res.data.data.reports || []);
    } catch {
      toast.error('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- UI ------------------- */
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <MainCard title="Work Reports">
        <Row className="mb-3 g-3 align-items-end">
          {/* Select Users */}
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Search by developer name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                height: '40px'
              }}
            />
          </Col>

          {/* Start Date */}
          <Col md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={tempFromDate}
                format="YYYY-MM-DD"
                onChange={setTempFromDate}
                maxDate={dayjs()}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Col>

          {/* End Date */}
          <Col md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={tempToDate}
                format="YYYY-MM-DD"
                onChange={setTempToDate}
                disabled={!tempFromDate}
                minDate={tempFromDate}
                maxDate={tempFromDate ? (tempFromDate.add(4, 'day').isAfter(dayjs()) ? dayjs() : tempFromDate.add(4, 'day')) : dayjs()}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Col>

          {/* Buttons */}
          <Col md={2}>
            <div className="d-flex gap-2">
              <Button
                variant="outline-dark"
                size="sm"
                className="px-3 py-2 mb-1 "
                onClick={() => {
                  setAppliedFromDate(tempFromDate);
                  setAppliedToDate(tempToDate);
                  setPage(1);
                  setResetPaginationToggle((p) => !p);
                  setApplyTrigger((p) => p + 1);
                }}
              >
                Apply
              </Button>

              <Button
                variant="outline-dark"
                size="sm"
                className="px-3 py-2 mb-1"
                onClick={() => {
                  setSearchText('');
                  setDebouncedSearch('');
                  setTempFromDate(null);
                  setTempToDate(null);
                  setAppliedFromDate(null);
                  setAppliedToDate(null);
                  setPage(1);
                  setResetPaginationToggle((p) => !p);
                  setApplyTrigger((p) => p + 1);
                }}
              >
                Clear
              </Button>
            </div>
          </Col>

          {/* Add Button */}
          <Col md={2} className="text-end">
            <Button variant="dark" onClick={() => navigate('/add-work-report')}>
              + Add Work Report
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center my-3">
            <Spinner />
          </div>
        ) : (
      <DataTable
  columns={columns}
  data={reports}
  pagination
  paginationServer
  paginationTotalRows={totalRows}
  paginationDefaultPage={page}
  paginationResetDefaultPage={resetPaginationToggle}
  onChangePage={(p) => setPage(p)}
  onChangeRowsPerPage={(l, p) => {
    setLimit(l);
    setPage(1);
    setResetPaginationToggle((x) => !x);
  }}
  progressPending={loading}
  responsive
  striped
  highlightOnHover
  noHeader
/>
        )}
      </MainCard>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedDeveloper?.name} <span className="text-muted">({selectedDate})</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <Spinner />
          ) : projectData.length === 0 ? (
            <p className="text-center text-muted">No records found</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Feed</th>
                  <th>Hours</th>
                  <th>Task Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map((p, i) => (
                  <tr key={i}>
                    <td>{p?.projectId ? `[${p.projectId.projectCode}] ${p.projectId.projectName}` : '-'}</td>
                    <td>{p?.feedId?.feedName || '-'}</td>
                    <td>{p?.timeSpent || '0:00'}</td>
                    <td>{p?.taskType || '-'}</td>
                    <td>{p?.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default WorkReportList;
