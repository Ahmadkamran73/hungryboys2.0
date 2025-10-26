import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, authHeaders } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { handleError } from '../utils/errorHandler';
import * as XLSX from 'xlsx';
import '../styles/OrdersPanel.css';

const STATUSES = ['pending','accepted','preparing','ready','out-for-delivery','delivered','cancelled'];

function StatusBadge({ status }) {
  const color = {
    pending: 'secondary',
    accepted: 'info',
    preparing: 'warning',
    ready: 'primary',
    'out-for-delivery': 'primary',
    delivered: 'success',
    cancelled: 'danger',
  }[status] || 'secondary';
  return <span className={`badge bg-${color} text-uppercase`}>{status || 'pending'}</span>;
}

export default function SuperAdminOrdersPanel() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Filter and sort states
  const [filters, setFilters] = useState({
    searchQuery: '',
    gender: 'all',
    status: '',
    universityId: '',
    campusId: '',
    restaurantName: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
    minAmount: '',
    maxAmount: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchUniversitiesAndCampuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch restaurants when campus filter changes
  useEffect(() => {
    if (filters.campusId) {
      fetchRestaurants(filters.campusId);
    } else {
      setRestaurants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.campusId]);

  const fetchUniversitiesAndCampuses = async () => {
    try {
      const uniResp = await api.get('/api/universities');
      setUniversities(Array.isArray(uniResp.data) ? uniResp.data : []);

      const campusResp = await api.get('/api/campuses');
      setCampuses(Array.isArray(campusResp.data) ? campusResp.data : []);
    } catch (e) {
      console.error('Failed to fetch universities/campuses', e);
    }
  };

  const fetchRestaurants = async (campusId) => {
    try {
      const resp = await api.get('/api/restaurants', { params: { campusId } });
      setRestaurants(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error('Failed to fetch restaurants', e);
    }
  };

  const fetchOrders = async () => {
    if (!user) return setError('Please log in');
    setLoading(true);
    setError('');
    try {
      // For super admin, fetch all orders without campus filter
      const headers = await authHeaders(user);
      // Backend needs a super-admin-specific endpoint or we modify the existing one
      // For now, we'll call the same endpoint; backend should detect superAdmin role and skip campus filter
      const response = await api.get('/api/orders/all', {
        headers,
        params: { limit: 1000 },
      });
      setOrders(response.data || []);
    } catch (e) {
      const handledError = handleError(e, 'SuperAdminOrdersPanel - fetchOrders');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!user) return;
    try {
      await api.patch(`/api/orders/${id}`, { status }, {
        headers: await authHeaders(user),
      });
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (e) {
      const handledError = handleError(e, 'SuperAdminOrdersPanel - updateStatus');
      setError(handledError.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      gender: 'all',
      status: '',
      universityId: '',
      campusId: '',
      restaurantName: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc',
      minAmount: '',
      maxAmount: '',
    });
  };

  // Apply filters and sorting
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter (name, phone, email)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.firstName?.toLowerCase().includes(query) ||
          order.lastName?.toLowerCase().includes(query) ||
          order.phone?.includes(query) ||
          order.email?.toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter((order) => order.gender === filters.gender);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    // University filter
    if (filters.universityId) {
      filtered = filtered.filter((order) => order.universityId === filters.universityId);
    }

    // Campus filter
    if (filters.campusId) {
      filtered = filtered.filter((order) => order.campusId === filters.campusId);
    }

    // Restaurant filter (by name)
    if (filters.restaurantName) {
      const sel = filters.restaurantName.toLowerCase();
      filtered = filtered.filter((order) => {
        // Prefer structured field if present
        if (Array.isArray(order.restaurantNames) && order.restaurantNames.length) {
          return order.restaurantNames.some((n) => String(n).toLowerCase() === sel);
        }
        // Fallback to searching in cartItems free text
        if (order.cartItems) {
          return String(order.cartItems).toLowerCase().includes(sel);
        }
        return false;
      });
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
      filtered = filtered.filter((order) => order.grandTotal >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter((order) => order.grandTotal <= parseFloat(filters.maxAmount));
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = a.grandTotal - b.grandTotal;
          break;
        case 'name':
          comparison = (a.firstName || '').localeCompare(b.firstName || '');
          break;
        case 'gender':
          comparison = (a.gender || '').localeCompare(b.gender || '');
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, filters]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredOrders.length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
      maleOrders: filteredOrders.filter((o) => o.gender === 'male').length,
      femaleOrders: filteredOrders.filter((o) => o.gender === 'female').length,
    };
  }, [filteredOrders]);

  const exportToExcel = () => {
    try {
      const rows = filteredOrders.map((o) => {
        const restaurants = Array.isArray(o.restaurantNames) && o.restaurantNames.length
          ? o.restaurantNames.join(', ')
          : (o.cartItems ? String(o.cartItems).split('\n').filter(line => line.trim().startsWith('📍')).map(line => line.replace('📍', '').trim()).join(', ') : '');
        return {
          OrderID: o._id,
          Date: new Date(o.createdAt).toLocaleString(),
          FirstName: o.firstName || '',
          LastName: o.lastName || '',
          Phone: o.phone || '',
          Email: o.email || '',
          Gender: o.gender || '',
          Persons: o.persons ?? '',
          ItemTotal: Number(o.itemTotal || 0),
          DeliveryCharge: Number(o.deliveryCharge || 0),
          GrandTotal: Number(o.grandTotal || 0),
          Status: o.status || 'pending',
          Restaurants: restaurants,
          Campus: o.campusName || '',
          University: o.universityName || '',
          CartItems: o.cartItems || '',
          SpecialInstruction: o.specialInstruction || '',
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      const filename = `orders_all_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (e) {
      const handledError = handleError(e, 'SuperAdminOrdersPanel - exportToExcel');
      setError(handledError.message);
    }
  };

  const filteredCampuses = useMemo(() => {
    if (!filters.universityId) return campuses;
    return campuses.filter(c => c.universityId === filters.universityId);
  }, [campuses, filters.universityId]);

  return (
    <div className="orders-panel-enhanced">
      <div className="orders-header">
        <h3>📦 All Orders (Super Admin)</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={exportToExcel} disabled={loading || filteredOrders.length === 0}>
            ⬇️ Export (.xlsx)
          </button>
          <button className="btn btn-primary" onClick={fetchOrders} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters Section */}
      <div className="filters-section card p-3 mb-3">
        <h5 className="mb-3">🔍 Filters & Sorting</h5>
        
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Name, Phone, Email..."
            />
          </div>

          {/* University Filter */}
          <div className="col-md-3">
            <label className="form-label">University</label>
            <select
              className="form-select"
              name="universityId"
              value={filters.universityId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, universityId: e.target.value, campusId: '', restaurantName: '' }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Campus Filter */}
          <div className="col-md-3">
            <label className="form-label">Campus</label>
            <select
              className="form-select"
              name="campusId"
              value={filters.campusId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, campusId: e.target.value, restaurantName: '' }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              {filteredCampuses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Restaurant Filter */}
          <div className="col-md-3">
            <label className="form-label">Restaurant</label>
            <select
              className="form-select"
              name="restaurantName"
              value={filters.restaurantName}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="col-md-2">
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sort By */}
          <div className="col-md-2">
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="name">Name</option>
              <option value="gender">Gender</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="col-md-3">
            <label className="form-label">Order</label>
            <select
              className="form-select"
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
            >
              <option value="desc">Descending (Newest First)</option>
              <option value="asc">Ascending (Oldest First)</option>
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
            <label className="form-label">Min Amount (Rs)</label>
            <input
              type="number"
              className="form-control"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Max Amount */}
          <div className="col-md-2">
            <label className="form-label">Max Amount (Rs)</label>
            <input
              type="number"
              className="form-control"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="10000"
              min="0"
            />
          </div>

          {/* Clear Filters */}
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-secondary w-100" onClick={clearFilters}>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="statistics-section card p-3 mb-3">
        <div className="row text-center">
          <div className="col-md-3">
            <h6 className="text-muted">Total Orders</h6>
            <h4>{stats.total}</h4>
          </div>
          <div className="col-md-3">
            <h6 className="text-muted">Total Revenue</h6>
            <h4>{formatCurrency(stats.totalRevenue)}</h4>
          </div>
          <div className="col-md-3">
            <h6 className="text-muted">Male Orders</h6>
            <h4>{stats.maleOrders}</h4>
          </div>
          <div className="col-md-3">
            <h6 className="text-muted">Female Orders</h6>
            <h4>{stats.femaleOrders}</h4>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Loading orders..." />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>University</th>
                  <th>Campus</th>
                  <th>Gender</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      No orders found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <small className="text-muted">#{order._id.slice(-8)}</small>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        {order.firstName} {order.lastName}
                      </td>
                      <td>{order.phone}</td>
                      <td><small>{order.universityName || 'N/A'}</small></td>
                      <td><small>{order.campusName || 'N/A'}</small></td>
                      <td>
                        <span
                          className={`badge ${
                            order.gender === 'male' ? 'bg-primary' : 'bg-danger'
                          }`}
                        >
                          {order.gender}
                        </span>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.grandTotal)}</strong>
                      </td>
                      <td>
                        {/* Super admin can only view status, not update */}
                        <StatusBadge status={order.status} />
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
            <div className="pagination-section d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {indexOfFirstOrder + 1} to{' '}
                {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    // Show only 5 pages at a time
                    if (
                      index + 1 === 1 ||
                      index + 1 === totalPages ||
                      (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1)
                    ) {
                      return (
                        <li
                          key={index + 1}
                          className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                          <button className="page-link" onClick={() => paginate(index + 1)}>
                            {index + 1}
                          </button>
                        </li>
                      );
                    } else if (index + 1 === currentPage - 2 || index + 1 === currentPage + 2) {
                      return (
                        <li key={index + 1} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Order Details</h4>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
            </div>
            <div className="modal-body-custom">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-2">Customer Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedOrder.firstName} {selectedOrder.lastName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedOrder.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedOrder.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Gender:</strong>{' '}
                    <span
                      className={`badge ${
                        selectedOrder.gender === 'male' ? 'bg-primary' : 'bg-danger'
                      }`}
                    >
                      {selectedOrder.gender}
                    </span>
                  </p>
                  {selectedOrder.persons && (
                    <p>
                      <strong>Number of Persons:</strong> {selectedOrder.persons}
                    </p>
                  )}
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-2">Order Information</h6>
                  <p>
                    <strong>Order ID:</strong> #{selectedOrder._id}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                  </p>
                  <p>
                    <strong>University:</strong> {selectedOrder.universityName || 'N/A'}
                  </p>
                  <p>
                    <strong>Campus:</strong> {selectedOrder.campusName || 'N/A'}
                  </p>
                  <p>
                    <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
                  </p>
                </div>
              </div>

              <hr />

              <h6 className="text-muted mb-2">Cart Items</h6>
              {selectedOrder.cartItems ? (
                <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedOrder.cartItems}
                </pre>
              ) : (
                <p className="text-muted">No items found</p>
              )}

              <hr />

              <div className="row">
                <div className="col-md-6 offset-md-6">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>
                          <strong>Items Total:</strong>
                        </td>
                        <td className="text-end">{formatCurrency(selectedOrder.itemTotal || 0)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Delivery Charge:</strong>
                        </td>
                        <td className="text-end">
                          {formatCurrency(selectedOrder.deliveryCharge || 0)}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td>
                          <strong>Grand Total:</strong>
                        </td>
                        <td className="text-end">
                          <strong>{formatCurrency(selectedOrder.grandTotal || 0)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.specialInstruction && (
                <>
                  <hr />
                  <h6 className="text-muted mb-2">Special Instructions</h6>
                  <div className="alert alert-info">
                    {selectedOrder.specialInstruction}
                  </div>
                </>
              )}

              {(selectedOrder.screenshotURL || selectedOrder.paymentProof) && (
                <>
                  <hr />
                  <h6 className="text-muted mb-2">Payment Information</h6>
                  {selectedOrder.accountTitle && (
                    <p>
                      <strong>Account Title:</strong> {selectedOrder.accountTitle}
                    </p>
                  )}
                  {selectedOrder.bankName && (
                    <p>
                      <strong>Bank Name:</strong> {selectedOrder.bankName}
                    </p>
                  )}
                  <p>
                    <strong>Payment Proof:</strong>
                  </p>
                  <img
                    src={selectedOrder.screenshotURL || selectedOrder.paymentProof}
                    alt="Payment Proof"
                    className="img-fluid rounded"
                    style={{ maxHeight: '300px' }}
                  />
                </>
              )}
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
