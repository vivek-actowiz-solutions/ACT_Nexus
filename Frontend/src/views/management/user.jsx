import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Modal, Spinner } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { api } from 'views/api';

const UserList = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [permission, setPermission] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Loading States
  const [mainLoading, setMainLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);

  // Selected user for modal actions
  const [selectedUser, setSelectedUser] = useState(null);

  // Form States for Add User
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedReporting, setSelectedReporting] = useState('');

  // Roles & Reporting Users
  const [roles, setRoles] = useState([]);
  const [reportingUsers, setReportingUsers] = useState([]);

  const departments = [
    { value: 'Management', label: 'Management' },
    { value: 'Operation', label: 'Operation' },
    { value: 'R&D', label: 'R&D' },
    { value: 'Sales', label: 'Sales' },
    { value: 'QA', label: 'QA' },
    { value: 'Data Entry', label: 'Data Entry' },
    { value: 'Marketing', label: 'Marketing' },
  ];

  const designations = [
    // { value: 'Human Resource Executive', label: 'Human Resource Executive' },
    // { value: 'Content Writer', label: 'Content Writer' },
    // { value: 'Content Writer Manager', label: 'Content Writer Manager' },
    { value: 'Python Developer', label: 'Python Developer' },
    { value: 'Full Stack Developer', label: 'Full Stack Developer' },
    // { value: 'Web Designer', label: 'Web Designer' },
    { value: 'Solution Architect', label: 'Solution Architect' },
    { value: 'Quality Analyst', label: 'Quality Analyst' },
    { value: 'Technical Manager', label: 'Technical Manager' },
    { value: 'Assistant Technical Manager', label: 'Assistant Technical Manager' },
    { value: 'Team Lead', label: 'Team Lead' },
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'General Manager', label: 'General Manager' },
    { value: 'AVP Tech Operations', label: 'AVP Tech Operations' },
    { value: 'Vice President', label: 'Vice President' },
    { value: 'Data Entry Operator', label: 'Data Entry Operator' },
    { value: 'Process Associate', label: 'Process Associate' },
    { value: 'System Administrator', label: 'System Administrator' },
    // { value: 'SEO Executive', label: 'SEO Executive' },
    { value: 'Business Development Executive', label: 'Business Development Executive' },
    { value: 'Sales Head', label: 'Sales Head' },
    // { value: 'Social Media Executive', label: 'Social Media Executive' },
    // { value: 'Graphic Designer', label: 'Graphic Designer' },
    { value: 'Business Analyst', label: 'Business Analyst' },
    { value: 'Project Coordinator', label: 'Project Coordinator' },
    { value: 'Admin', label: 'Admin' },
  ];

  // Fetch Users
  const fetchUsers = async (page = 1, limit = perPage, keyword = '', roleId = '') => {
    setMainLoading(true);
    try {
      const res = await axios.get(`${api}/get-user`, {
        params: { page, limit, search: keyword, roleId },
        withCredentials: true,
      });
      setUsers(res.data.data || []);
      setPermission(res.data.permission || []);
      setTotalRows(res.data.total || 0);
      setCurrentPage(page);
      setPerPage(limit);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        navigate(`/error/403`);
        toast.error(error.response?.data?.message || 'Access Denied');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch users');
      }
    } finally {
      setMainLoading(false);
    }
  };

  // Fetch Roles
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${api}/get-roles-name`, { withCredentials: true });
      setRoles(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  // Fetch Reporting Users
  const fetchReportingUsers = async (roleId) => {
    try {
      const res = await axios.get(`${api}/get-reporting-users?roleId=${roleId}&department=${encodeURIComponent(selectedDepartment)}`, { withCredentials: true });
      setReportingUsers(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch reporting users');
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, perPage, search, filterRole);
  }, [currentPage, filterRole]);

  useEffect(() => {
    fetchRoles();
  }, []);

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newDesignation || !selectedRole) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${api}/add-user`,
        {
          name: newName,
          email: newEmail,
          designation: newDesignation,
          department: selectedDepartment,
          roleId: selectedRole,
          reportingTo: selectedReporting,
        },
        { withCredentials: true }
      );
      toast.success('User added successfully');
      setShowAddUserModal(false);
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewDesignation('');
      setSelectedDepartment('');
      setSelectedRole('');
      setSelectedReporting('');
      fetchUsers(currentPage, perPage, search, filterRole);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  // Update Role
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) {
      toast.error('Please select a role');
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${api}/update-user-role/${selectedUser._id}`,
        { roleId: selectedRole },
        { withCredentials: true }
      );
      toast.success('User role updated');
      setShowUpdateRoleModal(false);
      setSelectedUser(null);
      fetchUsers(currentPage, perPage, search, filterRole);
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  // Change Status
  const handleStatusChange = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await axios.put(
        `${api}/user-status/${selectedUser._id}`,
        { status: !selectedUser.status },
        { withCredentials: true }
      );
      toast.success(`Status changed to ${!selectedUser.status ? 'Active' : 'Inactive'}`);
      setShowStatusModal(false);
      fetchUsers(currentPage, perPage, search, filterRole);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { name: 'No.', selector: (_, i) => i + 1 + (currentPage - 1) * perPage, width: '60px' },
    { name: 'Name', selector: (row) => row.name },
    { name: 'Email', selector: (row) => row.email },
    { name: 'Designation', selector: (row) => row.designation },
    { name: 'department', selector: (row) => row.department },
    { name: 'reporting', selector: (row) => row.reportingTo || 'N/A' },
    { name: 'Key', selector: (row) => row.originalPassword || 'N/A' },
    {
      name: 'Status',
      cell: (row) =>
        permission[0]?.action?.includes('Update') ? (
          <Button
            size="sm"
            variant={row.status ? 'success' : 'danger'}
            onClick={() => {
              setSelectedUser(row);
              setShowStatusModal(true);
            }}
          >
            {row.status ? 'Active' : 'Inactive'}
          </Button>
        ) : (
          <span>{row.status ? 'Active' : 'Inactive'}</span>
        ),
      width: '120px',
    },
    {
      name: 'Role',
      cell: (row) =>
        permission[0]?.action?.includes('Update') ? (
          <Button
            size="sm"
            variant="dark"
            onClick={() => {
              setSelectedUser(row);
              setSelectedRole(row.roleId || '');
              setShowUpdateRoleModal(true);
            }}
          >
            {row.roleName || 'N/A'}
          </Button>
        ) : (
          <span>{row.roleName || 'N/A'}</span>
        ),
    },
  ];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Row>
        <Col>
          <Card title="User List">
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <Form onSubmit={(e) => { e.preventDefault(); fetchUsers(1, perPage, search, filterRole); }} className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Search by Name or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="me-1"
                  />
                </Form>
              </Col>
              <Col md={3}>
                <Form.Select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.roleName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3} className="d-flex justify-content-end gap-2">
                {permission[0]?.action?.includes('Add') && (
                  <Button variant="dark" onClick={() => setShowAddUserModal(true)}>
                    + Add User
                  </Button>
                )}
              </Col>
            </Row>

            {mainLoading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={users}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                paginationDefaultPage={currentPage}
                onChangePage={(page) => fetchUsers(page, perPage, search, filterRole)}
                onChangeRowsPerPage={(newPerPage, page) => fetchUsers(page, newPerPage, search, filterRole)}
                responsive
                striped
                highlightOnHover
                noHeader
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to change the status of <strong>{selectedUser?.email}</strong> from{' '}
          <strong>{selectedUser?.status ? 'Active' : 'Inactive'}</strong> to{' '}
          <strong>{selectedUser?.status ? 'Inactive' : 'Active'}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleStatusChange}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
   <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
  <Form onSubmit={handleAddUser}>
    <Modal.Header closeButton>
      <Modal.Title>Add User</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {/* Name */}
      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter name"
        />
      </Form.Group>

      {/* Email */}
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email"
        />
      </Form.Group>

      {/* Designation */}
      <Form.Group className="mb-3">
        <Form.Label>Designation</Form.Label>
        <Select
          options={designations}
          value={designations.find((d) => d.value === newDesignation) || null}
          onChange={(selected) => setNewDesignation(selected?.value || '')}
          placeholder="Select Designation"
          isClearable
        />
      </Form.Group>

      {/* Department */}
      <Form.Group className="mb-3">
        <Form.Label>Department</Form.Label>
        <Select
          options={departments}
          value={departments.find((d) => d.value === selectedDepartment) || null}
          onChange={(selected) => setSelectedDepartment(selected?.value || '')}
          placeholder="Select Department"
          isClearable
        />
      </Form.Group>

      {/* Role */}
      <Form.Group className="mb-3">
        <Form.Label>Role</Form.Label>
        <Select
          options={roles.map((r) => ({ value: r._id, label: r.roleName }))}
          value={roles.map((r) => ({ value: r._id, label: r.roleName })).find((r) => r.value === selectedRole) || null}
          onChange={(selected) => {
            setSelectedRole(selected?.value || '');
            setSelectedReporting('');
            fetchReportingUsers(selected?.value);
          }}
          placeholder="Select Role"
          isClearable
        />
      </Form.Group>

      {/* Reporting To */}
      <Form.Group className="mb-3">
        <Form.Label>Reporting To</Form.Label>
        <Select
          options={reportingUsers.map((u) => ({ value: u._id, label: u.name }))}
          value={reportingUsers.map((u) => ({ value: u._id, label: u.name })).find((u) => u.value === selectedReporting) || null}
          onChange={(selected) => setSelectedReporting(selected?.value || '')}
          placeholder="Select Reporting Manager"
          isClearable
        />
      </Form.Group>
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit">
        {loading ? <Spinner animation="border" size="sm" /> : 'Add User'}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

      {/* Update Role Modal */}
      <Modal show={showUpdateRoleModal} onHide={() => setShowUpdateRoleModal(false)} centered>
        <Form onSubmit={handleUpdateRole}>
          <Modal.Header closeButton>
            <Modal.Title>Update Role</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Updating role for: <strong>{selectedUser?.email}</strong></p>
            <Form.Group>
              <Form.Label>Select Role</Form.Label>
              <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="" hidden>Select Role</option>
                {roles.map((role) => <option key={role._id} value={role._id}>{role.roleName}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUpdateRoleModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">
              {loading ? <Spinner animation="border" size="sm" /> : 'Update Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default UserList;
