import React, { useEffect, useState } from 'react';
import { ListGroup, Dropdown, Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // fix import, jwtDecode is default export
import axios from 'axios';
import { IoKeyOutline } from 'react-icons/io5';
import ChatList from './ChatList';
import avatar1 from '../../../../assets/images/user/avatar-1.jpg';
import { api } from 'views/api';
import { toast, ToastContainer } from 'react-toastify';
import { set } from 'date-fns';

const NavRight = () => {
  const [listOpen, setListOpen] = useState(false);
  const [userName, setUserName] = useState('');

  // Password Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [clinet, setClient] = useState(true);

  // Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');

  useEffect(() => {
    isAuthenticated();
  }, []);
  const isAuthenticated = async () => {
    try {
      const res = await axios.get(`${api}/checkAuth`, { withCredentials: true });
      if (res.data.authenticated === true) {
        console.log('user', res);
        const users = res.data.user;
        setUserName(users.name || 'xyz');
        if (users.Rolelevel === 4) {
          setClient(false);
        }
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${api}/logout`, {}, { withCredentials: true });
      window.location.href = '/ACT-Nexus/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Change Password handlers
  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Both fields are required.');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${api}/change-password`,
        {
          currentPassword,
          newPassword
        },
        { withCredentials: true }
      );
      setLoading(false);

      if (res.status === 200) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        logout();
        // Optionally close modal after success:
        // setShowPasswordModal(false);
      } else {
        toast.error(res.data.message || 'Failed to update password.');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Error updating password.');
    }
  };

  const handlePasswordModalClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
    setShowPasswordModal(false);
  };

  // Profile modal save handler (example, adapt to your API)
  const handleProfileSave = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/update-profile', {
        name: updatedName,
        email: updatedEmail
      });
      setLoading(false);
      if (res.data.success) {
        setShowProfileModal(false);
        setUserName(updatedName);
        // Optionally show success toast/message here
      } else {
        alert(res.data.message || 'Failed to update profile');
      }
    } catch (error) {
      setLoading(false);
      alert('Error updating profile');
    }
  };

  return (
    <>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto" id="navbar-right">
        <ToastContainer />
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align="end" className="drp-user">
            <Dropdown.Toggle variant="" id="dropdown-basic">
              <img src={avatar1} className="img-radius" alt="User Profile" style={{ width: '40px', height: '40px', marginRight: '10px' }} />
              <span>{userName}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="profile-notification">
              <ListGroup as="ul" bsPrefix=" " variant="flush" className="pro-body">
                {clinet && (
                  <ListGroup.Item as="li" bsPrefix=" ">
                    <Link to="#" className="dropdown-item" onClick={() => setShowPasswordModal(true)}>
                      <IoKeyOutline size={15} /> <span style={{ marginLeft: '9px' }}>Change Password</span>
                    </Link>
                  </ListGroup.Item>
                )}

                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item" onClick={logout}>
                    <i className="feather icon-lock" /> Log out
                  </Link>
                </ListGroup.Item>
              </ListGroup>
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item>
      </ListGroup>

      {/* <ChatList listOpen={listOpen} closed={() => setListOpen(false)} /> */}

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={handlePasswordModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form.Group className="mb-3" controlId="currentPassword">
            <Form.Label>Current Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handlePasswordModalClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePasswordUpdate} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Profile Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="profileName" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="profileEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={updatedEmail} onChange={(e) => setUpdatedEmail(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleProfileSave} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NavRight;
