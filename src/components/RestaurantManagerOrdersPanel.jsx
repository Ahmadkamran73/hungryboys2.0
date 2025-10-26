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
      'Gender': o.gender,
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
    <div className="orders-panel-container">
      <div className="orders-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h3>📦 Orders for {restaurantName}</h3>
          <p className="text-muted mb-0">Manage orders for your restaurant</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={fetchOrders}>
            🔄 Refresh
          </button>
          <button className="btn btn-success" onClick={exportToExcel}>
            📊 Export to Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6>Total Orders</h6>
              <h3>{totalOrders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6>Total Revenue</h6>
              <h3>{formatCurrency(totalRevenue)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6>Male Orders</h6>
              <h3>{maleOrders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h6>Female Orders</h6>
              <h3>{femaleOrders}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section mb-4">
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              name="searchQuery"
              placeholder="Name, Phone, Order ID..."
              value={filters.searchQuery}
              onChange={handleFilterChange}
            />
          </div>

          {/* Gender Filter */}
          <div className="col-md-2">
            <label className="form-label">Gender</label>
            <select className="form-select" name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div className="col-md-2">
            <label className="form-label">Date From</label>
            <input
              type="date"
              className="form-control"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>

          {/* Date To */}
          <div className="col-md-2">
            <label className="form-label">Date To</label>
            <input
              type="date"
              className="form-control"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>

          {/* Min Amount */}
          <div className="col-md-2">
            <label className="form-label">Min Amount</label>
            <input
              type="number"
              className="form-control"
              name="minAmount"
              placeholder="0"
              value={filters.minAmount}
              onChange={handleFilterChange}
            />
          </div>

          {/* Max Amount */}
          <div className="col-md-2">
            <label className="form-label">Max Amount</label>
            <input
              type="number"
              className="form-control"
              name="maxAmount"
              placeholder="9999"
              value={filters.maxAmount}
              onChange={handleFilterChange}
            />
          </div>

          {/* Sort By */}
          <div className="col-md-2">
            <label className="form-label">Sort By</label>
            <select className="form-select" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">Date</option>
              <option value="grandTotal">Amount</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="col-md-2">
            <label className="form-label">Order</label>
            <select className="form-select" name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-secondary w-100" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="table table-hover table-striped">
          <thead className="table-dark">
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No orders found
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order._id}>
                  <td><small>{order._id}</small></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.customerName}</td>
                  <td>{order.phone}</td>
                  <td>
                    <span className={`badge ${order.gender === 'male' ? 'bg-primary' : 'bg-danger'}`}>
                      {order.gender}
                    </span>
                  </td>
                  <td>
                    <strong>{formatCurrency(order.itemsTotal || 0)}</strong>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
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
        <div className="pagination-section d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                  Previous
                </button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => paginate(index + 1)}>
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header">
                <h5 className="modal-title">Order Details - {selectedOrder._id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedOrder(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Customer:</strong> {selectedOrder.customerName}<br />
                    <strong>Phone:</strong> {selectedOrder.phone}<br />
                    <strong>Gender:</strong> {selectedOrder.gender}<br />
                    <strong>Campus:</strong> {selectedOrder.campusName}<br />
                  </div>
                  <div className="col-md-6">
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}<br />
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Cart Items:</strong>
                  <pre className="bg-dark text-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {formatCartItems(selectedOrder.cartItems)}
                  </pre>
                </div>
                <div className="mb-3">
                  <div className="p-3 bg-primary text-white rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong style={{ fontSize: '1.1rem' }}>Restaurant Items Total:</strong>
                      <strong style={{ fontSize: '1.3rem' }}>{formatCurrency(selectedOrder.itemsTotal || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantManagerOrdersPanel;
