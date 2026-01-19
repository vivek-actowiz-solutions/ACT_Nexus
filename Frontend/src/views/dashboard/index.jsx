import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Spinner, Container, Form, Button } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import Select from 'react-select';
import axios from 'axios';
import { api } from 'views/api';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { FaClock } from 'react-icons/fa6';

/* ===================== STATUS OPTIONS ===================== */
const feedStatusOptions = [
  'Scheduled',
  'New',
  'Assigned to Developer',
  'Under Development',
  'Bug Fixing',
  'Waiting from Client',
  'Blocking Issue',
  'Crawl Running',
  'Crawl Finished',
  'In QA',
  'QA Passed',
  'Sample Delivered',
  'Sample Approved',
  'BAU',
  'Once off Delivered',
  'Able to Recover',
  'Feed missed',
  'Close'
];

/* ===================== STATUS COLOR HELPER ===================== */
const getStatusVariant = (status = '') => {
  const s = status.toLowerCase();
  if (s.includes('new') || s.includes('assigned')) return 'primary';
  if (s.includes('development') || s.includes('running')) return 'info';
  if (s.includes('bug') || s.includes('issue') || s.includes('missed')) return 'danger';
  if (s.includes('waiting')) return 'warning';
  if (s.includes('finished') || s.includes('passed') || s.includes('approved') || s.includes('bau')) return 'success';
  if (s.includes('delivered')) return 'success';
  if (s.includes('close') || s.includes('recover')) return 'secondary';
  return 'dark';
};

/* ===================== COMPACT TOTAL + STATUS CARD ===================== */
const CompactTotalCard = ({ title, count, variant }) => (
  <Card className="border-0 shadow-sm rounded-3">
    <Card.Body className="ps-3 pt-2 pb-2">
      <h6 className="text-muted text-uppercase fw-semibold mb-1 fs-7">{title}</h6>
      <h5 className={`fw-bold text-${variant} m-0 fs-5`}>{count}</h5>
    </Card.Body>
    <div className={`bg-${variant} rounded-bottom`} style={{ height: 3 }} />
  </Card>
);

const CompactStatusCard = ({ label, count }) => {
  const variant = getStatusVariant(label);

  return (
    <Card className="border-0 shadow-sm h-100 rounded-3 status-card">
      <Card.Body className="p-2">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-1">
          {/* STATUS TEXT */}
          <div className="status-text">
            <h6 className="fw-semibold text-dark mb-0 fs-7">{label}</h6>
          </div>

          {/* COUNT BADGE */}
          <Badge bg={variant} className="px-2 py-1 rounded-pill fs-7 fw-bold badge-fixed">
            {count}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
};
const frequencyOptions = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Bi-Monthly', 'Custom'];

const dateFilters = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Next Week', value: 'nextWeek' },
  { label: 'This Month', value: 'thisMonth' }
  // { label: 'Custom Range', value: 'custom' }
];

// const getStatusVariant = (status = '') => {
//   const s = status.toLowerCase();
//   if (s.includes('new')) return 'primary';
//   if (s.includes('bug') || s.includes('issue')) return 'danger';
//   if (s.includes('qa') || s.includes('approved')) return 'success';
//   if (s.includes('waiting')) return 'warning';
//   return 'secondary';
// };

