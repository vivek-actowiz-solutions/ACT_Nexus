import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Modal, OverlayTrigger, Tooltip, Table, Spinner } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast, ToastContainer } from 'react-toastify';
import { api } from 'views/api';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permission, setPermission] = useState([]);
  const [search, setSearch] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]); // local editable permissions
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchRoles(search);
    fetchModules();
  }, [search]);

  const fetchRoles = async (keyword = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/get-roles?search=${keyword}`, {
        withCredentials: true
      });
      setRoles(res.data.data || []);
      setPermission(res.data.permission);
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 403) {
        navigate(`/error/${err.response.status}`);
        // toast.error(err.response?.data?.message || 'Access denied');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch roles');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await axios.get(`${api}/get-modules`, {
        withCredentials: true
      });
      setModules(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch modules');
    }
  };

  const handlePermissionChange = (moduleName, action) => {
    setPermissions((prev) => {
      const exists = prev.find((p) => p.moduleName === moduleName);

      let updated;
      if (exists) {
        let newActions;
        if (exists.action.includes(action)) {
          newActions = exists.action.filter((a) => a !== action);
        } else {
          newActions = [...exists.action, action];
        }

        if (newActions.length === 0) {
          updated = prev.filter((p) => p.moduleName !== moduleName);
        } else {
          updated = prev.map((p) => (p.moduleName === moduleName ? { ...p, action: newActions } : p));
        }
      } else {
        updated = [...prev, { moduleName, action: [action] }];
      }

      console.log('Updated Permissions:', updated); // ✅ full data here
      return updated;
    });
  };
  const handleUpdatePermissions = async () => {
    const filteredPermissions = permissions.filter((p) => p.action && p.action.length > 0);
    console.log('filteredPermissions', filteredPermissions);
    try {
      await axios.put(
        `${api}/update-role-permissions/${selectedRole._id}`,
        { permissions: filteredPermissions },
        { withCredentials: true }
      );
      toast.success('Permissions updated successfully');
      setShowViewModal(false);
      fetchRoles(search);
    } catch (err) {
      toast.error('Failed to update permissions');
    }
  };

  const openModal = (role) => {
    setSelectedRole(role);
    // clone permissions from role into local state
    setPermissions(role.permissions || []);
    setShowViewModal(true);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    // setCurrentPage(1);
    fetchRoles(search);
  };
  const columns = [
    {
      name: 'No.',
      selector: (row, index) => index + 1,
      width: '60px'
    },
    { name: 'Role Name', selector: (row) => row.roleName, sortable: true, width: '120px' },
    {
      name: 'Description',
      cell: (row) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{row.description}</Tooltip>}>
          <span className="text-truncate" style={{ maxWidth: '400px' }}>
            {row.description}{' '}
          </span>
        </OverlayTrigger>
      )
    }
    // {
    //   name: 'Actions',
    //   cell: (row) => (
    //     <Button variant="outline-dark" size="sm" className="me-2" onClick={() => openModal(row)}>
    //       Permission
    //     </Button>
    //   )
    // }
  ];
  if (permission[0]?.action?.includes('Update')) {
    columns.push({
      name: 'Actions',
      cell: (row) => (
        <Button variant="outline-dark" size="sm" className="me-2" onClick={() => openModal(row)}>
          Permission
        </Button>
      )
    });
  }
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Row>
        <Col>
          <Card title="Role Management">
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <Form onSubmit={handleSearch} className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="me-2"
                  />
                </Form>
              </Col>
            </Row>
            {loading ? (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <DataTable columns={columns} data={roles} responsive striped highlightOnHover noHeader />
            )}
          </Card>
        </Col>
      </Row>

      {/* View/Update Role Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered style={{ width: '100%' }}>
        <Modal.Header closeButton>
          <Modal.Title>Role Permissions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center mb-3 p-3 rounded shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="me-3">
              <i className="bi bi-person-badge-fill" style={{ fontSize: '2rem', color: '#0d6efd' }}></i>
            </div>
            <div>
              <h4 className="mb-0 text-primary">{selectedRole?.roleName || 'No Role Selected'}</h4>
              <small className="text-muted">Assigned Role</small>
            </div>
          </div>

          <h5 className="mt-3">Module Permissions</h5>
          <Table bordered hover responsive className="mt-2">
            <thead>
              <tr>
                <th>Module Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod._id}>
                  <td>{mod.moduleName}</td>
                  <td style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {mod.actions.map((action, index) => {
                      const isChecked = permissions.some((perm) => perm.moduleName === mod.moduleName && perm.action.includes(action));
                      return (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          id={`${mod._id}-${action}`}
                          label={action}
                          checked={isChecked}
                          onChange={() => handlePermissionChange(mod.moduleName, action)}
                        />
                      );
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {permission[0]?.action?.includes('Update') && (
            <Button variant="primary" onClick={handleUpdatePermissions}>
              Update Permissions
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RoleManagement;
