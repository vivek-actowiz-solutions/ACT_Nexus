import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Modal, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Card from '../../components/Card/MainCard';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { FaEye } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import Select from 'react-select';
import { getData } from 'country-list';
import { api } from 'views/api';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { FaUserPlus } from 'react-icons/fa';
import { FaClock } from 'react-icons/fa6';
import { FaEdit } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa';

const frequencyOptions = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Bi-Weekly', value: 'Bi-Weekly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Bi-Monthly', value: 'Bi-Monthly' },
  { label: 'Custom', value: 'Custom' }
];

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ label: d, value: d }));

const platformTypeOptions = [
  { label: 'Web', value: 'Web' },
  { label: 'App', value: 'App' },
  { label: 'Mobile Web (MWeb)', value: 'Mobile Web (MWeb)' },
  { label: 'Web & App', value: 'Web & App' }
];

const scopeTypeOptions = [
  { label: 'By Search term', value: 'By Search term' },
  { label: 'By SKU', value: 'By SKU' },
  { label: 'By Review', value: 'By Review' },
  { label: 'By Category', value: 'By Category' }
];
const feedStatusOptions = [
  { label: 'New', value: 'New' },
  { label: 'Under Development', value: 'Under Development' },
  { label: 'Crawl Running', value: 'Crawl Running' },
  { label: 'Crawl Finished', value: 'Crawl Finished' },
  { label: 'In QA', value: 'In QA' },
  { label: 'QA Passed', value: 'QA Passed' },
  { label: 'Completed', value: 'Completed' },

  // 🔴 Issue / Risk States
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Delayed', value: 'Delayed' },

  // ⚠️ Recovery States
  { label: 'Not Able to Recover', value: 'Not Able to Recover' },
  { label: 'Able to Recover', value: 'Able to Recover' },

  // ❌ Final Failure
  { label: 'Incapability', value: 'Incapability' }
];
// const industryOptions = [
//   { label: 'E-com', value: 'E-com' },
//   { label: 'Food', value: 'Food' },
//   { label: 'Q-com', value: 'Q-com' },
//   { label: 'Sports', value: 'Sports' },
//   { label: 'Travel', value: 'Travel' },
//   { label: 'OTT', value: 'OTT' },
//   { label: 'Real Estate', value: 'Real Estate' },
//   { label: 'Gov', value: 'Gov' },
//   { label: 'Event', value: 'Event' },
//   { label: 'Social Media', value: 'Social Media' },
//   { label: 'Music', value: 'Music' }
// ];

