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
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [showAssignpcModal, setShowAssipcgnModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [loadingTeamLead, setLoadingTeamLead] = useState(false);
  const [loadingProjectCoordinator, setLoadingProjectCoordinator] = useState(false);

  // multi team leads
  const [selectedTLs, setSelectedTLs] = useState([]);

  // project coordinator (single)
  const [selectedCoordinator, setSelectedCoordinator] = useState([]);

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

  const openAssignpcModal = (row) => {
    setSelectedProject(row);

    setSelectedCoordinator(
      row.projectCoordinator?.map((pc) => ({
        label: pc.name,
        value: pc._id
      })) || []
    );

    setShowAssipcgnModal(true);

    fetchAssignpcUsers(row);
  };
  const openAssignTeamModal = (row) => {
    setSelectedProject(row);

    setSelectedTLs(
      row.teamLead?.map((tl) => ({
        label: tl.name,
        value: tl._id
      })) || []
    );
    setShowAssignTeamModal(true);
    fetchAssignTlUsers(row);
  };
  const fetchAssignTlUsers = async (row) => {
    setLoadingTeamLead(true);
    try {
      const res = await axios.get(
        `${api}/project-assign-users?department=${encodeURIComponent(row.department)}&reportingId=${row.projectManager?._id}&teamLead=true`,
        {
          withCredentials: true
        }
      );

      setTeamLeads(
        res.data.data.map((u) => ({
          label: u.name,
          value: u._id
        }))
      );
    } catch (err) {
      toast.error('Failed to load assign users');
    } finally {
      setLoadingTeamLead(false);
    }
  };
  const fetchAssignpcUsers = async (row) => {
    setLoadingProjectCoordinator(true);
    try {
      const res = await axios.get(
        `${api}/project-assign-users?department=${encodeURIComponent('Client Success')}&reportingId=${row.csprojectManager?._id}&coordinator=true`,
        {
          withCredentials: true
        }
      );

      setCoordinators(
        res.data.data.map((u) => ({
          label: u.name,
          value: u._id
        }))
      );
    } catch (err) {
      toast.error('Failed to load assign users');
    } finally {
      setLoadingProjectCoordinator(false);
    }
  };
  const handleAssignTeam = async () => {
    if (selectedTLs.length === 0) {
      toast.error('Please select at least 1 Team Lead');
      return;
    }

    if (selectedTLs.length > 3) {
      toast.error('You can assign maximum 3 Team Leads');
      return;
    }

    setLoadingTeamLead(true);
    try {
      const res = await axios.post(
        `${api}/project-assign-team?teamlead=true`,
        {
          projectId: selectedProject._id,
          teamLeadIds: selectedTLs.map((tl) => tl.value)
        },
        { withCredentials: true }
      );
      if (res.status === 200) {
        toast.success('Team assigned successfully');
        setShowAssignTeamModal(false);
        getApiList(currentPage, perPage, search);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setLoadingTeamLead(false);
    }
  };
  const handleAssignpc = async () => {
    if (selectedCoordinator.length > 2) {
      toast.error('You can assign maximum 2 Project Coordinators');
      return;
    }

    setLoadingProjectCoordinator(true);
    try {
      const res = await axios.post(
        `${api}/project-assign-team?coordinator=true`,
        {
          projectId: selectedProject._id,
          projectCoordinatorId: selectedCoordinator.map((pc) => pc.value)
        },
        { withCredentials: true }
      );
      if (res.status === 200) {
        toast.success('Team assigned successfully');
        setShowAssipcgnModal(false);
        getApiList(currentPage, perPage, search);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setLoadingProjectCoordinator(false);
    }
  };
  const columns = [
    {
      name: 'No.',
      width: '70px', // OK to keep fixed
      center: true,
      selector: (row, index) => index + 1 + (currentPage - 1) * perPage
    },

    {
      name: 'Project Code',
      minWidth: '160px',
      grow: 1,
      cell: (row) => {
        const content = (
          <div
            style={{
              backgroundColor: row.hasEscalation ? '#f09799ff' : 'transparent',
              padding: '4px 8px',
              borderRadius: '4px',
              width: '100%',
              textAlign: 'center',
              fontWeight: row.hasEscalation ? '600' : 'normal',
              cursor: row.hasEscalation ? 'pointer' : 'default'
            }}
          >
            {row.projectCode}
          </div>
        );

        return row.hasEscalation ? (
          <OverlayTrigger placement="top" overlay={<Tooltip>Escalation Open</Tooltip>}>
            {content}
          </OverlayTrigger>
        ) : (
          content
        );
      }
    },

    {
      name: 'Name',
      minWidth: '200px',
      grow: 2,
      selector: (row) => row.projectName,
      wrap: true
    },

    {
      name: 'Total Feed',
      width: '110px',
      center: true,
      selector: (row) => row.feedIds.length
    },

    {
      name: 'Status',
      width: '120px',
      center: true,
      cell: (row) => (
        <Badge bg={statusColor(row.status)} className="px-3 py-2">
          <span style={{ fontSize: '13px' }}>{row.status}</span>
        </Badge>
      )
    },

    {
      name: 'Team',
      minWidth: '140px',
      grow: 1,
      cell: (row) => <TeamAvatars team={buildTeamList(row)} />,
      ignoreRowClick: true
    },

    {
      name: 'Posted On',
      width: '140px',
      center: true,
      cell: (row) => (row.createdAt ? format(new Date(row.createdAt), 'dd MMM yyyy') : '-'),
      ignoreRowClick: true
    },

    {
      name: 'Active',
      width: '120px',
      center: true,
      cell: (row) => (
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
      )
    },

    {
      name: 'Action',
      minWidth: '180px',
      center: true,
      cell: (row) => (
        <div className="d-flex align-items-center gap-3">
          {permission[0]?.action?.includes('View') && (
            <FaEye onClick={() => navigate(`/Project-view/${row._id}`)} style={{ cursor: 'pointer', color: 'green' }} size={18} />
          )}

          {permission[0]?.action?.includes('Update') && (
            <FiEdit onClick={() => navigate(`/Project-Edit/${row._id}`)} style={{ cursor: 'pointer', color: 'blue' }} size={18} />
          )}

          <CgFeed onClick={() => navigate(`/Project-feeds/${row._id}`)} style={{ cursor: 'pointer', color: 'blue' }} size={18} />
        </div>
      )
    }
  ];

  document.title = 'Projects Overview';

  const conditionalRowStyles = [
    {
      when: (row) => row.hasEscalation === true,
      style: {
        backgroundColor: '#f09799ff',
        color: '#000',
        fontWeight: '600'
      }
    }
  ];
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
                conditionalRowStyles={conditionalRowStyles}
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
      <Modal show={showAssignTeamModal} onHide={() => setShowAssignTeamModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Project Team</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* MULTIPLE TEAM LEADS */}
          <Form.Group className="mb-3">
            <Form.Label className="required">Team Leads</Form.Label>
            <Select
              isMulti
              options={teamLeads}
              value={selectedTLs}
              placeholder="Select Team Leads"
              onChange={(selected) => {
                if (selected.length <= 3) {
                  setSelectedTLs(selected);
                } else {
                  toast.error('You can select maximum 3 Team Leads');
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignTeamModal(false)}>
            Cancel
          </Button>
          {loadingTeamLead ? (
            <Button variant="dark" disabled>
              <Spinner animation="border" size="sm" />
            </Button>
          ) : (
            <Button variant="dark" onClick={handleAssignTeam}>
              Add Team
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      <Modal show={showAssignpcModal} onHide={() => setShowAssipcgnModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Project Coordinator</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* PROJECT COORDINATOR */}
          <Form.Group>
            <Form.Label>Project Coordinator</Form.Label>
            <Select
              isMulti
              options={coordinators}
              value={selectedCoordinator}
              placeholder="Select Project Coordinators"
              onChange={(selected) => {
                if (selected.length <= 2) {
                  setSelectedCoordinator(selected);
                } else {
                  toast.error('You can select maximum 2 Project Coordinators');
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssipcgnModal(false)}>
            Cancel
          </Button>
          {loadingProjectCoordinator ? (
            <Button variant="dark" disabled>
              <Spinner animation="border" size="sm" />
            </Button>
          ) : (
            <Button variant="dark" onClick={handleAssignpc}>
              Add Team
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Project;
