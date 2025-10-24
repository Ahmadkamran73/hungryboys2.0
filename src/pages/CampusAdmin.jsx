import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import ConfirmationDialog from "../components/ConfirmationDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import BulkMenuImport from "../components/BulkMenuImport";
import { handleError } from "../utils/errorHandler";
import CampusAdminDashboard from "../components/CampusAdminDashboard";
import "../styles/CampusAdmin.css";

const CampusAdmin = () => {
  const { universityId, campusId } = useParams();
  const { userData } = useAuth();

  // Helper functions for time conversion
  const convertTo24Hour = (time12h) => {
    if (!time12h) return "10:00";
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const convertTo12Hour = (time24h) => {
    if (!time24h) return "10:00 AM";
    const [hours, minutes] = time24h.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    
    return `${hour}:${minutes} ${period}`;
  };
  const [restaurants, setRestaurants] = useState([]);
  const [martItems, setMartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("restaurants");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  // Form states
  const [restaurantForm, setRestaurantForm] = useState({ 
    name: "", 
    location: "", 
    cuisine: "", 
    openTime: "10:00 AM",
    closeTime: "10:00 PM",
    is24x7: true,
    id: null 
  });
  const [menuForm, setMenuForm] = useState({ name: "", price: "", description: "", id: null });
  const [martItemForm, setMartItemForm] = useState({ name: "", price: "", description: "", category: "", stock: "", id: null });

  // Image upload states
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [martImageFile, setMartImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger"
  });

  // Cloudinary configuration
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Image upload function
  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    setUploadingImage(true);
    try {
      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      });

      const data = new FormData();
      data.append("file", compressedFile);
      data.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const cloudData = await res.json();
      return cloudData.secure_url;
    } catch (err) {
      console.error("Image upload error:", err);
      setError("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Confirmation dialog helpers
  const showConfirmationDialog = (title, message, onConfirm, type = "danger") => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
      type: "danger"
    });
  };

  useEffect(() => {
    if (universityId && campusId) {
      fetchData();
    }
  }, [universityId, campusId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch restaurants for this campus
      const restaurantsRef = collection(db, "universities", universityId, "campuses", campusId, "restaurants");
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      const restaurantsData = restaurantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRestaurants(restaurantsData);

      // Fetch mart items for this campus
      const martItemsRef = collection(db, "universities", universityId, "campuses", campusId, "martItems");
      const martItemsSnapshot = await getDocs(martItemsRef);
      const martItemsData = martItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMartItems(martItemsData);
    } catch (err) {
      const handledError = handleError(err, 'CampusAdmin - fetchData');
      setError(handledError.message);
      console.error("Failed to fetch data:", handledError);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId) => {
    try {
      const menuItemsRef = collection(db, "universities", universityId, "campuses", campusId, "restaurants", restaurantId, "menuItems");
      const menuItemsSnapshot = await getDocs(menuItemsRef);
      const menuItemsData = menuItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(menuItemsData);
    } catch (err) {
      const handledError = handleError(err, 'CampusAdmin - fetchMenuItems');
      console.error("Failed to fetch menu items:", handledError);
    }
  };

  // Restaurant management
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const restaurantData = {
        name: restaurantForm.name,
        location: restaurantForm.location,
        cuisine: restaurantForm.cuisine,
        openTime: restaurantForm.openTime || "10:00 AM",
        closeTime: restaurantForm.closeTime || "10:00 PM",
        is24x7: restaurantForm.is24x7 !== undefined ? restaurantForm.is24x7 : true,
      };

      if (restaurantForm.id) {
        await updateDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", restaurantForm.id), restaurantData);
      } else {
        await addDoc(collection(db, "universities", universityId, "campuses", campusId, "restaurants"), restaurantData);
      }

      setRestaurantForm({ 
        name: "", 
        location: "", 
        cuisine: "", 
        openTime: "10:00 AM",
        closeTime: "10:00 PM",
        is24x7: true,
        id: null 
      });
      fetchData();
    } catch (err) {
      const handledError = handleError(err, 'CampusAdmin - saveRestaurant');
      setError(handledError.message);
      console.error("Failed to save restaurant:", handledError);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantEdit = (restaurant) => {
    setRestaurantForm({
      ...restaurant,
      openTime: restaurant.openTime || "10:00 AM",
      closeTime: restaurant.closeTime || "10:00 PM",
      is24x7: restaurant.is24x7 !== undefined ? restaurant.is24x7 : true,
    });
    setSelectedRestaurant(restaurant);
    fetchMenuItems(restaurant.id);
  };

  const handleRestaurantDelete = async (id) => {
    const restaurant = restaurants.find(r => r.id === id);
    showConfirmationDialog(
      "Delete Restaurant",
      `Are you sure you want to delete "${restaurant?.name}" restaurant? This will also delete all its menu items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", id));
          fetchData();
        } catch (err) {
          setError("Failed to delete restaurant");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Menu item management
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return alert("Select a restaurant first!");
    setLoading(true);
    try {
      // Upload image if selected
      let photoURL = null;
      if (menuImageFile) {
        photoURL = await handleImageUpload(menuImageFile);
        if (!photoURL) {
          setLoading(false);
          return;
        }
      }

      const menuData = {
        name: menuForm.name,
        price: parseFloat(menuForm.price),
        description: menuForm.description,
        ...(photoURL && { photoURL }),
      };

      if (menuForm.id) {
        await updateDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", selectedRestaurant.id, "menuItems", menuForm.id), menuData);
      } else {
        await addDoc(collection(db, "universities", universityId, "campuses", campusId, "restaurants", selectedRestaurant.id, "menuItems"), menuData);
      }

      setMenuForm({ name: "", price: "", description: "", id: null });
      setMenuImageFile(null);
      fetchMenuItems(selectedRestaurant.id);
    } catch (err) {
      const handledError = handleError(err, 'CampusAdmin - saveMenuItem');
      setError(handledError.message);
      console.error("Failed to save menu item:", handledError);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuEdit = (menu) => {
    setMenuForm(menu);
    setMenuImageFile(null); // Clear any selected image when editing
  };

  const handleMenuDelete = async (id) => {
    const menuItem = menuItems.find(m => m.id === id);
    showConfirmationDialog(
      "Delete Menu Item",
      `Are you sure you want to delete "${menuItem?.name}" from the menu? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", selectedRestaurant.id, "menuItems", id));
          fetchMenuItems(selectedRestaurant.id);
        } catch (err) {
          setError("Failed to delete menu item");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Bulk delete functions for CampusAdmin
  const handleBulkDeleteMenuItems = async () => {
    if (!selectedRestaurant) return;
    
    showConfirmationDialog(
      "Delete All Menu Items",
      `Are you sure you want to delete ALL ${menuItems.length} menu items from "${selectedRestaurant.name}"? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const deletePromises = menuItems.map(item =>
            deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", selectedRestaurant.id, "menuItems", item.id))
          );

          await Promise.all(deletePromises);
          fetchMenuItems(selectedRestaurant.id);
        } catch (err) {
          setError("Failed to delete menu items");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  const handleBulkDeleteRestaurants = async () => {
    showConfirmationDialog(
      "Delete All Restaurants",
      `Are you sure you want to delete ALL ${restaurants.length} restaurants from this campus? This will also delete all their menu items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const deletePromises = restaurants.map(restaurant =>
            deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "restaurants", restaurant.id))
          );

          await Promise.all(deletePromises);
          fetchData();
        } catch (err) {
          setError("Failed to delete restaurants");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  const handleBulkDeleteMartItems = async () => {
    showConfirmationDialog(
      "Delete All Mart Items",
      `Are you sure you want to delete ALL ${martItems.length} mart items from this campus? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const deletePromises = martItems.map(item =>
            deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "martItems", item.id))
          );

          await Promise.all(deletePromises);
          fetchData();
        } catch (err) {
          setError("Failed to delete mart items");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Mart item management
  const handleMartItemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload image if selected
      let photoURL = null;
      if (martImageFile) {
        photoURL = await handleImageUpload(martImageFile);
        if (!photoURL) {
          setLoading(false);
          return;
        }
      }

      const martItemData = {
        name: martItemForm.name,
        price: parseFloat(martItemForm.price),
        description: martItemForm.description,
        category: martItemForm.category,
        stock: parseInt(martItemForm.stock),
        ...(photoURL && { photoURL }),
      };

      if (martItemForm.id) {
        await updateDoc(doc(db, "universities", universityId, "campuses", campusId, "martItems", martItemForm.id), martItemData);
      } else {
        await addDoc(collection(db, "universities", universityId, "campuses", campusId, "martItems"), martItemData);
      }

      setMartItemForm({ name: "", price: "", description: "", category: "", stock: "", id: null });
      setMartImageFile(null);
      fetchData();
    } catch (err) {
      const handledError = handleError(err, 'CampusAdmin - saveMartItem');
      setError(handledError.message);
      console.error("Failed to save mart item:", handledError);
    } finally {
      setLoading(false);
    }
  };

  const handleMartItemEdit = (item) => {
    setMartItemForm(item);
    setMartImageFile(null); // Clear any selected image when editing
  };

  const handleMartItemDelete = async (id) => {
    const martItem = martItems.find(m => m.id === id);
    showConfirmationDialog(
      "Delete Mart Item",
      `Are you sure you want to delete "${martItem?.name}" from the mart? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "universities", universityId, "campuses", campusId, "martItems", id));
          fetchData();
        } catch (err) {
          setError("Failed to delete mart item");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  if (loading) {
    return (
      <div className="campus-admin-page">
        <LoadingSpinner message="Loading Dashboard..." />
      </div>
    );
  }

  return (
    <div className="campus-admin-page">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">🏫 Campus Admin Dashboard</h1>
            <p className="text-center text-muted mb-4">
              Welcome, {userData?.firstName} {userData?.lastName} ({userData?.email})
            </p>
            <p className="text-center text-muted mb-4">
              Managing: {userData?.universityName} - {userData?.campusName}
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "restaurants" ? "active" : ""}`}
                  onClick={() => setActiveTab("restaurants")}
                >
                  Restaurants
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "martItems" ? "active" : ""}`}
                  onClick={() => setActiveTab("martItems")}
                >
                  Mart Items
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  📊 Order Dashboard
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Restaurants Tab */}
              {activeTab === "restaurants" && (
                <div className="tab-pane fade show active">
                  <h3>Restaurant Management</h3>
                  
                  {/* Restaurant Form */}
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5>{restaurantForm.id ? "Edit Restaurant" : "Add New Restaurant"}</h5>
                      <form onSubmit={handleRestaurantSubmit} className="row g-2">
                        <div className="col-md-4">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Restaurant Name" 
                            required
                            value={restaurantForm.name}
                            onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Location" 
                            required
                            value={restaurantForm.location}
                            onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Cuisine" 
                            required
                            value={restaurantForm.cuisine}
                            onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
                          />
                        </div>
                        
                        {/* Restaurant Timing Fields */}
                        <div className="col-md-3">
                          <label className="form-label">Opening Time</label>
                          <input
                            type="time"
                            className="form-control"
                            value={convertTo24Hour(restaurantForm.openTime || "10:00 AM")}
                            onChange={(e) => setRestaurantForm({...restaurantForm, openTime: convertTo12Hour(e.target.value)})}
                            disabled={restaurantForm.is24x7}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Closing Time</label>
                          <input
                            type="time"
                            className="form-control"
                            value={convertTo24Hour(restaurantForm.closeTime || "10:00 PM")}
                            onChange={(e) => setRestaurantForm({...restaurantForm, closeTime: convertTo12Hour(e.target.value)})}
                            disabled={restaurantForm.is24x7}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Operating Hours</label>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is24x7-campus"
                              checked={restaurantForm.is24x7 !== undefined ? restaurantForm.is24x7 : true}
                              onChange={(e) => setRestaurantForm({...restaurantForm, is24x7: e.target.checked})}
                            />
                            <label className="form-check-label" htmlFor="is24x7-campus">
                              24/7 Open
                            </label>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <button type="submit" className="btn btn-primary">
                            {restaurantForm.id ? "Update Restaurant" : "Add Restaurant"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Restaurants List */}
                  <div className="row">
                    {restaurants.map(restaurant => (
                                              <div key={restaurant.id} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title">{restaurant.name}</h5>
                            <p className="card-text text-muted">
                              {restaurant.location} • {restaurant.cuisine}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <button 
                                className="btn btn-sm btn-outline-primary me-2" 
                                onClick={() => handleRestaurantEdit(restaurant)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleRestaurantDelete(restaurant.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bulk Actions for Restaurants */}
                  {restaurants.length > 0 && (
                    <div className="mb-4">
                      <button 
                        className="btn btn-warning"
                        onClick={handleBulkDeleteRestaurants}
                        title="Delete all restaurants from this campus"
                      >
                        <i className="fas fa-trash-alt me-1"></i>
                        Clear All Restaurants ({restaurants.length})
                      </button>
                    </div>
                  )}

                  {/* Menu Items Section */}
                  {selectedRestaurant && (
                    <div className="mt-5">
                      <h4>Menu Items: {selectedRestaurant.name}</h4>
                      
                      {/* Menu Form */}
                      <div className="card mb-4">
                        <div className="card-body">
                          <h6>{menuForm.id ? "Edit Menu Item" : "Add Menu Item"}</h6>
                          <form onSubmit={handleMenuSubmit} className="row g-2">
                            <div className="col-md-3">
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Item Name" 
                                required
                                value={menuForm.name}
                                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                              />
                            </div>
                            <div className="col-md-2">
                              <input 
                                type="number" 
                                className="form-control" 
                                placeholder="Price" 
                                required
                                value={menuForm.price}
                                onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                              />
                            </div>
                            <div className="col-md-3">
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Description" 
                                value={menuForm.description}
                                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                              />
                            </div>
                            <div className="col-md-3">
                              <input 
                                type="file" 
                                className="form-control" 
                                accept="image/*"
                                onChange={(e) => setMenuImageFile(e.target.files[0])}
                              />
                            </div>
                            <div className="col-md-1">
                              <button type="submit" className="btn btn-success w-100" disabled={uploadingImage}>
                                {uploadingImage ? "..." : (menuForm.id ? "Update" : "Add")}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* Bulk Actions for Menu Items */}
                      {menuItems.length > 0 && (
                        <div className="mb-4">
                          <button 
                            className="btn btn-warning"
                            onClick={handleBulkDeleteMenuItems}
                            title="Delete all menu items from this restaurant"
                          >
                            <i className="fas fa-trash-alt me-1"></i>
                            Clear All Menu Items ({menuItems.length})
                          </button>
                        </div>
                      )}

                      {/* Menu Items List */}
                      <div className="row">
                        {menuItems.map(item => (
                          <div key={item.id} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div className="card">
                              {item.photoURL && (
                                <img 
                                  src={item.photoURL} 
                                  className="card-img-top" 
                                  alt={item.name}
                                  style={{ height: "200px", objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="card-body">
                                <h6 className="card-title">{item.name}</h6>
                                <p className="card-text">₹{item.price}</p>
                                {item.description && (
                                  <p className="card-text text-muted small">{item.description}</p>
                                )}
                                <div className="d-flex justify-content-between">
                                  <button 
                                    className="btn btn-sm btn-outline-primary" 
                                    onClick={() => handleMenuEdit(item)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger" 
                                    onClick={() => handleMenuDelete(item.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bulk Import */}
                      <BulkMenuImport
                        universityId={universityId}
                        campusId={campusId}
                        restaurantId={selectedRestaurant.id}
                        restaurants={restaurants}
                        onComplete={() => fetchMenuItems(selectedRestaurant.id)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mart Items Tab */}
              {activeTab === "martItems" && (
                <div className="tab-pane fade show active">
                  <h3>Mart Items Management</h3>
                  
                  {/* Mart Item Form */}
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5>{martItemForm.id ? "Edit Mart Item" : "Add New Mart Item"}</h5>
                      <form onSubmit={handleMartItemSubmit} className="row g-2">
                        <div className="col-md-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Item Name" 
                            required
                            value={martItemForm.name}
                            onChange={(e) => setMartItemForm({ ...martItemForm, name: e.target.value })}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="Price" 
                            required
                            value={martItemForm.price}
                            onChange={(e) => setMartItemForm({ ...martItemForm, price: e.target.value })}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Category" 
                            required
                            value={martItemForm.category}
                            onChange={(e) => setMartItemForm({ ...martItemForm, category: e.target.value })}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="Stock" 
                            required
                            value={martItemForm.stock}
                            onChange={(e) => setMartItemForm({ ...martItemForm, stock: e.target.value })}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Description" 
                            value={martItemForm.description}
                            onChange={(e) => setMartItemForm({ ...martItemForm, description: e.target.value })}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="file" 
                            className="form-control" 
                            accept="image/*"
                            onChange={(e) => setMartImageFile(e.target.files[0])}
                          />
                        </div>
                        <div className="col-12">
                          <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                            {uploadingImage ? "Uploading..." : (martItemForm.id ? "Update Mart Item" : "Add Mart Item")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Bulk Actions for Mart Items */}
                  {martItems.length > 0 && (
                    <div className="mb-4">
                      <button 
                        className="btn btn-warning"
                        onClick={handleBulkDeleteMartItems}
                        title="Delete all mart items from this campus"
                      >
                        <i className="fas fa-trash-alt me-1"></i>
                        Clear All Mart Items ({martItems.length})
                      </button>
                    </div>
                  )}

                  {/* Mart Items List */}
                  <div className="row">
                    {martItems.map(item => (
                                              <div key={item.id} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                        <div className="card h-100">
                          {item.photoURL && (
                            <img 
                              src={item.photoURL} 
                              className="card-img-top" 
                              alt={item.name}
                              style={{ height: "200px", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="card-body">
                            <h5 className="card-title">{item.name}</h5>
                            <p className="card-text">₹{item.price}</p>
                            <p className="card-text text-muted">
                              Category: {item.category}
                            </p>
                            <p className="card-text text-muted">
                              Stock: {item.stock}
                            </p>
                            {item.description && (
                              <p className="card-text text-muted small">{item.description}</p>
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                              <button 
                                className="btn btn-sm btn-outline-primary me-2" 
                                onClick={() => handleMartItemEdit(item)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleMartItemDelete(item.id)}
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
              )}

              {/* Order Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="tab-pane fade show active">
                  <CampusAdminDashboard />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={closeConfirmationDialog}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        type={confirmationDialog.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CampusAdmin; 