import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Modal, Dropdown, DropdownButton, OverlayTrigger, Tooltip, Spinner, Card, Badge } from 'react-bootstrap';
import MainCard from '../../components/Card/MainCard';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa6';
import { CgFeed } from 'react-icons/cg';
import { FiEdit } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import { saveAs } from 'file-saver';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { api } from 'views/api';
import { format } from 'date-fns';
import { FaUserPlus } from 'react-icons/fa';
const Project = () => {
  const navigate = useNavigate();
  const [apiList, setApiList] = useState([]);
  const [permission, setPermission] = useState([]);
  const [userDepartment, setUserDepartment] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // multi team leads
  const [selectedTLs, setSelectedTLs] = useState([]);

  // project coordinator (single)
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  const [teamLeads, setTeamLeads] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const statusColor = (status) => {
    switch (status) {
      case 'New':
        return 'success';
      case 'Under Development':
        return 'warning';
      case 'In Progress':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'On Hold':
        return 'dark';
      case 'closed':
        return 'danger';
      default:
        return 'light';
    }
  };
  useEffect(() => {
    getApiList(currentPage, perPage, search);
  }, [search]);

  const getApiList = async (page = 1, limit = 10, keyword = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/Project-list?page=${page}&limit=${limit}&search=${keyword}`, { withCredentials: true });
      console.log('res', res);

      setApiList(res.data.data);
      setPermission(res.data.permission);
      setUserDepartment(res.data.userDepartment);
      setTotalRows(res.data.total);
      setCurrentPage(page); // IMPORTANT
      setPerPage(limit); // IMPORTANT
    } catch (err) {
      if (err.response && err.response.status === 403) {
        navigate(`/error/${err.response.status}`);
        toast.error(err.response?.data?.message || 'Access denied');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch API list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    // setCurrentPage(page);
    getApiList(page, perPage, search);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    // setPerPage(newPerPage);
    // setCurrentPage(page);
    getApiList(page, newPerPage, search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // setCurrentPage(1);
    getApiList(1, perPage, search);
  };

  const downloadExcel = async () => {
    toast.info('waiting for export');
    try {
      const res = await axios.get(`${api}/getApiListExportData?search=${search}`, { withCredentials: true });
      const formattedData = res.data.data.map((rest, index) => ({
        No: index + 1,
        domainName: rest.domainName,
        categoryName: rest.categoryName,
        platfrom: rest.applicationType,
        type: rest.type,
        subType: rest.subType,
        region: rest.country,
        apiName: rest.apiName,
        status: rest.status,
        method: rest.method,
        apiEndpoint: rest.apiEndpoint,

        payload: rest.payload ? JSON.stringify(rest.payload) : ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'API List');
      XLSX.writeFile(workbook, 'api_list.xlsx');
      toast.success('export successful');
    } catch (err) {
      toast.error('export failed');
    }
  };

  // const downloadJSON = async () => {
  //   toast.info('waiting for export');
  //   try {
  //     const res = await axios.get(`${api}/  ?search=${search}`, { withCredentials: true });
  //     const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
  //     saveAs(blob, 'api_list.json');
  //     toast.success('export successful');
  //   } catch (err) {
  //     toast.error('export failed');
  //   }
  // };

  const handleStatusChange = async () => {
    if (!selectedAPI) return;
    try {
      const updatedStatus = !selectedAPI.isActive;
      console.log(updatedStatus);

      await axios.put(
        `${api}/projectstatusupdate/${selectedAPI._id}`,
        {
          active: updatedStatus
        },
        { withCredentials: true }
      );

      toast.success(`Status updated to ${updatedStatus ? 'Active' : 'Inactive'}`);
      getApiList(currentPage, perPage, search); // Refresh list
      setShowStatusModal(false);
    } catch (error) {
      toast.error('Failed to update status');
      setShowStatusModal(false);
    }
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const roleColor = (role) => {
    switch (role) {
      case 'Project Manager':
        return '#6f42c1';
      case 'Tech Manager':
        return '#0d6efd';
      case 'Team Lead':
        return '#fd7e14';
      case 'Developer':
        return '#198754';
      case 'BDE':
        return '#dc3545';
      case 'Project Coordinator':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const buildTeamList = (row) => {
    const team = [];

    if (row.projectManager) team.push({ name: row.projectManager.name, role: 'Project Manager' });

    if (row.projectTechManager) team.push({ name: row.projectTechManager.name, role: 'Tech Manager' });
    if (row.projectCoordinator) team.push({ name: row.projectCoordinator.name, role: 'Project Coordinator' });

    if (row.bde) team.push({ name: row.bde.name, role: 'BDE' });

    row.teamLead?.forEach((tl) => team.push({ name: tl.name, role: 'Team Lead' }));

    row.developers?.forEach((dev) => team.push({ name: dev.name, role: 'Developer' }));

    return team;
  };

  const TeamAvatars = ({ team }) => {
    if (!team.length) return '-';

    return (
      <div className="d-flex align-items-center">
        {team.slice(0, 3).map((m, i) => (
          <OverlayTrigger
            key={i}
            placement="top"
            overlay={
              <Tooltip>
                <strong>{m.name}</strong>
                <br />
                <small>{m.role}</small>
              </Tooltip>
            }
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: roleColor(m.role),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid #fff',
                cursor: 'pointer'
              }}
            >
              {getInitials(m.name)}
            </div>
          </OverlayTrigger>
        ))}

        {team.length > 3 && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {team.slice(3).map((m, i) => (
                  <div key={i}>
                    <strong>{m.name}</strong> – {m.role}
                  </div>
                ))}
              </Tooltip>
            }
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: '#adb5bd',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                marginLeft: -8,
                border: '2px solid #fff',
                cursor: 'pointer'
              }}
            >
              +{team.length - 3}
            </div>
          </OverlayTrigger>
        )}
      </div>
    );
  };

  const openAssignModal = (row) => {
    setSelectedProject(row);

    setSelectedTLs(
      row.teamLead?.map((tl) => ({
        label: tl.name,
        value: tl._id
      })) || []
    );

    setSelectedCoordinator(row.projectCoordinator ? { label: row.projectCoordinator.name, value: row.projectCoordinator._id } : null);

    setShowAssignModal(true);
    fetchAssignUsers(row);
  };
  const fetchAssignUsers = async (row) => {
    try {
      const res = await axios.get(`${api}/project-assign-users?department=${encodeURIComponent(row.department)}`, {
        withCredentials: true
      });

      setTeamLeads(
        res.data.teamLeads.map((u) => ({
          label: u.name,
          value: u._id
        }))
      );

      setCoordinators(
        res.data.coordinators.map((u) => ({
          label: u.name,
          value: u._id
        }))
      );
    } catch (err) {
      toast.error('Failed to load assign users');
    }
  };
  const handleAssignTeam = async () => {
    if (!selectedTLs.length) {
      toast.error('Please select at least one Team Lead');
      return;
    }

    try {
      await axios.post(
        `${api}/project-assign-team`,
        {
          projectId: selectedProject._id,
          teamLeadIds: selectedTLs.map((tl) => tl.value),
          projectCoordinatorId: selectedCoordinator?.value || null
        },
        { withCredentials: true }
      );

      toast.success('Team assigned successfully');
      setShowAssignModal(false);
      getApiList(currentPage, perPage, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    }
  };
  const columns = [
    {
      name: 'No.',
      width: '60px',
      selector: (row, index) => index + 1 + (currentPage - 1) * perPage
    },
    { name: 'Project Code', selector: (row) => row.projectCode },
    { name: 'Name', selector: (row) => row.projectName },
    { name: 'Total Feed', width: '100px', selector: (row) => row.feedIds.length },
    {
      name: 'Status',
      width: '200px',
      cell: (row) => (
        <Badge bg={statusColor(row.status)} className="px-3 py-2">
          <span style={{ fontSize: '13px' }}> {row.status}</span>
        </Badge>
      )
    },
    {
      name: 'Frequency',
      width: '300px',
      cell: (row) => {
        const f = row.projectFrequency;
        if (!f) return '-';

        return (
          <div>
            <div className="fw-semibold">{f.frequencyType}</div>

            {f.frequencyType === 'Weekly' && f.deliveryDay && (
              <small className="text-muted">
                <FaClock /> Every Week {f.deliveryDay} • {f.deliveryTime}
              </small>
            )}

            {f.frequencyType === 'Daily' && f.deliveryTime && (
              <small className="text-muted">
                {' '}
                <FaClock /> Every Day • {f.deliveryTime}
              </small>
            )}

            {f.frequencyType === 'Monthly' && f.deliveryDate && (
              <small className="text-muted">
                {' '}
                <FaClock /> Every Month {f.deliveryDate}th • {f.deliveryTime}
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
    },
    {
      name: 'Team',
      width: '150px',
      cell: (row) => <TeamAvatars team={buildTeamList(row)} />,
      ignoreRowClick: true
    },
    {
      name: 'Posted Date',
      width: '150px',
      cell: (row) => (row.createdAt ? format(new Date(row.createdAt), 'dd MMM yyyy') : '-'),
      ignoreRowClick: true
    },
    {
      name: 'Active Status',
      width: '120px',
      cell: (row) => (
        <>
          {permission[0]?.action?.includes('Update') ? (
            <Button
              size="sm"
              variant={row.isActive ? 'success' : 'danger'}
              onClick={() => {
                setSelectedAPI(row);
                setShowStatusModal(true);
              }}
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </Button>
          ) : (
            <Button size="sm" variant={row.isActive ? 'success' : 'danger'}>
              {row.isActive ? 'Active' : 'Inactive'}
            </Button>
          )}
        </>
      )
    },
    {
      name: 'Action',
      cell: (row) => (
        <>
          <div className="d-flex align-items-center gap-3">
            {permission[0]?.action?.includes('View') && (
              <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-view-${row._id}`}>View</Tooltip>}>
                <span>
                  <FaEye
                    onClick={() => {
                      navigate(`/Project-view/${row._id}`);
                    }}
                    style={{ cursor: 'pointer', color: 'green' }}
                    size={20}
                  />
                </span>
              </OverlayTrigger>
            )}
            {permission?.[0]?.action?.includes('AssignTeam') &&
              userDepartment !== 'Sales' &&
              (!row?.teamLead?.length || !row?.projectCoordinator) && (
                <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-assign-${row._id}`}>Assign Team</Tooltip>}>
                  <span style={{ cursor: 'pointer', display: 'inline-flex' }} onClick={() => openAssignModal(row)}>
                    <FaUserPlus size={18} color="#0d6efd" />
                  </span>
                </OverlayTrigger>
              )}

            {permission[0]?.action?.includes('Update') && (
              <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-view-${row._id}`}>View</Tooltip>}>
                <span>
                  <FiEdit
                    onClick={() => {
                      navigate(`/Project-Edit/${row._id}`);
                    }}
                    style={{ cursor: 'pointer', color: 'blue' }}
                    size={20}
                  />
                </span>
              </OverlayTrigger>
            )}

            <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-view-${row._id}`}>Feeds</Tooltip>}>
              <span>
                <CgFeed
                  onClick={() => {
                    navigate(`/Project-feeds/${row._id}`);
                  }}
                  style={{ cursor: 'pointer', color: 'blue' }}
                  size={20}
                />
              </span>
            </OverlayTrigger>
          </div>
        </>
      ),
      width: '150px'
    }
  ];
  document.title = 'Projects Overview';
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Row>
        <Col>
          <MainCard title="Projects Overview">
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <Form onSubmit={handleSearch} className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Search by Project Code or Project Name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="me-2"
                  />
                </Form>
              </Col>

              <Col md={6} className="d-flex justify-content-end  gap-2">
                {permission[0]?.action.includes('Export') && (
                  <DropdownButton id="export-dropdown" title="Export" variant="outline-dark">
                    <Dropdown.Item as="button" onClick={downloadExcel}>
                      Export as Excel
                    </Dropdown.Item>
                    <Dropdown.Item as="button" onClick={downloadJSON}>
                      Export as JSON
                    </Dropdown.Item>
                  </DropdownButton>
                )}
                {(permission[0]?.action.includes('Create') || userDepartment === 'Sales') && (
                  <Button variant="dark" onClick={() => navigate('/Project-integration')}>
                    + Add New Project
                  </Button>
                )}
              </Col>
            </Row>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={apiList}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                paginationDefaultPage={currentPage}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                responsive
                striped
                highlightOnHover
                noHeader
              />
            )}
          </MainCard>
        </Col>
      </Row>
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to change the status of <strong>{selectedAPI?.apiName}</strong> from{' '}
          <strong>{selectedAPI?.status ? 'Active' : 'Inactive'}</strong> to <strong>{selectedAPI?.status ? 'Inactive' : 'Active'}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusChange}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Project Team</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* MULTIPLE TEAM LEADS */}
          <Form.Group className="mb-3">
            <Form.Label className="required">Team Leads</Form.Label>
            <Select isMulti options={teamLeads} value={selectedTLs} onChange={setSelectedTLs} placeholder="Select Team Leads" />
          </Form.Group>

          {/* PROJECT COORDINATOR */}
          <Form.Group>
            <Form.Label>Project Coordinator</Form.Label>
            <Select
              options={coordinators}
              value={selectedCoordinator}
              onChange={setSelectedCoordinator}
              placeholder="Select Project Coordinator"
              isClearable
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleAssignTeam}>
            Add Team
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Project;