/* ------------------ COMPONENT ------------------ */
const ApiconfigrationList = () => {
  const { projectId: projectId } = useParams();
  const navigate = useNavigate();

  const [feeds, setFeeds] = useState([]);
  console.log('feed', feeds);
  const [permission, setPermission] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [countryList, setCountryList] = useState([]);
  const [formData, setFormData] = useState({
    platformName: '',
    // industryType: '',
    platformType: '',
    scopeType: '',
    // deliveryType: '',
    frequencyType: '',
    countries: [],
    description: ''
  });
  console.log('formData', formData);
  const [schedule, setSchedule] = useState({
    day: '',
    date: null,
    firstDate: null,
    secondDate: null,
    time: null
  });

  const [showAssignDevModal, setShowAssignDevModal] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [selectedFeedForDevAssign, setSelectedFeedForDevAssign] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFeed, setEditFeed] = useState(null);

  const [editFormData, setEditFormData] = useState({
    platformName: '',
    platformType: '',
    scopeType: '',
    frequencyType: '',
    countries: [],
    description: ''
  });

  const [editSchedule, setEditSchedule] = useState({
    day: '',
    date: null,
    firstDate: null,
    secondDate: null,
    time: null
  });

  const [editDevelopers, setEditDevelopers] = useState([]);

  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [statusFeed, setStatusFeed] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFeed, setDeleteFeed] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    const countries = getData();
    const options = countries.map(({ name, code }) => ({ label: name, value: code })).sort((a, b) => a.label.localeCompare(b.label));
    setCountryList(options);
  }, []);
  useEffect(() => {
    fetchFeeds();
  }, [search]);

  const fetchFeeds = async (p = page, l = limit, s = search) => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/Feeds-list/${projectId}?page=${p}&limit=${l}&search=${s}`, { withCredentials: true });
      setFeeds(res.data.data);
      setPermission(res.data.permission || []);
      setTotalRows(res.data.total);
      setPage(p);
      setLimit(l);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load feeds');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await axios.get(`${api}/get-developers?ProjectId=${projectId}`, {
        withCredentials: true
      });

      const options = res.data.data.map((u) => ({
        label: u.name,
        value: u._id
      }));

      setDevelopers(options);
    } catch (err) {
      toast.error('Failed to load Developers');
    }
  };

  const validateFeedForm = () => {
    if (!formData.platformName?.trim()) {
      toast.error('Platform Name is required');
      return false;
    }

    if (!formData.platformType) {
      toast.error('Platform Type is required');
      return false;
    }

    if (!formData.countries || formData.countries.length === 0) {
      toast.error('Please select at least one country');
      return false;
    }

    if (formData.description?.trim() === '') {
      toast.error('Description is required');
      return false;
    }
    if (!formData.frequencyType) {
      toast.error('Frequency is required');
      return false;
    }

    if (!schedule.time) {
      toast.error('Delivery time is required');
      return false;
    }

    if (['Weekly', 'Bi-Weekly'].includes(formData.frequencyType) && !schedule.day) {
      toast.error('Delivery day is required');
      return false;
    }

    if (['Monthly', 'Custom'].includes(formData.frequencyType) && !schedule.date) {
      toast.error('Delivery date is required');
      return false;
    }

    if (formData.frequencyType === 'Bi-Monthly' && (!schedule.firstDate || !schedule.secondDate)) {
      toast.error('Both delivery dates are required');
      return false;
    }

    return true;
  };

  const handleCreateFeed = async () => {
    if (!validateFeedForm()) return;
    const frequencyConfig = {
      frequencyType: formData.frequencyType,
      deliveryDay: schedule.day || null,
      deliveryDate: schedule.date || null,
      firstDate: schedule.firstDate || null,
      secondDate: schedule.secondDate || null,
      deliveryTime: schedule.time ? schedule.time.format('HH:mm') : null
    };

    const payload = {
      projectId,
      ...formData,
      frequencyConfig // ✅ SEND DIRECTLY
    };
    try {
      await axios.post(`${api}/feed-create`, payload, { withCredentials: true });

      toast.success('Feed created successfully');
      setShowCreateModal(false);
      setFormData({
        platformName: '',
        // industryType: '',
        platformType: '',
        // deliveryType: '',
        frequency: '',
        countries: [],
        description: ''
      });
      fetchFeeds(1, limit, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create feed failed');
    }
  };

  const confirmStatusChange = async () => {
    try {
      await axios.put(`${api}/feedActivestatusupdate/${selectedFeed._id}`, { active: !selectedFeed.active }, { withCredentials: true });

      toast.success('Status updated');
      setShowStatusModal(false);
      fetchFeeds();
    } catch {
      toast.error('Status update failed');
    }
  };

  const handleAssignDevelopers = async () => {
    if (!selectedDevs.length) {
      toast.error('Please select at least one Developer');
      return;
    }

    try {
      await axios.post(
        `${api}/feed-assign-developers`,
        {
          feedId: selectedFeedForDevAssign._id,
          developerIds: selectedDevs.map((d) => d.value),
          projectId
        },
        { withCredentials: true }
      );

      toast.success('Developers assigned successfully');
      setShowAssignDevModal(false);
      fetchFeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign developers failed');
    }
  };
  const openAssignDeveloperModal = (feed) => {
    setSelectedFeedForDevAssign(feed);
    setSelectedDevs([]);
    setShowAssignDevModal(true);
    fetchDevelopers();
  };
  const handleFrequencyChange = (v) => {
    setFormData({ ...formData, frequencyType: v?.value || '' });
    setSchedule({
      day: '',
      date: null,
      firstDate: null,
      secondDate: null,
      time: null
    });
  };
  const openEditModal = (feed) => {
    setEditFeed(feed);

    // 🔹 Prefill normal fields
    setEditFormData({
      platformName: feed.platformName || '',
      platformType: feed.platformType || '',
      scopeType: feed.scopeType || '',
      frequencyType: feed.feedfrequency?.frequencyType || '',
      countries: feed.countries || [],
      description: feed.description || ''
    });

    // 🔹 Prefill frequency schedule
    setEditSchedule({
      day: feed.feedfrequency?.deliveryDay || '',
      date: feed.feedfrequency?.deliveryDate || null,
      firstDate: feed.feedfrequency?.firstDate || null,
      secondDate: feed.feedfrequency?.secondDate || null,
      time: feed.feedfrequency?.deliveryTime ? dayjs(feed.feedfrequency.deliveryTime, 'HH:mm') : null
    });

    // 🔹 Prefill developers
    setEditDevelopers(
      feed.developers?.map((d) => ({
        label: d.name,
        value: d._id
      })) || []
    );

    fetchDevelopers();
    setShowEditModal(true);
  };

  const getChangedFields = (oldData, newData) => {
    const diff = {};

    Object.keys(newData).forEach((key) => {
      if (typeof newData[key] === 'object' && newData[key] !== null) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          diff[key] = newData[key];
        }
      } else {
        if (oldData[key] !== newData[key]) {
          diff[key] = newData[key];
        }
      }
    });

    return diff;
  };

  const normalizeFrequency = (freq = {}) => ({
    frequencyType: freq.frequencyType || null,
    deliveryDay: freq.deliveryDay || null,
    deliveryDate: freq.deliveryDate || null,
    firstDate: freq.firstDate || null,
    secondDate: freq.secondDate || null,
    deliveryTime: freq.deliveryTime || null
  });
  const validateEditFeed = (changes, frequencyType, schedule) => {
    // 🔹 Platform Name
    if ('platformName' in changes && !changes.platformName?.trim()) {
      toast.error('Platform Name is required');
      return false;
    }

    // 🔹 Platform Type
    if ('platformType' in changes && !changes.platformType) {
      toast.error('Platform Type is required');
      return false;
    }

    // 🔹 Scope Type
    if ('scopeType' in changes && !changes.scopeType) {
      toast.error('Scope Type is required');
      return false;
    }

    // 🔹 Countries
    if ('countries' in changes && (!changes.countries || !changes.countries.length)) {
      toast.error('Please select at least one country');
      return false;
    }

    // 🔹 Description
    if ('description' in changes && !changes.description?.trim()) {
      toast.error('Description is required');
      return false;
    }

    // 🔹 Frequency validation ONLY if frequencyConfig changed
    if ('frequencyConfig' in changes) {
      if (!frequencyType) {
        toast.error('Frequency is required');
        return false;
      }

      if (!schedule.time) {
        toast.error('Delivery time is required');
        return false;
      }

      if (['Weekly', 'Bi-Weekly'].includes(frequencyType) && !schedule.day) {
        toast.error('Delivery day is required');
        return false;
      }

      if (['Monthly', 'Custom'].includes(frequencyType) && !schedule.date) {
        toast.error('Delivery date is required');
        return false;
      }

      if (frequencyType === 'Bi-Monthly' && (!schedule.firstDate || !schedule.secondDate)) {
        toast.error('Both delivery dates are required');
        return false;
      }
    }

    return true;
  };
  const handleUpdateFeed = async () => {
    if (!editFeed) return;

    const updatedFrequencyConfig = normalizeFrequency({
      frequencyType: editFormData.frequencyType,
      deliveryDay: editSchedule.day,
      deliveryDate: editSchedule.date,
      firstDate: editSchedule.firstDate,
      secondDate: editSchedule.secondDate,
      deliveryTime: editSchedule.time ? editSchedule.time.format('HH:mm') : null
    });

    const originalFrequencyConfig = normalizeFrequency(editFeed.feedfrequency);

    const updatedPayload = {
      platformName: editFormData.platformName,
      platformType: editFormData.platformType,
      scopeType: editFormData.scopeType,
      description: editFormData.description,
      countries: editFormData.countries,
      developers: editDevelopers.map((d) => d.value)
    };

    // 👉 only add frequency if changed
    if (JSON.stringify(originalFrequencyConfig) !== JSON.stringify(updatedFrequencyConfig)) {
      updatedPayload.frequencyConfig = updatedFrequencyConfig;
    }

    const originalPayload = {
      platformName: editFeed.platformName,
      platformType: editFeed.platformType,
      scopeType: editFeed.scopeType,
      description: editFeed.description,
      countries: editFeed.countries,
      developers: editFeed.developers?.map((d) => d._id),
      frequencyConfig: originalFrequencyConfig
    };

    const changes = getChangedFields(originalPayload, updatedPayload);

    if (!Object.keys(changes).length) {
      toast.info('No changes detected');
      return;
    }
    if (!validateEditFeed(changes, editFormData.frequencyType, editSchedule)) {
      return;
    }
    try {
      await axios.put(`${api}/feed-update/${editFeed._id}`, changes, { withCredentials: true });

      toast.success('Feed updated successfully');
      setShowEditModal(false);
      fetchFeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleEditFrequencyChange = (v) => {
    setEditFormData({ ...editFormData, frequencyType: v?.value || '' });
    setEditSchedule({
      day: '',
      date: null,
      firstDate: null,
      secondDate: null,
      time: null
    });
  };
  const openStatusUpdateModal = (feed) => {
    setStatusFeed(feed);
    setSelectedStatus(feedStatusOptions.find((s) => s.value === feed.status) || null);
    setShowStatusUpdateModal(true);
  };
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select status');
      return;
    }

    try {
      await axios.put(`${api}/feed-status-update/${statusFeed._id}`, { status: selectedStatus.value }, { withCredentials: true });

      toast.success('Status updated successfully');
      setShowStatusUpdateModal(false);
      fetchFeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const generateFeedName = () => {
    const { platformName, platformType, scopeType, frequencyType, countries } = formData;

    if (!platformName || !platformType || !scopeType || !frequencyType || !countries?.length) {
      return '';
    }

    const capFirst = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

    return `${capFirst(platformName)}|${countries
      .map((c) => c.code)
      .join(',')}|${capFirst(platformType)}|${capFirst(scopeType)}|${capFirst(frequencyType)}`;
  };

  const openDeleteModal = (feed) => {
    setDeleteFeed(feed);
    setShowDeleteModal(true);
  };
  const handleDeleteFeed = async () => {
    if (!deleteFeed?._id) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`${api}/feed-deleted/${deleteFeed._id}`, {
        withCredentials: true
      });

      toast.success(`Feed "${deleteFeed.feedName}" deleted successfully`);
      setShowDeleteModal(false);
      fetchFeeds(page, limit, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete feed failed');
    } finally {
      setDeleteLoading(false);
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
    let team = [];
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

  const TooltipText = ({ text }) => {
    if (!text) return '-';

    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>{text}</Tooltip>}>
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer'
          }}
        >
          {text}
        </div>
      </OverlayTrigger>
    );
  };

  const feedStatusStyle = {
    New: {
      bg: '#6c757d',
      color: '#fff'
    },
    'Under Development': {
      bg: '#0dcaf0',
      color: '#000'
    },
    'Crawl Running': {
      bg: '#0d6efd',
      color: '#fff'
    },
    'Crawl Finished': {
      bg: '#212529',
      color: '#fff'
    },
    'In QA': {
      bg: '#ffc107',
      color: '#000'
    },
    'QA Passed': {
      bg: '#198754',
      color: '#fff'
    },
    Completed: {
      bg: '#198754',
      color: '#fff'
    },

    // ⚠️ Risk
    'On Hold': {
      bg: '#fd7e14',
      color: '#fff'
    },
    Delayed: {
      bg: '#dc3545',
      color: '#fff'
    },

    // 🔁 Recovery
    'Able to Recover': {
      bg: '#20c997',
      color: '#000'
    },
    'Not Able to Recover': {
      bg: '#dc3545',
      color: '#fff'
    },

    // ❌ Failure
    Incapability: {
      bg: '#343a40',
      color: '#fff'
    }
  };
  const columns = [
    {
      name: 'No',
      width: '60px',
      cell: (_, index) => <TooltipText text={String((page - 1) * limit + index + 1)} width="50px" />
    },
    {
      name: 'Feed Name',
      width: '300px',
      cell: (row) => <TooltipText text={row.feedName} />
    },
    {
      name: 'Platform',
      width: '150px',
      cell: (row) => <TooltipText text={row.platformName} />
    },

    {
      name: 'Platform Type',
      cell: (row) => <TooltipText text={row.platformType} />
    },
    {
      name: 'Frequency',
      width: '250px',
      cell: (row) => {
        const f = row.feedfrequency;
        if (!f) return '-';
        return (
          <div>
            {' '}
            <div className="fw-semibold">{f.frequencyType}</div>{' '}
            {f.frequencyType === 'Weekly' && f.deliveryDay && (
              <small className="text-muted">
                <FaClock /> Every Week {f.deliveryDay} • {f.deliveryTime}
              </small>
            )}
            {f.frequencyType === 'Daily' && f.deliveryTime && (
              <small className="text-muted">
                <FaClock /> Daily • {f.deliveryTime}
              </small>
            )}
            {f.frequencyType === 'Monthly' && f.deliveryDate && (
              <small className="text-muted">
                <FaClock /> Every Month {f.deliveryDate}th • {f.deliveryTime}
              </small>
            )}
            {f.frequencyType === 'Bi-Monthly' && (
              <small className="text-muted">
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
                <FaClock /> {f.deliveryDate} • {f.deliveryTime}
              </small>
            )}
          </div>
        );
      }
    },

    {
      name: 'Developer',
      cell: (row) => (
        <div>
          <TeamAvatars team={buildTeamList(row)} />
        </div>
      ),
      ignoreRowClick: true
    },
    {
      name: 'Status',
      width: '200px',
      cell: (row) => {
        const hasPermission = permission?.[0]?.action?.includes('FeedStatusUpdate');

        const statusStyle = feedStatusStyle[row.status] || {
          bg: '#adb5bd',
          color: '#000'
        };

        return (
          <Button
            size="sm"
            disabled={!hasPermission}
            onClick={() => hasPermission && openStatusUpdateModal(row)}
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              border: 'none',
              minWidth: '160px',
              fontSize: '14px',
              pedding: '5px 10px',
              cursor: hasPermission ? 'pointer' : 'not-allowed',
              textTransform: 'capitalize'
            }}
          >
            {row.status}
          </Button>
        );
      }
    },
    {
      name: 'Active',
      cell: (row) => (
        <>
          {permission[0]?.action?.includes('FeedUpdate') ? (
            <Button
              size="sm"
              variant={row.active ? 'success' : 'danger'}
              onClick={() => {
                setSelectedFeed(row);
                setShowStatusModal(true);
              }}
            >
              {row.active ? 'Active' : 'Inactive'}
            </Button>
          ) : (
            <Button size="sm" variant={row.active ? 'success' : 'danger'}>
              {row.active ? 'Active' : 'Inactive'}
            </Button>
          )}
        </>
      )
    },
    {
      name: 'Action',
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          {/* View */}
          <OverlayTrigger placement="top" overlay={<Tooltip id={`view-${row._id}`}>View</Tooltip>}>
            <span style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <FaEye size={18} color="green" onClick={() => navigate(`/Project-feeds/${projectId}/Feed-details/${row._id}`)} />
            </span>
          </OverlayTrigger>
          {permission?.[0]?.action?.includes('FeedUpdate') && (
            <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
              <span style={{ cursor: 'pointer' }}>
                <FaEdit size={18} color="blue" onClick={() => openEditModal(row)} />
              </span>
            </OverlayTrigger>
          )}
          {/* Add Developer */}
          {permission?.[0]?.action?.includes('AssignDeveloper') && !row?.developers?.length && (
            <OverlayTrigger placement="top" overlay={<Tooltip id={`add-dev-${row._id}`}>Add Developer</Tooltip>}>
              <span style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <FaUserPlus size={18} color="orange" onClick={() => openAssignDeveloperModal(row)} />
              </span>
            </OverlayTrigger>
          )}
          {permission?.[0]?.action?.includes('FeedDelete') && (
            <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
              <span style={{ cursor: 'pointer' }}>
                <FaTrash size={18} color="red" onClick={() => openDeleteModal(row)} />
              </span>
            </OverlayTrigger>
          )}
        </div>
      )
    }
  ];

  /* ------------------ RENDER ------------------ */
  return (
    <>
      <ToastContainer />

      <Row>
        <Col>
          <Card title="Feed List">
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control placeholder="Search feed..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </Col>

              <Col md={6} className="text-end">
                {permission?.[0]?.action?.includes('FeedCreate') && (
                  <Button variant="dark" onClick={() => setShowCreateModal(true)}>
                    + Add Feed
                  </Button>
                )}
              </Col>
            </Row>

            {loading ? (
              <div className="text-center my-3">
                <Spinner />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={feeds}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={(p) => fetchFeeds(p, limit, search)}
                onChangeRowsPerPage={(l, p) => fetchFeeds(p, l, search)}
                responsive
                striped
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* -------- CREATE FEED MODAL -------- */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create Feed</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="required">Platform Name </Form.Label>
                <Form.Control value={formData.platformName} onChange={(e) => setFormData({ ...formData, platformName: e.target.value })} />
              </Form.Group>
            </Col>

            {/* <Col md={6}>
              <Form.Group>
                <Form.Label className="required">Industry </Form.Label>
                <Select options={industryOptions} onChange={(v) => setFormData({ ...formData, industryType: v.value })} />
              </Form.Group>
            </Col> */}

            <Col md={4} className="">
              <Form.Group>
                <Form.Label className="required">Platform Type </Form.Label>
                <Select options={platformTypeOptions} onChange={(v) => setFormData({ ...formData, platformType: v.value })} />
              </Form.Group>
            </Col>
            <Col md={4} className="">
              <Form.Group>
                <Form.Label className="required">Scope Type </Form.Label>
                <Select options={scopeTypeOptions} onChange={(v) => setFormData({ ...formData, scopeType: v.value })} />
              </Form.Group>
            </Col>

            {/* <Col md={6} className="mt-3">
              <Form.Group>
                <Form.Label className="required">Delivery Type </Form.Label>
                <Select options={deliveryOptions} onChange={(v) => setFormData({ ...formData, deliveryType: v.value })} />
              </Form.Group>
            </Col> */}

            <Col md={4} className="mt-3">
              <Form.Label className="required">Frequency</Form.Label>
              <Select
                options={frequencyOptions}
                value={frequencyOptions.find((o) => o.value === formData.frequencyType)}
                onChange={handleFrequencyChange}
                isClearable
              />
            </Col>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {formData.frequencyType === 'Weekly' && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Day</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.find((d) => d.value === schedule.day) || null}
                    onChange={(v) => setSchedule({ ...schedule, day: v?.value || '' })}
                    isClearable
                  />
                </Col>
              )}
              {formData.frequencyType === 'Bi-Weekly' && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Day(s)</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.filter((d) => schedule.day?.split(',').includes(d.value))}
                    onChange={(selectedOptions) => {
                      if (selectedOptions && selectedOptions.length > 2) {
                        toast.error('You can select only 2 days'); // Or any alert method
                        return;
                      }
                      setSchedule({
                        ...schedule,
                        day: selectedOptions ? selectedOptions.map((opt) => opt.value).join(',') : ''
                      });
                    }}
                    isClearable
                    isMulti
                    placeholder="Select up to 2 days"
                  />
                </Col>
              )}

              {/* BI-WEEKLY / BI-MONTHLY → FIRST DATE */}
              {['Bi-Monthly'].includes(formData.frequencyType) && (
                <Col md={2} className="mt-3">
                  <Form.Label className="required">First Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={schedule.firstDate ? dayjs().date(parseInt(schedule.firstDate)) : null}
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        firstDate: v ? dayjs(v).format('DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {['Bi-Monthly'].includes(formData.frequencyType) && (
                <Col md={2} className="mt-3">
                  <Form.Label className="required">Second Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={schedule.secondDate ? dayjs().date(parseInt(schedule.secondDate)) : null}
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        secondDate: v ? dayjs(v).format('DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}
              {/* MONTHLY */}
              {['Custom'].includes(formData.frequencyType) && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    value={schedule.date ? dayjs(schedule.date, 'YYYY-MM-DD') : null}
                    format="YYYY-MM-DD"
                    minDate={dayjs()}
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('YYYY-MM-DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
              {['Monthly'].includes(formData.frequencyType) && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only allow selecting the day
                    value={schedule.date ? dayjs().date(parseInt(schedule.date)) : null} // show selected day
                    onChange={(v) =>
                      setSchedule({
                        ...schedule,
                        date: v ? dayjs(v).format('DD') : '' // store day as string
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {/* TIME → ALWAYS */}
              {formData.frequencyType && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Time</Form.Label>
                  <TimePicker
                    ampm={false}
                    value={schedule.time}
                    onChange={(v) => setSchedule({ ...schedule, time: v })}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
            </LocalizationProvider>

            <Col md={12} className="mt-3">
              <Form.Group>
                <Form.Label className="required">Country </Form.Label>
                <Select
                  options={countryList}
                  isMulti
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      countries: v.map((c) => ({
                        name: c.label,
                        code: c.value
                      }))
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={12} className="mt-3">
              <Form.Group>
                <Form.Label className="required">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            {' '}
            <Col md={12} className="mb-3">
              <Form.Label>Feed Name</Form.Label>
              <Form.Control value={generateFeedName()} readOnly disabled className="bg-light fw-semibold" />
              <small className="text-muted">Feed name is auto-generated based on your selections</small>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleCreateFeed}>
            Create Feed
          </Button>
        </Modal.Footer>
      </Modal>

      {/* -------- STATUS MODAL -------- */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Change status of <b>{selectedFeed?.feedName}</b>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmStatusChange}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Feed</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            {/* PLATFORM NAME */}
            <Col md={4}>
              <Form.Label className="required">Platform Name</Form.Label>
              <Form.Control
                value={editFormData.platformName}
                onChange={(e) => setEditFormData({ ...editFormData, platformName: e.target.value })}
                disabled
              />
            </Col>

            {/* PLATFORM TYPE */}
            <Col md={4}>
              <Form.Label className="required">Platform Type</Form.Label>
              <Select
                options={platformTypeOptions}
                value={platformTypeOptions.find((o) => o.value === editFormData.platformType)}
                onChange={(v) => setEditFormData({ ...editFormData, platformType: v.value })}
                isDisabled
              />
            </Col>

            {/* SCOPE */}
            <Col md={4}>
              <Form.Label className="required">Scope Type</Form.Label>
              <Select
                options={scopeTypeOptions}
                value={scopeTypeOptions.find((o) => o.value === editFormData.scopeType)}
                onChange={(v) => setEditFormData({ ...editFormData, scopeType: v.value })}
              />
            </Col>

            {/* FREQUENCY (SAME AS CREATE) */}
            <Col md={4} className="mt-3">
              <Form.Label className="required">Frequency</Form.Label>
              <Select
                options={frequencyOptions}
                value={frequencyOptions.find((o) => o.value === editFormData.frequencyType)}
                onChange={handleEditFrequencyChange}
              />
            </Col>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {editFormData.frequencyType === 'Weekly' && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Day</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.find((d) => d.value === editSchedule.day) || null}
                    onChange={(v) => setEditSchedule({ ...editSchedule, day: v?.value || '' })}
                    isClearable
                  />
                </Col>
              )}
              {editFormData.frequencyType === 'Bi-Weekly' && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Day(s)</Form.Label>
                  <Select
                    options={dayOptions}
                    value={dayOptions.filter((d) => editSchedule.day?.split(',').includes(d.value))}
                    onChange={(selectedOptions) => {
                      if (selectedOptions && selectedOptions.length > 2) {
                        toast.error('You can select only 2 days'); // Or any alert method
                        return;
                      }
                      setEditSchedule({
                        ...editSchedule,
                        day: selectedOptions ? selectedOptions.map((opt) => opt.value).join(',') : ''
                      });
                    }}
                    isClearable
                    isMulti
                    placeholder="Select up to 2 days"
                  />
                </Col>
              )}

              {/* BI-WEEKLY / BI-MONTHLY → FIRST DATE */}
              {['Bi-Monthly'].includes(editFormData.frequencyType) && (
                <Col md={2} className="mt-3">
                  <Form.Label className="required">First Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={editSchedule.firstDate ? dayjs().date(parseInt(editSchedule.firstDate)) : null}
                    onChange={(v) =>
                      setEditSchedule({
                        ...editSchedule,
                        firstDate: v ? dayjs(v).format('DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {['Bi-Monthly'].includes(editFormData.frequencyType) && (
                <Col md={2} className="mt-3">
                  <Form.Label className="required">Second Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only day selection
                    value={editSchedule.secondDate ? dayjs().date(parseInt(editSchedule.secondDate)) : null}
                    onChange={(v) =>
                      setEditSchedule({
                        ...schedule,
                        secondDate: v ? dayjs(v).format('DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}
              {/* MONTHLY */}
              {['Custom'].includes(editFormData.frequencyType) && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    value={editSchedule.date ? dayjs(editSchedule.date, 'YYYY-MM-DD') : null}
                    format="YYYY-MM-DD"
                    minDate={dayjs()}
                    onChange={(v) =>
                      setEditSchedule({
                        ...editSchedule,
                        date: v ? dayjs(v).format('YYYY-MM-DD') : ''
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
              {['Monthly'].includes(editFormData.frequencyType) && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Date</Form.Label>
                  <DatePicker
                    views={['day']} // Only allow selecting the day
                    value={editSchedule.date ? dayjs().date(parseInt(editSchedule.date)) : null} // show selected day
                    onChange={(v) =>
                      setEditSchedule({
                        ...editSchedule,
                        date: v ? dayjs(v).format('DD') : '' // store day as string
                      })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    inputFormat="DD"
                  />
                </Col>
              )}

              {/* TIME → ALWAYS */}
              {editFormData.frequencyType && (
                <Col md={4} className="mt-3">
                  <Form.Label className="required">Delivery Time</Form.Label>
                  <TimePicker
                    ampm={false}
                    value={editSchedule.time}
                    onChange={(v) => setEditSchedule({ ...editSchedule, time: v })}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Col>
              )}
            </LocalizationProvider>

            {/* COUNTRY */}
            <Col md={12} className="mt-3">
              <Form.Label className="required">Country</Form.Label>
              <Select
                options={countryList}
                isMulti
                value={editFormData.countries.map((c) => ({
                  label: c.name,
                  value: c.code
                }))}
                onChange={(v) =>
                  setEditFormData({
                    ...editFormData,
                    countries: v.map((c) => ({ name: c.label, code: c.value }))
                  })
                }
              />
            </Col>

            {/* DESCRIPTION */}
            <Col md={12} className="mt-3">
              <Form.Label className="required">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </Col>
            {editDevelopers?.length > 0 && (
              <Col md={12} className="mt-3">
                <Form.Label>Developers</Form.Label>
                <Select options={developers} isMulti value={editDevelopers} onChange={setEditDevelopers} />
              </Col>
            )}
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleUpdateFeed}>
            Update Feed
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignDevModal} onHide={() => setShowAssignDevModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Developers</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="required">Developers</Form.Label>
            <Select options={developers} isMulti value={selectedDevs} onChange={setSelectedDevs} placeholder="Select Developers" />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignDevModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleAssignDevelopers}>
            Add Developer
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showStatusUpdateModal} onHide={() => setShowStatusUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Feed Status</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Label className="required">Status</Form.Label>
            <Select options={feedStatusOptions} value={selectedStatus} onChange={setSelectedStatus} placeholder="Select Status" />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Feed</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>Are you sure you want to delete the feed:</p>
          <div className="fw-bold text-danger">{deleteFeed?.feedName}</div>
          <small className="text-muted">This action cannot be undone.</small>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>

          <Button variant="danger" onClick={handleDeleteFeed} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ApiconfigrationList;
