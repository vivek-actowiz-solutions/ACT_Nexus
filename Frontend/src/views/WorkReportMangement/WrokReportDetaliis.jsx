import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Button, Modal, } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import dayjs from 'dayjs';
import { api } from 'views/api';

// ✅ MUI Date Picker
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';

const WorkReportDetails = () => {
  const { id } = useParams();
  console.log("developerId" , id )

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // 🔹 Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [projectData, setProjectData] = useState([]);
const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate, page, limit]);

  // 🔹 Validation
  const isValidDateRange = () => {
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      toast.error('Please select both From Date and To Date');
      return false;
    }

    if (fromDate && toDate && dayjs(fromDate).isAfter(toDate)) {
      toast.error('From Date cannot be after To Date');
      return false;
    }

    return true;
  };

  const fetchReports = async () => {
    if (!isValidDateRange()) return;

    setLoading(true);
    try {
      const res = await axios.get(`${api}/work-report-details`, {
        params: {
          id,
          fromDate: fromDate ? dayjs(fromDate).format('YYYY-MM-DD') : undefined,
          toDate: toDate ? dayjs(toDate).format('YYYY-MM-DD') : undefined,
          page,
          limit
        },
        withCredentials: true
      });

      setReports(res.data.data || []);
      setTotalRows(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch work report details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (data) => {
    setProjectData(data);
   console.log("Data" , data)
    setShowModal(true);
    setModalLoading(true);

  };

  const columns = [
    { name: 'Date', selector: (row) => row.workDate, sortable: true },
    { name: 'Total Time', selector: (row) => row.totalTime, center: true },
    { name: 'Worked Feeds', selector: (row) => row.reports.length, center: true },
    {
      name: 'Action',
      center: true,
      cell: (row) => (
        <Button size="sm" onClick={() => handleViewDetails(row.reports)}>
          View Details
        </Button>
      )
    }
  ];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <MainCard title="Work Report Details">
        {/* 🔹 Date Filters */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Row className="mb-3">
            <Col md={3}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(v) => {
                  setPage(1);
                  setFromDate(v);
                }}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Col>

            <Col md={3}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(v) => {
                  setPage(1);
                  setToDate(v);
                }}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Col>
          </Row>
        </LocalizationProvider>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            onChangePage={(p) => setPage(p)}
            onChangeRowsPerPage={(l) => {
              setLimit(l);
              setPage(1);
            }}
            striped
            responsive
            highlightOnHover
            noHeader
          />
        )}
      </MainCard>

 <Modal
   show={showModal}
   onHide={() => setShowModal(false)}
   size="xl"
   centered
   backdrop="static"
 >
   <Modal.Header closeButton className="bg-light">
     <Modal.Title className="fw-semibold">
       <span className="text-muted ms-2 fs-6">
         ({selectedDate})
       </span>
     </Modal.Title>
   </Modal.Header>
 
   <Modal.Body className="p-0">
     {loading ? (
       <div className="d-flex justify-content-center align-items-center py-5">
         <Spinner animation="border" />
       </div>
     ) : projectData.length === 0 ? (
       <div className="text-center py-5 text-muted">
         No project records found
       </div>
     ) : (
       <div className="table-responsive">
         <table className="table table-hover align-middle mb-0 p-3">
           <thead className="table-light ">
             <tr>
               <th>Project</th>
               <th>Feed</th>
               <th className="text-center">Hours</th>
               <th className="text-center">Task Type</th>
               <th>Description</th>
             </tr>
           </thead>
 
           <tbody >
             {projectData.map((p, idx) => (
               <tr key={idx}>
                 <td className="fw-semibold">
                   {p?.projectName || '-'}
                 </td>
 
                 <td>
                   {p?.feedName || '-'}
                 </td>
 
                 <td className="text-center">
                   <span className="badge bg-primary">
                     {p?.timeSpent || '0:00'}
                   </span>
                 </td>
 
                 <td className="text-center">
                   <span className="badge bg-info text-dark">
                     {p?.taskType || '-'}
                   </span>
                 </td>
 
                 <td className="text-wrap" style={{ maxWidth: 350 }}>
                   {p?.description || '-'}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}
   </Modal.Body>
 
   <Modal.Footer className="bg-light">
     <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
       Close
     </Button>
   </Modal.Footer>
 </Modal>
    </>
  );
};

export default WorkReportDetails;
