import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import GaugeComponent from 'react-gauge-component';
import { addMinutes, addHours } from 'date-fns';
import { FcSearch } from 'react-icons/fc';
import { AiOutlineClear } from 'react-icons/ai';
import { LuTimerReset } from 'react-icons/lu';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { api } from 'views/api';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// import DashboardTour from './DashboardTour';

const animatedComponents = makeAnimated();

const DashDefault = () => {
  // const gauges = [{ title: 'Success Ratio', value: 70 }];
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [TotalApi, setTotalApi] = useState(0);
  const [TotalLogs, setTotalLogs] = useState(0);
  const [TotalSuccessLog, setTotalSuccessLog] = useState(0);
  const [TotalFailureLog, setTotalFailureLog] = useState(0);
  const [apiData, setApiData] = useState([]);
  const [dataloading, setDataLoading] = useState(false);

  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [range, setRange] = useState([null, null]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [openedOnce, setOpenedOnce] = useState(false);
  // 🔹 Fetch API Names

  const fetchSearchData = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await axios.get(`${api}/api-by-search?search=${inputValue}`, {
        withCredentials: true
      });
      if (res.status == 200) {
        setOptions(
          res.data?.data?.map((item) => ({
            value: item._id,
            label: item.apiName
          })) || []
        );
      }
      return (
        res.data?.data?.map((item) => ({
          value: item._id,
          label: item.apiName
        })) || []
      );
    } catch (err) {
      console.error('Error fetching data:', err);
      return [];
    }
  };

  const handleClear = () => {
    setSelected([]);
    setRange([null, null]);
    setSelectedDateTime(null);
    fetchDashboardData();
  };
  const fetchDashboardData = async (filter = false) => {
    setDataLoading(true);
    const ids = selected.map((item) => item.value);
    if (!ids) return;
    console.log('range date ', range);
    const [startDate, endDate] = range.map((date) => (date ? format(date, 'yyyy-MM-dd HH:mm:ss') : null));

    try {
      const params = {};

      if (filter && ids && ids.length > 0) {
        params.ids = ids.join(',');
      }
      if (filter && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      console.log('params', params);
      const res = await axios.get(`${api}/api-dashboard-data`, {
        withCredentials: true,
        params
      });
      if (res.status === 200) {
        setData(res.data?.data || []);
        setTotalApi(res.data?.TotalApi || 0);
        setTotalLogs(res.data?.totalCount || 0);
        setTotalSuccessLog(res.data?.successCount || 0);
        setTotalFailureLog(res.data?.failureCount || 0);
        console.log('Dashboard data:', res.data?.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      return [];
    } finally {
      setDataLoading(false);
    }
  };
  const fetchApiData = async () => {
    try {
      const res = await axios.get(`${api}/dashboard-api-list`, {
        withCredentials: true
      });
      if (res.status === 200) {
        setApiData(res.data?.data || []);
        const apiOptions =
          res.data?.data?.map((item) => ({
            value: item._id,
            label: item.apiName
          })) || [];
        setOptions(apiOptions);
      }
    } catch (error) {
      console.error('Error fetching API list:', error);
    }
  };
  const getIntervalMs = (interval) => {
    switch (interval) {
      case '30s':
        return 30000;
      case '1m':
        return 60000;
      case '5m':
        return 300000;
      case '15m':
        return 900000;
      default:
        return 30000; // fallback
    }
  };
  useEffect(() => {
    if (refreshInterval !== 'manual') {
      fetchDashboardData(); // Initial fetch
      const interval = setInterval(() => {
        fetchDashboardData();
      }, getIntervalMs(refreshInterval));

      // Cleanup when refreshInterval changes or component unmounts
      return () => clearInterval(interval);
    }
    fetchDashboardData();
  }, [refreshInterval]);

  useEffect(() => {
    fetchApiData();
    fetchSearchData();
  }, []);

  const quickRanges = [
    { label: 'Last 5 minutes', fn: () => [addMinutes(new Date(), -5), new Date()] },
    { label: 'Last 15 minutes', fn: () => [addMinutes(new Date(), -15), new Date()] },
    { label: 'Last 30 minutes', fn: () => [addMinutes(new Date(), -30), new Date()] },
    { label: 'Last 1 hour', fn: () => [addHours(new Date(), -1), new Date()] },
    { label: 'Last 3 hours', fn: () => [addHours(new Date(), -3), new Date()] },
    { label: 'Last 6 hours', fn: () => [addHours(new Date(), -6), new Date()] },
    { label: 'Last 12 hours', fn: () => [addHours(new Date(), -12), new Date()] },
    { label: 'Last 24 hours', fn: () => [addHours(new Date(), -24), new Date()] }
  ];
  const formatNumber = (num) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
  };
  return (
    <React.Fragment>
      {/* <DashboardTour /> */}
      <Row className="mt-4 g-3 align-items-center mb-3">
        <Col md={3} xs={12}>
          <label className="form-label d-block mb-1">Search API</label>
          <Select
            isMulti
            closeMenuOnSelect={false}
            components={animatedComponents}
            loadOptions={fetchSearchData}
            // onInputChange={(input) => {
            //   fetchSearchData(input).then((data) => setOptions(data));
            // }}
            options={options}
            value={selected}
            onChange={(selectedItems) => setSelected(selectedItems)}
            placeholder="Search & select API"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: '40px',
                border: state.isFocused ? '1px solid #070707ff' : '1px solid #ccc',
                boxShadow: 'none',
                fontSize: '14px'
              }),
              menu: (base) => ({
                ...base,
                borderColor: '#070707ff',
                fontSize: '12px'
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '2px 8px'
              })
            }}
          />
        </Col>

        <Col md={5} xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Row className="g-2">
              <Col xs={6}>
                <label className="form-label d-block mb-1">Start Date Time</label>
                <DateTimePicker
                  value={range[0]}
                  onChange={(newValue) => setRange([newValue, range[1]])}
                  format="dd/MM/yyyy hh:mm a" // controls how selected value is displayed
                  maxDateTime={new Date()}
                  slotProps={{
                    textField: {
                      placeholder: 'DD/MM/YYYY HH:MM AM/PM', // ✅ fixed placeholder
                      size: 'small',
                      fullWidth: true,
                      sx: { minHeight: '40px', borderRadius: '5px' }
                    }
                  }}
                />
              </Col>
              <Col xs={6}>
                <label className="form-label d-block mb-1">End Date Time</label>
                <DateTimePicker
                  value={range[1]}
                  onChange={(newValue) => setRange([range[0], newValue])}
                  format="dd/MM/yyyy hh:mm a"
                  maxDateTime={new Date()}
                  minDate={range[0]}
                  slotProps={{
                    textField: {
                      placeholder: 'DD/MM/YYYY HH:MM AM/PM',
                      size: 'small',
                      fullWidth: true,
                      sx: { minHeight: '40px', borderRadius: '5px' }
                    }
                  }}
                />
              </Col>
            </Row>
          </LocalizationProvider>
        </Col>
        <Col md={4} xs={12} className="d-flex justify-content-end">
          <Row className="g-2 w-100 justify-content-end">
            <Col xs={5}>
              <label className="form-label d-block mb-1">Range</label>
              <Select
                isClearable
                closeMenuOnSelect
                components={animatedComponents}
                placeholder="Range"
                value={selectedDateTime ? { label: selectedDateTime.label } : null}
                onChange={(selectedItem) => {
                  if (selectedItem) {
                    const rangeItem = quickRanges.find((q) => q.label === selectedItem.label);
                    if (rangeItem) {
                      const [start, end] = rangeItem.fn();
                      setSelectedDateTime(rangeItem);
                      setRange([start, end]);
                    }
                  } else {
                    setSelectedDateTime(null);
                  }
                }}
                options={quickRanges.map((item) => ({
                  label: item.label,
                  value: item.label
                }))}
              />
            </Col>
            <Col xs={3}>
              <label className="form-label d-block mb-1">Refresh</label>
              <Select
                isClearable={false}
                value={{ label: refreshInterval, value: refreshInterval }}
                onChange={(selectedOption) => setRefreshInterval(selectedOption.value)}
                options={[
                  { value: '30s', label: '30s' },
                  { value: '1m', label: '1 min' },
                  { value: '5m', label: '5 min' },
                  { value: '15m', label: '15 min' },
                  { value: 'Manual', label: 'Manual' }
                ]}
              />
            </Col>
          </Row>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col className="d-flex gap-2 justify-content-end">
          <Button variant="outline-dark" onClick={fetchDashboardData}>
            <FcSearch /> Search
          </Button>
          <Button variant="outline-dark" onClick={handleClear}>
            <AiOutlineClear /> Clear
          </Button>
        </Col>
      </Row>
      <Box sx={{ width: '100%', mb: 3 }}>{dataloading && <LinearProgress />}</Box>
      <Card className="shadow-sm border-0 rounded-3  p-1">
        <Card.Body className="p-1">
          <Row className="text-center">
            <Col xs={6} md>
              <div>
                <small className="text-muted">Total Requests</small>
                <h2 className="fw-bold text-primary">{formatNumber(TotalLogs || 0)}</h2>
              </div>
            </Col>
            <Col xs={6} md>
              <div>
                <small className="text-muted">Successful Requests</small>
                <h2 className="fw-bold text-success">{formatNumber(TotalSuccessLog || 0)}</h2>
                <small className="text-success">{TotalLogs > 0 ? `${((TotalSuccessLog / TotalLogs) * 100).toFixed(2)}%` : '0%'}</small>
              </div>
            </Col>
            <Col xs={6} md>
              <div>
                <small className="text-muted">Failed Requests</small>
                <h2 className="fw-bold text-danger">{formatNumber(TotalFailureLog || 0)}</h2>
                <small className="text-danger">{TotalLogs > 0 ? `${((TotalFailureLog / TotalLogs) * 100).toFixed(2)}%` : '0%'}</small>
              </div>
            </Col>
            <Col xs={6} md>
              <div>
                <small className="text-muted">Total API</small>
                <h2 className="fw-bold text-info">{TotalApi || 0}</h2>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
     <Row className="mt-4">
  {(data?.length === 0 ? apiData : data)?.map((items, index) => (
    <Col
      key={index}
      className="mb-4"
      xs={12}       // Mobile → 1 per row
      sm={5}        // Small → 2 per row
      md={4}        // Medium → 3 per row
      lg={3}        // Large → 4 per row
      xl={3}        // XL → 5 per row
    >
      <Card
        className="shadow-sm rounded-3 text-center"
        style={{ minHeight: "230px" }}
      >
        {/* ---- Latency Top Right ---- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "6px",
            fontSize: "16px",
            fontWeight: "500",
            marginTop: "8px",
            marginRight: "10px",
          }}
        >
          <LuTimerReset size={18} style={{ color: "#555" }} />

          {/* Show tooltip only when data list is NOT empty */}
          {data?.length !== 0 ? (
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip id={`tooltip-execution-${index}`}>
                  <LuTimerReset size={18} style={{ color: "white" }} /> Latency
                </Tooltip>
              }
            >
              <span style={{ cursor: "pointer" }}>
                {((items?.avgExecutionTime || 0) * 1000).toFixed(0)} ms
              </span>
            </OverlayTrigger>
          ) : (
            <span>{((items?.avgExecutionTime || 0) * 1000).toFixed(0)} ms</span>
          )}
        </div>

        {/* ---- Gauge ---- */}
             <GaugeComponent
                    className="p-0"
                    type="grafana"
                    arc={{
                      subArcs: [
                        { limit: 50, color: '#FF4D4D' },
                        { limit: 80, color: '#FFA500' },
                        { limit: 100, color: '#4CAF50' }
                      ],
                      width: 0.25,
                      padding: 0.02,
                      cornerRadius: 5
                    }}
                    labels={{
                      valueLabel: { hide: false, style: { fontSize: '23px', fill: '#000000' } },
                      tickLabels: {
                        hide: true,
                        ticks: [
                          { value: 0, valueConfig: { style: { fill: '#000000', fontSize: '10px' } } },
                          { value: 50, valueConfig: { style: { fill: '#000000', fontSize: '10px' } } },
                          { value: 80, valueConfig: { style: { fill: '#000000', fontSize: '10px' } } },
                          { value: 100, valueConfig: { style: { fill: '#000000', fontSize: '10px' } } }
                        ]
                      },
                      tickLines: { hide: true }
                    }}
                    value={items?.successPercentage ? items.successPercentage : 0}
                    valueLabel={{
                      formatTextValue: (val) => `${val}%`,
                      style: {
                        fontSize: '15px',
                        fontWeight: 'bold',
                        fill: '#cee21dff' // 👈 use fill, not color
                      }
                    }}
                  />

        {/* ---- Success/Total Count (only when filtered data exists) ---- */}
        {data?.length !== 0 && (
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id={`tooltip-count-${index}`}>
                <div style={{ textAlign: "left" }}>
                  <div>
                    <span style={{ color: "green", fontWeight: "bold" }}>●</span>{" "}
                    Successful Requests
                  </div>
                  <div>
                    <span style={{ color: "blue", fontWeight: "bold" }}>●</span>{" "}
                    Total Requests
                  </div>
                </div>
              </Tooltip>
            }
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                marginTop: "8px",
                textAlign: "center",
                padding: "5px",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span style={{ color: "green" }}>{items.successCount}</span> /
              <span style={{ color: "blue" }}> {items.totalCount}</span>
            </div>
          </OverlayTrigger>
        )}

        {/* ---- API Name (clickable) ---- */}
        <div
          className="clickable-card"
          onClick={() => navigate(`/api-detail/${items._id}`)}
          style={{
            fontSize: "12px",
            fontWeight: "500",
            marginTop: "8px",
            textAlign: "center",
            padding: "5px",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          {items.apiName}
        </div>
      </Card>
    </Col>
  ))}
</Row>
    </React.Fragment>
  );
};

export default DashDefault;
