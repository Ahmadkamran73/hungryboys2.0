import React, { useState, useEffect } from 'react';
import { api, authHeaders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';
import '../styles/OrdersPanel.css';
import * as XLSX from 'xlsx';

const STATUSES = ['pending','accepted','preparing','ready','out-for-delivery','delivered','cancelled'];

function StatusBadge({ status }) {
  const color = {
    pending: 'warning',
    accepted: 'info',
    preparing: 'primary',
    ready: 'success',
    'out-for-delivery': 'info',
    delivered: 'success',
    cancelled: 'danger',
  }[status] || 'secondary';
  return <span className={`badge bg-${color} text-uppercase`}>{status || 'pending'}</span>;
}

function formatCartItems(cartItems) {
  if (!cartItems) return 'N/A';
  
  // If it's already a string, return it
  if (typeof cartItems === 'string') return cartItems;
  
  // If it's an array, format it nicely
  if (Array.isArray(cartItems)) {
    return cartItems.map(item => 
      `${item.name} x${item.quantity} - Rs ${item.price * item.quantity}`
    ).join('\n');
  }
  
  return 'N/A';
}

function RestaurantManagerOrdersPanel({ restaurantId, restaurantName }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [filters, setFilters] = useState({
    searchQuery: '',
    gender: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders(user);
      const response = await api.get(`/api/orders/restaurant/${restaurantId}?limit=1000`, { headers });
      setOrders(response.data || []);
    } catch (e) {
      const handledError = handleError(e, 'RestaurantManagerOrdersPanel - fetchOrders');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!user) return;
    try {
      const headers = await authHeaders(user);
      await api.patch(`/api/orders/${id}`, { status }, { headers });
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (e) {
      const handledError = handleError(e, 'RestaurantManagerOrdersPanel - updateStatus');
      setError(handledError.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      gender: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((order) =>
        order.customerName?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query) ||
        order._id?.toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter((order) => order.gender === filters.gender);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.createdAt) <= toDate);
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter((order) => (order.itemsTotal || 0) >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter((order) => (order.itemsTotal || 0) <= Number(filters.maxAmount));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy];
      let bVal = b[filters.sortBy];

      if (filters.sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (filters.sortBy === 'itemsTotal' || filters.sortBy === 'grandTotal') {
        aVal = Number(a.itemsTotal || 0);
        bVal = Number(b.itemsTotal || 0);
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Statistics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.itemsTotal || 0), 0);
  const maleOrders = filteredOrders.filter(o => o.gender === 'male').length;
  const femaleOrders = filteredOrders.filter(o => o.gender === 'female').length;

  const exportToExcel = () => {
    const dataToExport = filteredOrders.map(o => ({
      'Order ID': o._id,
      'Date': formatDate(o.createdAt),
      'Customer': o.customerName,
      'Phone': o.phone,
      // 'Gender': o.gender, // Hidden for Restaurant Manager
      'Campus': o.campusName,
      'University': o.universityName,
      'Items': formatCartItems(o.cartItems),
      'Restaurant Total': o.itemsTotal || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `${restaurantName}_orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <div className="rm-orders-panel">
      <div className="rm-orders-panel-header">
        <div>
          <h3 className="rm-panel-title">Orders for {restaurantName}</h3>
          <p className="rm-panel-subtitle">Manage orders for your restaurant</p>
        </div>
        <div className="rm-header-actions">
          <button className="rm-btn rm-btn-secondary" onClick={fetchOrders}>
            🔄 Refresh
          </button>
          <button className="rm-btn rm-btn-primary" onClick={exportToExcel}>
            📊 Export to Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="rm-alert rm-alert-danger">
          {error}
          <button type="button" className="rm-alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Statistics */}
      <div className="rm-stats-row">
        <div className="rm-stat-box rm-stat-primary">
          <div className="rm-stat-icon">📦</div>
          <div className="rm-stat-content">
            <div className="rm-stat-label">Total Orders</div>
            <div className="rm-stat-number">{totalOrders}</div>
          </div>
        </div>
        <div className="rm-stat-box rm-stat-success">
          <div className="rm-stat-icon">💰</div>
          <div className="rm-stat-content">
            <div className="rm-stat-label">Total Revenue</div>
            <div className="rm-stat-number">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="rm-stat-box rm-stat-info">
          <div className="rm-stat-icon">👨</div>
          <div className="rm-stat-content">
            <div className="rm-stat-label">Male Orders</div>
            <div className="rm-stat-number">{maleOrders}</div>
          </div>
        </div>
        <div className="rm-stat-box rm-stat-warning">
          <div className="rm-stat-icon">👩</div>
          <div className="rm-stat-content">
            <div className="rm-stat-label">Female Orders</div>
            <div className="rm-stat-number">{femaleOrders}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rm-filters-section">
        <div className="rm-filters-grid">
          {/* Search */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Search</label>
            <input
              type="text"
              className="rm-filter-input"
              name="searchQuery"
              placeholder="Name, Phone, Order ID..."
              value={filters.searchQuery}
              onChange={handleFilterChange}
            />
          </div>

          {/* Gender Filter - Hidden for Restaurant Manager */}
          {/* <div className="rm-filter-group">
            <label className="rm-filter-label">Gender</label>
            <select className="rm-filter-select" name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div> */}

          {/* Status Filter */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Status</label>
            <select className="rm-filter-select" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Date From</label>
            <input
              type="date"
              className="rm-filter-input"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>

          {/* Date To */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Date To</label>
            <input
              type="date"
              className="rm-filter-input"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>

          {/* Min Amount */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Min Amount</label>
            <input
              type="number"
              className="rm-filter-input"
              name="minAmount"
              placeholder="0"
              value={filters.minAmount}
              onChange={handleFilterChange}
            />
          </div>

          {/* Max Amount */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Max Amount</label>
            <input
              type="number"
              className="rm-filter-input"
              name="maxAmount"
              placeholder="9999"
              value={filters.maxAmount}
              onChange={handleFilterChange}
            />
          </div>

          {/* Sort By */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Sort By</label>
            <select className="rm-filter-select" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">Date</option>
              <option value="grandTotal">Amount</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="rm-filter-group">
            <label className="rm-filter-label">Order</label>
            <select className="rm-filter-select" name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="rm-filter-group rm-filter-action">
            <button className="rm-btn rm-btn-secondary rm-btn-full" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rm-table-container">
        <table className="rm-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              {/* <th>Gender</th> */}
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="rm-table-empty">
                  No orders found
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order._id}>
                  <td><small className="rm-order-id">{order._id}</small></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.customerName}</td>
                  <td>{order.phone}</td>
                  {/* <td>
                    <span className={`rm-badge ${order.gender === 'male' ? 'rm-badge-blue' : 'rm-badge-pink'}`}>
                      {order.gender}
                    </span>
                  </td> */}
                  <td>
                    <strong>{formatCurrency(order.itemsTotal || 0)}</strong>
                  </td>
                  <td>
                    <button
                      className="rm-btn rm-btn-sm rm-btn-outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rm-pagination">
          <button 
            className="rm-pagination-btn" 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="rm-pagination-numbers">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`rm-pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button 
            className="rm-pagination-btn" 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="rm-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h3 className="rm-modal-title">Order Details - {selectedOrder._id}</h3>
              <button className="rm-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="rm-modal-body">
              <div className="rm-modal-grid">
                <div className="rm-modal-section">
                  <div className="rm-modal-info-item">
                    <span className="rm-modal-label">Customer:</span>
                    <span className="rm-modal-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="rm-modal-info-item">
                    <span className="rm-modal-label">Phone:</span>
                    <span className="rm-modal-value">{selectedOrder.phone}</span>
                  </div>
                  {/* <div className="rm-modal-info-item">
                    <span className="rm-modal-label">Gender:</span>
                    <span className="rm-modal-value">{selectedOrder.gender}</span>
                  </div> */}
                  <div className="rm-modal-info-item">
                    <span className="rm-modal-label">Campus:</span>
                    <span className="rm-modal-value">{selectedOrder.campusName}</span>
                  </div>
                </div>
                <div className="rm-modal-section">
                  <div className="rm-modal-info-item">
                    <span className="rm-modal-label">Date:</span>
                    <span className="rm-modal-value">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="rm-modal-items">
                <strong className="rm-modal-subtitle">Cart Items:</strong>
                <pre className="rm-modal-items-pre">{formatCartItems(selectedOrder.cartItems)}</pre>
              </div>
              <div className="rm-modal-total">
                <span className="rm-modal-total-label">Restaurant Items Total:</span>
                <span className="rm-modal-total-value">{formatCurrency(selectedOrder.itemsTotal || 0)}</span>
              </div>
            </div>
            <div className="rm-modal-footer">
              <button className="rm-btn rm-btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantManagerOrdersPanel;
