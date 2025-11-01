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
import { buildStatusCounts, buildDailySeries, buildCollectionSplit, buildDeliveredStats, buildHourlyCounts, buildTopItemsForRestaurant } from '../utils/crm';

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

export default function RestaurantManagerCRM() {
  const { user, userData } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let timer;
    const fetchOrders = async () => {
      try {
        setError('');
        const headers = await authHeaders(user);
        if (!userData?.restaurantId) return;
        const resp = await api.get(`/api/orders/restaurant/${userData.restaurantId}`, { headers, params: { limit: 1000 } });
        setOrders(Array.isArray(resp.data) ? resp.data : []);
      } catch (err) {
        const handled = handleError(err, 'RestaurantManagerCRM - fetchOrders');
        setError(handled.message);
      } finally {
        setLoading(false);
      }
    };
    if (userData?.restaurantId) {
      fetchOrders();
      timer = setInterval(fetchOrders, 15000);
    }
    return () => timer && clearInterval(timer);
  }, [user, userData?.restaurantId]);

  const stats = useMemo(() => {
    if (!orders?.length) return { total: 0, revenue: 0, today: 0, week: 0, avg: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    let revenue = 0, today = 0, week = 0;
    for (const o of orders) {
      const created = new Date(o.createdAt);
      revenue += Number(o.grandTotal || 0);
      if (created >= startOfToday) today += 1;
      if (created >= weekAgo) week += 1;
    }
    return { total: orders.length, revenue, today, week, avg: orders.length ? revenue / orders.length : 0 };
  }, [orders]);

  const statusCounts = useMemo(() => buildStatusCounts(orders), [orders]);
  const series = useMemo(() => buildDailySeries(orders, 14), [orders]);
  const collection = useMemo(() => buildCollectionSplit(orders), [orders]);
  const deliveredStats = useMemo(() => buildDeliveredStats(orders), [orders]);
  const hourly = useMemo(() => buildHourlyCounts(orders, 7), [orders]);
  const topItems = useMemo(() => buildTopItemsForRestaurant(orders, 5), [orders]);
  
  // Theming for charts (dark/light)
  const axisColor = isDark ? '#E5E7EB' : '#374151';
  const gridColor = isDark ? 'rgba(229,231,235,0.15)' : 'rgba(17,24,39,0.08)';
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB';

  const lineData = {
    labels: series.labels,
    datasets: [
      { label: 'Orders', data: series.counts, borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.2)', tension: 0.3, yAxisID: 'y' },
      { label: 'Revenue (Rs)', data: series.revenue, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.2)', tension: 0.3, yAxisID: 'y1' }
    ]
  };
  const lineOptions = { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top', labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { type: 'linear', position: 'left', ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } }, y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false, color: gridColor }, ticks: { color: axisColor } } } };
  const barData = { labels: Object.keys(statusCounts), datasets: [{ label: 'Orders by Status', data: Object.values(statusCounts), backgroundColor: ['#9CA3AF','#0EA5E9','#F59E0B','#3B82F6','#6366F1','#10B981','#EF4444'] }] };
  const barOptions = { responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } } } };
  const doughnutData = { labels: ['Delivered (Collected)', 'Receivable'], datasets: [{ data: [collection.delivered, collection.receivable], backgroundColor: ['#10B981', '#EF4444'] }] };
  const doughnutOptions = { plugins: { legend: { labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } } };
  const hourlyData = { labels: Array.from({ length: 24 }, (_, h) => `${h}:00`), datasets: [{ label: 'Orders by Hour (7d)', data: hourly, backgroundColor: '#60A5FA' }] };
  const hourlyOptions = { responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { grid: { display: false }, ticks: { color: axisColor } }, y: { ticks: { precision: 0, color: axisColor }, grid: { color: gridColor } } } };
  const topItemsData = { labels: topItems.labels, datasets: [{ label: 'Qty', data: topItems.values, backgroundColor: '#F59E0B' }] };
  const topItemsOptions = { indexAxis: 'y', responsive: true, plugins: { legend: { display: false, labels: { color: axisColor } }, tooltip: { backgroundColor: tooltipBg, titleColor: axisColor, bodyColor: axisColor, borderColor: tooltipBorder, borderWidth: 1, padding: 10 } }, scales: { x: { ticks: { color: axisColor }, grid: { color: gridColor } }, y: { ticks: { color: axisColor }, grid: { color: gridColor } } } };

  if (loading) return <LoadingSpinner message="Loading CRM..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="campus-dashboard-container">
      <div className="dashboard-header">
        <h2>📈 CRM Overview (Restaurant)</h2>
        <p className="text-muted">Auto-refreshing every 15 seconds • {userData?.restaurantName || 'your restaurant'}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-content"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Orders</div></div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-content"><div className="stat-value">Rs. {stats.revenue.toFixed(0)}</div><div className="stat-label">Total Revenue</div></div></div>
        <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-content"><div className="stat-value">{stats.today}</div><div className="stat-label">Today</div></div></div>
        <div className="stat-card"><div className="stat-icon">⚖️</div><div className="stat-content"><div className="stat-value">Rs. {stats.avg.toFixed(0)}</div><div className="stat-label">Avg Order Value</div></div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-content"><div className="stat-value">{Math.round(deliveredStats.rate*100)}%</div><div className="stat-label">Delivered Rate</div></div></div>
        <div className="stat-card"><div className="stat-icon">📉</div><div className="stat-content"><div className="stat-value">Rs. {Math.round(deliveredStats.receivableAmount)}</div><div className="stat-label">Receivable</div></div></div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-lg-8">
          <div className="card p-3 h-100">
            <h5 className="mb-3">Orders & Revenue (Last 14 days)</h5>
            <Line data={lineData} options={lineOptions} height={120} />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card p-3 h-100">
            <h5 className="mb-3">Collection Split</h5>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card p-3">
            <h5 className="mb-3">Orders by Status</h5>
            <Bar data={barData} options={barOptions} height={90} />
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <h5 className="mb-3">Top Items (Qty)</h5>
            <Bar data={topItemsData} options={topItemsOptions} height={120} />
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card p-3 h-100">
            <h5 className="mb-3">Orders by Hour (Last 7 days)</h5>
            <Bar data={hourlyData} options={hourlyOptions} height={120} />
          </div>
        </div>
      </div>
    </div>
  );
}
