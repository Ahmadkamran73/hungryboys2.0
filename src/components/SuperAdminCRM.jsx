import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, authHeaders } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { handleError } from '../utils/errorHandler';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { buildStatusCounts, buildDailySeries, buildCollectionSplit, buildDeliveredStats, buildHourlyCounts, buildTopRestaurants, buildOrdersByDay, buildDeliveriesByPeriod } from '../utils/crm';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function SuperAdminCRM() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' or specific day index
  const [deliveryPeriod, setDeliveryPeriod] = useState('1day'); // '1day', '7days', '1month', '6months', '1year', 'all'
  const [ordersByDayPeriod, setOrdersByDayPeriod] = useState('7days'); // Period for orders by day chart

  // Poll every 15s for real-time-like refresh
  useEffect(() => {
    let timer;
    const fetchOrders = async () => {
      try {
        setError('');
        const headers = await authHeaders(user);
        const resp = await api.get('/api/orders/all', { headers, params: { limit: 1000 } });
        setOrders(Array.isArray(resp.data) ? resp.data : []);
      } catch (err) {
        const handled = handleError(err, 'SuperAdminCRM - fetchOrders');
        setError(handled.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
      timer = setInterval(fetchOrders, 15000);
    }
    return () => timer && clearInterval(timer);
  }, [user]);

  const stats = useMemo(() => {
    if (!orders?.length) return { total: 0, revenue: 0, today: 0, week: 0, month: 0, avg: 0, deliveriesToday: 0, deliveriesMonth: 0, deliveriesTotal: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    let revenue = 0, today = 0, week = 0, month = 0, deliveriesToday = 0, deliveriesMonth = 0, deliveriesTotal = 0;
    for (const o of orders) {
      const created = new Date(o.createdAt);
      revenue += Number(o.grandTotal || 0);
      const persons = Number(o.persons || 0);
      deliveriesTotal += persons;
      if (created >= startOfToday) {
        today += 1;
        deliveriesToday += persons;
      }
      if (created >= weekAgo) week += 1;
      if (created >= startOfMonth) {
        month += 1;
        deliveriesMonth += persons;
      }
    }
    return { total: orders.length, revenue, today, week, month, avg: orders.length ? revenue / orders.length : 0, deliveriesToday, deliveriesMonth, deliveriesTotal };
  }, [orders]);

  // Chart datasets
  const statusCounts = useMemo(() => buildStatusCounts(orders), [orders]);
  const series = useMemo(() => buildDailySeries(orders, 14), [orders]);
  const collection = useMemo(() => buildCollectionSplit(orders), [orders]);
  const deliveredStats = useMemo(() => buildDeliveredStats(orders), [orders]);
  const hourly = useMemo(() => {
    if (selectedDay === 'all') {
      return buildHourlyCounts(orders, 7);
    } else {
      // Filter orders for specific day
      const dayIndex = parseInt(selectedDay);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - dayIndex);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= startOfDay && created < endOfDay;
      });
      
      const counts = new Array(24).fill(0);
      for (const o of dayOrders) {
        const h = new Date(o.createdAt).getHours();
        counts[h] += 1;
      }
      return counts;
    }
  }, [orders, selectedDay]);
  const topRestaurants = useMemo(() => buildTopRestaurants(orders, 5), [orders]);
  const ordersByDay = useMemo(() => buildOrdersByDay(orders, ordersByDayPeriod), [orders, ordersByDayPeriod]);
  const deliveriesByPeriod = useMemo(() => buildDeliveriesByPeriod(orders, deliveryPeriod), [orders, deliveryPeriod]);
  
  // Theming for charts (dark/light)
  const axisColor = isDark ? '#E5E7EB' : '#374151';
  const gridColor = isDark ? 'rgba(229,231,235,0.15)' : 'rgba(17,24,39,0.08)';
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';

  const lineData = {
    labels: series.labels,
    datasets: [
      {
        label: 'Orders',
        data: series.counts,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79,70,229,0.2)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Revenue (Rs)',
        data: series.revenue,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.2)',
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: axisColor } },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: axisColor,
        bodyColor: axisColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: { ticks: { color: axisColor }, grid: { color: gridColor } },
      y: { type: 'linear', position: 'left', ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } },
      y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false, color: gridColor }, ticks: { color: axisColor } }
    }
  };

  const barData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Orders by Status',
      data: Object.values(statusCounts),
      backgroundColor: ['#9CA3AF','#0EA5E9','#F59E0B','#3B82F6','#6366F1','#10B981','#EF4444']
    }]
  };
  const barOptions = { responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } } } };

  const doughnutData = {
    labels: ['Delivered (Collected)', 'Receivable'],
    datasets: [{
      data: [collection.delivered, collection.receivable],
      backgroundColor: ['#10B981', '#EF4444']
    }]
  };
  const doughnutOptions = { plugins: { legend: { labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } } };

  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, h) => `${h}:00`),
    datasets: [{
      label: 'Orders by Hour (7d)',
      data: hourly,
      backgroundColor: '#60A5FA'
    }]
  };
  const hourlyOptions = { responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { grid: { display: false }, ticks: { color: axisColor } }, y: { ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } } } };

  const topRestaurantsData = {
    labels: topRestaurants.labels,
    datasets: [{
      label: 'Revenue (Rs)',
      data: topRestaurants.values,
      backgroundColor: '#3B82F6'
    }]
  };
  const topRestaurantsOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { ticks: { color: axisColor }, grid: { color: gridColor } } } };

  const ordersByDayData = {
    labels: ordersByDay.labels,
    datasets: [{
      label: 'Orders by Day',
      data: ordersByDay.counts,
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 2
    }]
  };
  const ordersByDayOptions = { responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } } } };

  if (loading) return <LoadingSpinner message="Loading CRM..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="campus-dashboard-container">
      <div className="dashboard-header">
        <h2>CRM Overview (All Campuses)</h2>
        <p className="text-muted">Auto-refreshing every 15 seconds</p>
      </div>

      {/* Charts Section - Moved to Top */}
      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Orders & Revenue (Last 14 days)</h5>
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setChartType('line')}
                >
                  Line Chart
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setChartType('bar')}
                >
                  Bar Chart
                </button>
              </div>
            </div>
            {chartType === 'line' ? (
              <Line data={lineData} options={lineOptions} height={80} />
            ) : (
              <Bar data={lineData} options={lineOptions} height={80} />
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mt-3">
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <h5 className="mb-3">Top Restaurants by Revenue</h5>
            <Bar data={topRestaurantsData} options={topRestaurantsOptions} height={120} />
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Orders by Hour</h5>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="all">Last 7 days</option>
                <option value="0">Today</option>
                <option value="1">Yesterday</option>
                <option value="2">2 days ago</option>
                <option value="3">3 days ago</option>
                <option value="4">4 days ago</option>
                <option value="5">5 days ago</option>
                <option value="6">6 days ago</option>
              </select>
            </div>
            <Bar data={hourlyData} options={hourlyOptions} height={120} />
          </div>
        </div>
      </div>

      {/* New Charts: Orders by Day and Deliveries by Period */}
      <div className="row g-4 mt-3">
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Orders by Day</h5>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={ordersByDayPeriod}
                onChange={(e) => setOrdersByDayPeriod(e.target.value)}
              >
                <option value="1day">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="1month">This Month</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <Bar data={ordersByDayData} options={ordersByDayOptions} height={120} />
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Deliveries by Period</h5>
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={deliveryPeriod}
                onChange={(e) => setDeliveryPeriod(e.target.value)}
              >
                <option value="1day">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="1month">This Month</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="text-center py-4">
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#3B82F6' }}>
                {deliveriesByPeriod.totalDeliveries}
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-color, #6B7280)', marginTop: '0.5rem' }}>
                Total Delivery Persons
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '0.5rem' }}>
                From {deliveriesByPeriod.totalOrders} orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Moved Below Charts */}
      <div className="stats-grid mt-4">
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Orders</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">Rs. {stats.revenue.toFixed(0)}</div><div className="stat-label">Total Revenue</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.today}</div><div className="stat-label">Orders Today</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.month}</div><div className="stat-label">Orders This Month</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.deliveriesToday}</div><div className="stat-label">Deliveries Today</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.deliveriesMonth}</div><div className="stat-label">Deliveries This Month</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{stats.deliveriesTotal}</div><div className="stat-label">Total Deliveries</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">Rs. {stats.avg.toFixed(0)}</div><div className="stat-label">Avg Order Value</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">{Math.round(deliveredStats.rate*100)}%</div><div className="stat-label">Delivered Rate</div></div></div>
        <div className="stat-card"><div className="stat-icon"></div><div className="stat-content"><div className="stat-value">Rs. {Math.round(deliveredStats.receivableAmount)}</div><div className="stat-label">Receivable</div></div></div>
      </div>

      {/* Orders by Status Chart - Removed as per requirement */}
      {/* <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card p-3">
            <h5 className="mb-3">Orders by Status</h5>
            <Bar data={barData} options={barOptions} height={90} />
          </div>
        </div>
      </div> */}
    </div>
  );
}
