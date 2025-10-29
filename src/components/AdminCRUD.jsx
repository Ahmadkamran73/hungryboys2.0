import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "../styles/AdminCRUD.css";

const AdminCRUD = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({ name: "", location: "", cuisine: "", id: null });

  const [menuItems, setMenuItems] = useState([]);
  const [menuForm, setMenuForm] = useState({ name: "", price: "", id: null });

  // Domain management state
  const [domains, setDomains] = useState([]);
  const [domainForm, setDomainForm] = useState({ name: "", domain: "", id: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRestaurants = async () => {
    setLoading(true);
    setError("");
    try {
      const querySnapshot = await getDocs(collection(db, "restaurants"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(data);
    } catch (err) {
      setError("Failed to fetch restaurants.");
    }
    setLoading(false);
  };

  const fetchMenuItems = async (restaurantId) => {
    setLoading(true);
    setError("");
    try {
      const querySnapshot = await getDocs(collection(db, "restaurants", restaurantId, "menuItems"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(data);
    } catch (err) {
      setError("Failed to fetch menu items.");
    }
    setLoading(false);
  };

  // Fetch allowed domains
  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const querySnapshot = await getDocs(collection(db, "allowedDomains"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDomains(data);
    } catch (err) {
      setError("Failed to fetch domains.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
    fetchDomains();
  }, []);

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (restaurantForm.id) {
        await updateDoc(doc(db, "restaurants", restaurantForm.id), {
          name: restaurantForm.name,
          location: restaurantForm.location,
          cuisine: restaurantForm.cuisine,
        });
      } else {
        await addDoc(collection(db, "restaurants"), {
          name: restaurantForm.name,
          location: restaurantForm.location,
          cuisine: restaurantForm.cuisine,
        });
      }
      setRestaurantForm({ name: "", location: "", cuisine: "", id: null });
      fetchRestaurants();
    } catch (err) {
      setError("Failed to save restaurant.");
    }
    setLoading(false);
  };

  const handleRestaurantEdit = (restaurant) => {
    setRestaurantForm(restaurant);
    setSelectedRestaurant(restaurant);
    fetchMenuItems(restaurant.id);
    setMenuForm({ name: "", price: "", id: null }); // Clear menu form
  };

  const handleRestaurantDelete = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "restaurants", id));
      setSelectedRestaurant(null);
      setMenuItems([]);
      fetchRestaurants();
    } catch (err) {
      setError("Failed to delete restaurant.");
    }
    setLoading(false);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return alert("Select a restaurant first!");
    setLoading(true);
    try {
      const menuData = {
        name: menuForm.name,
        price: parseFloat(menuForm.price),
      };

      if (menuForm.id) {
        await updateDoc(
          doc(db, "restaurants", selectedRestaurant.id, "menuItems", menuForm.id),
          menuData
        );
      } else {
        await addDoc(collection(db, "restaurants", selectedRestaurant.id, "menuItems"), menuData);
      }

      setMenuForm({ name: "", price: "", id: null });
      fetchMenuItems(selectedRestaurant.id);
    } catch (err) {
      setError("Failed to save menu item.");
    }
    setLoading(false);
  };

  const handleMenuEdit = (menu) => {
    if (!menu.id) {
      console.warn("Menu item missing ID:", menu);
      return;
    }
    setMenuForm({ id: menu.id, name: menu.name, price: menu.price });
  };

  const handleMenuDelete = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "restaurants", selectedRestaurant.id, "menuItems", id));
      fetchMenuItems(selectedRestaurant.id);
    } catch (err) {
      setError("Failed to delete menu item.");
    }
    setLoading(false);
  };

  // Domain management functions
  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const domainData = {
        name: domainForm.name,
        domain: domainForm.domain.startsWith('@') ? domainForm.domain : `@${domainForm.domain}`,
      };

      if (domainForm.id) {
        await updateDoc(doc(db, "allowedDomains", domainForm.id), domainData);
      } else {
        await addDoc(collection(db, "allowedDomains"), domainData);
      }

      setDomainForm({ name: "", domain: "", id: null });
      fetchDomains();
    } catch (err) {
      setError("Failed to save domain.");
    }
    setLoading(false);
  };

  const handleDomainEdit = (domain) => {
    setDomainForm(domain);
  };

  const handleDomainDelete = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "allowedDomains", id));
      fetchDomains();
    } catch (err) {
      setError("Failed to delete domain.");
    }
    setLoading(false);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">🍽️ Admin Dashboard</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="text-center text-primary">Loading...</div>}

      {/* Orders Sheet Card */}
      <div className="card p-4 mb-4 shadow-sm" style={{ backgroundColor: '#343a40', color: 'white' }}>
        <h4>Manage Orders</h4>
        <p>Click below to view and manage all orders in the Google Sheet.</p>
        <a
          href="https://docs.google.com/spreadsheets/d/19XmKUHo3RPAZReFbA4Sfr0G48y1KIFvkFGeVm8xYQpA/edit?usp=sharing"
          className="btn btn-danger w-100"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Orders
        </a>
      </div>

      {/* Domain Management Section */}
      <div className="card p-4 mb-4">
        <h4>🔐 Manage Allowed Email Domains</h4>
        <p className="text-muted">Add or remove university email domains that are allowed for user registration.</p>
        
        <form onSubmit={handleDomainSubmit} className="row g-2 mb-3">
          <div className="col-md-5">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Campus Name (e.g., CFD Campus)" 
              required
              value={domainForm.name}
              onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
            />
          </div>
          <div className="col-md-5">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Domain (e.g., cfd.nu.edu.pk)" 
              required
              value={domainForm.domain}
              onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              {domainForm.id ? "Update" : "Add"}
            </button>
          </div>
        </form>

        <div className="row">
          {domains.map(domain => (
            <div className="col-md-6 mb-2" key={domain.id}>
              <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{domain.name}</h6>
                    <small className="text-muted">{domain.domain}</small>
                  </div>
                  <div>
                    <button 
                      className="btn btn-sm btn-outline-primary me-2" 
                      onClick={() => handleDomainEdit(domain)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => handleDomainDelete(domain.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant Form */}
      <div className="card p-4 mb-4">
        <h4>{restaurantForm.id ? "Edit Restaurant" : "Add New Restaurant"}</h4>
        <form onSubmit={handleRestaurantSubmit} className="row g-2">
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Name" required
              value={restaurantForm.name}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Location" required
              value={restaurantForm.location}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Cuisine" required
              value={restaurantForm.cuisine}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100">Save Restaurant</button>
          </div>
        </form>
      </div>

      {/* Restaurant Cards */}
      <div className="row">
        {restaurants.map(r => (
          <div className="col-md-4 mb-3" key={r.id}>
            <div className="card p-3 shadow-sm h-100">
              <h5>{r.name}</h5>
              <p className="text-muted">{r.location} • {r.cuisine}</p>
              <div>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleRestaurantEdit(r)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleRestaurantDelete(r.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Section */}
      {selectedRestaurant && (
        <>
          <h3 className="mt-5">Menu: {selectedRestaurant.name}</h3>

          {/* Menu Form */}
          <div className="card p-4 mb-4">
            <form onSubmit={handleMenuSubmit} className="row g-2">
              <div className="col-md-6">
                <input type="text" className="form-control" placeholder="Dish Name" required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <input type="number" className="form-control" placeholder="Price" required
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-success w-100">Save Menu Item</button>
              </div>
            </form>
          </div>

          {/* Menu Items List */}
          <div className="row">
            {menuItems.map(item => (
              <div className="col-md-4 mb-3" key={item.id}>
                <div className="card p-3 shadow-sm h-100">
                  <h5>{item.name}</h5>
                  <p>${item.price}</p>
                  <div>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleMenuEdit(item)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleMenuDelete(item.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCRUD;