/* ===================== MAIN DASHBOARD ===================== */
const ProjectFeedDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({ total: 0 });
  const [feeds, setFeeds] = useState({ total: 0, statusWiseCount: [] });
  const [data, setData] = useState([]);
  const [frequencyLoading, setFrequencyLoading] = useState(false);

  // Pagination & Sort State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Filters State
  const [filter, setFilter] = useState({ label: 'Today', value: 'today' });
  const [frequencyType, setFrequencyType] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial Data Fetch (Counts)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${api}/project-feed-count`, { withCredentials: true });
        if (res.data?.success) {
          setProjects(res.data.projects || { total: 0 });
          setFeeds(res.data.feeds || { total: 0, statusWiseCount: [] });
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Frequency Data Fetch with Pagination
  const fetchFrequencyData = async () => {
    /* 🛑 BLOCK API IF CUSTOM RANGE IS SELECTED BUT DATES ARE MISSING */
    if (filter?.value === 'custom') {
      if (!startDate || !endDate) return;
    }

    try {
      setFrequencyLoading(true);
      const res = await axios.get(`${api}/feed-frequency`, {
        params: {
          filter: filter?.value,
          frequencyType: frequencyType?.value,
          startDate,
          endDate,
          page, // Send current page
          limit // Send rows per page
        },
        withCredentials: true
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setTotalRows(res.data.count || 0);
      }
    } catch (err) {
      console.error('Frequency fetch error', err);
    } finally {
      setFrequencyLoading(false);
    }
  };

  useEffect(() => {
    fetchFrequencyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, frequencyType, startDate, endDate, page, limit]);

  /* ===================== STATUS NORMALIZATION ===================== */
  const feedStatusCounts = useMemo(() => {
    const map = {};
    feeds.statusWiseCount?.forEach((s) => (map[s.status] = s.count));

    return feedStatusOptions.map((status) => ({
      label: status,
      count: map[status] || 0
    }));
  }, [feeds]);

  /* ===================== HANDLERS ===================== */
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage, newPage) => {
    setLimit(newPerPage);
    setPage(newPage);
  };

  /* ===================== RENDER HELPERS ===================== */
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '0.375rem',
      borderColor: '#dee2e6',
      boxShadow: 'none',
      '&:hover': { borderColor: '#adb5bd' },
      padding: '2px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  const columns = [
    {
      name: 'Feed Name',
      selector: (row) => row.feedName,
      sortable: false, // Dataset is paginated backend-side, sorting needs backend support if enabled
      wrap: true,
      grow: 2
    },
    {
      name: 'Project',
      selector: (row) => row.projectName,
      sortable: false,
      wrap: true
    },
    {
      name: 'Status',
      cell: (row) => (
        <Badge bg={getStatusVariant(row.status)} className="px-2 py-1 fw-normal">
          {row.status}
        </Badge>
      ),
      minWidth: '140px'
    },
    {
      name: 'Frequency',
      width: '300px',
      cell: (row) => {
        const f = row.feedfrequency;
        if (!f) return '-';

        return (
          <div>
            <div className="fw-semibold">{f?.frequencyType}</div>

            {f?.frequencyType === 'Weekly' && f?.deliveryDay && (
              <small className="text-muted">
                <FaClock /> Every Week {f?.deliveryDay} • {f?.deliveryTime}
              </small>
            )}

            {f?.frequencyType === 'Daily' && f?.deliveryTime && (
              <small className="text-muted">
                {' '}
                <FaClock /> Every Day • {f?.deliveryTime}
              </small>
            )}

            {f?.frequencyType === 'Monthly' && f?.deliveryDate && (
              <small className="text-muted">
                {' '}
                <FaClock /> Every Month {f?.deliveryDate}th • {f?.deliveryTime}
              </small>
            )}
            {f.frequencyType === 'Bi-Monthly' && (
              <small className="text-muted">
                {' '}
                <FaClock /> Every Month {f.firstDate}th & {f.secondDate}th • {f.deliveryTime}
              </small>
            )}

            {f.frequencyType === 'Bi-Weekly' && (
              <small className="text-muted">
                <FaClock /> Every Week {f.deliveryDay} • {f.deliveryTime}
              </small>
            )}
            {f.frequencyType === 'Custom' && (
              <small className="text-muted">
                {' '}
                <FaClock /> {f.deliveryDate} • {f.deliveryTime}
              </small>
            )}
          </div>
        );
      }
    }
    // {
    //   name: 'Frequency',
    //   selector: (row) => row.feedfrequency?.frequencyType,
    //   sortable: false
    // },
    // {
    //   name: 'Schedule',
    //   cell: (row) => {
    //     const f = row.feedfrequency;
    //     if (!f) return '-';
    //     if (f.frequencyType === 'Weekly' || f.frequencyType === 'Bi-Weekly') return f.deliveryDay;
    //     if (f.frequencyType === 'Monthly') return `Day ${f.deliveryDate}`;
    //     if (f.frequencyType === 'Bi-Monthly') return `Day ${f.firstDate}, ${f.secondDate}`;
    //     if (f.frequencyType === 'Custom') return f.deliveryDate;
    //     return 'Daily';
    //   },
    //   wrap: true
    // },
    // {
    //   name: 'Time',
    //   selector: (row) => row.feedfrequency?.deliveryTime
    // }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-50">
        <Spinner animation="grow" variant="primary" />
      </div>
    );
  }

  // Options for Select
  const dateFilterOptions = dateFilters.map((d) => ({ label: d.label, value: d.value }));
  const freqOptions = frequencyOptions.map((f) => ({ label: f, value: f }));

  return (
    <Container fluid className="px-3 px-md-4 py-4">
      {/* HEADER */}
      <Row className="mb-4">
        <Col>
          <h3 className="fw-bold text-dark mb-1">Nexus Analytics</h3>
          <p className="text-muted mb-0">Real-time project and feed insights</p>
        </Col>
      </Row>

      <Row className="g-2">
        <Col xs={12} md={6}>
          <CompactTotalCard title="Total Projects" count={projects.total} variant="primary" />
        </Col>
        <Col xs={12} md={6}>
          <CompactTotalCard title="Total Feeds" count={feeds.total} variant="success" />
        </Col>
      </Row>

      {/* ===================== FEED STATUS ===================== */}
      <div className="mb-3">
        <h6 className="fw-bold text-dark mb-2 fs-6">Feed Status Overview</h6>
        <Card className="border-0 shadow-sm rounded-3 bg-light">
          <Card.Body className="p-1">
            <Row className="g-2">
              {feedStatusCounts.map((item, idx) => (
                <Col key={idx} xs={6} sm={4} md={3} lg={2}>
                  <CompactStatusCard label={item.label} count={item.count} />
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* ===================== FREQUENCY TABLE ===================== */}
      <div>
        <h5 className="fw-bold text-dark mb-3">Feed Frequency Overview</h5>
        <Card className="border-0">
          <Card.Body className="p-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Row className="mb-4 p-2">
                <Col className="d-flex align-items-center justify-content-start flex-wrap gap-2">
                  {/* LEFT: DATE FILTER BUTTONS */}
                  <div className="d-flex flex-wrap gap-1">
                    {dateFilterOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        // className=""
                        variant={filter?.value === option.value ? 'dark' : 'outline-dark'}
                        onClick={() => setFilter(option)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  {/* RIGHT: FREQUENCY DROPDOWN */}
                  <div style={{ minWidth: 220 }}>
                    <Select
                      options={freqOptions}
                      value={frequencyType}
                      onChange={setFrequencyType}
                      placeholder="select frequency"
                      isClearable
                    />
                  </div>
                </Col>

                {/* ===================== CUSTOM DATE RANGE (IF SELECTED) ===================== */}
                {/* {filter?.value === 'custom' && (
                  <>
                    <Col md={3}>
                      <Form.Label className="text-muted small fw-bold mb-1">Start Date</Form.Label>
                      <DatePicker
                        value={startDate ? dayjs(startDate, 'YYYY-MM-DD') : null}
                        format="YYYY-MM-DD"
                        onChange={(v) => setStartDate(v ? dayjs(v).format('YYYY-MM-DD') : '')}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="text-muted small fw-bold mb-1">End Date</Form.Label>
                      <DatePicker
                        value={endDate ? dayjs(endDate, 'YYYY-MM-DD') : null}
                        format="YYYY-MM-DD"
                        minDate={startDate ? dayjs(startDate, 'YYYY-MM-DD') : undefined}
                        onChange={(v) => setEndDate(v ? dayjs(v).format('YYYY-MM-DD') : '')}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                    </Col>
                  </>
                )} */}
              </Row>
            </LocalizationProvider>

            {/* DATA TABLE */}
            <div className="rounded-3 border overflow-hidden">
              <DataTable
                columns={columns}
                data={data}
                progressPending={frequencyLoading}
                progressComponent={
                  <div className="p-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                }
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                paginationDefaultPage={1}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                paginationRowsPerPageOptions={[5, 10, 20, 50]}
                highlightOnHover
                responsive
                striped
                customStyles={{
                  headCells: {
                    style: {
                      backgroundColor: '#f8f9fa',
                      fontWeight: 'bold',
                      color: '#495057',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase'
                    }
                  },
                  rows: {
                    style: {
                      fontSize: '0.9rem',
                      color: '#212529'
                    }
                  }
                }}
                noDataComponent={<div className="p-4 text-muted">No feeds found for the selected criteria</div>}
              />
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ProjectFeedDashboard;
