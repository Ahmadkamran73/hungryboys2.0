import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import ConfirmationDialog from "../components/ConfirmationDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
// import SuperAdminDashboard from "../components/SuperAdminDashboard"; // Removed: Google Sheets dashboard
import CampusSettingsManager from "../components/CampusSettingsManager";
import BulkMenuImport from "../components/BulkMenuImport";
import SuperAdminOrdersPanel from "../components/SuperAdminOrdersPanel";
const SuperAdminCRM = React.lazy(() => import("../components/SuperAdminCRM"));
import { api, authHeaders } from "../utils/api";
import "../styles/SuperAdmin.css";

const SuperAdmin = () => {
  const { user, userData } = useAuth();

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
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allMartItems, setAllMartItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [universityForm, setUniversityForm] = useState({ name: "", id: null });
  const [campusForm, setCampusForm] = useState({ name: "", universityId: "", id: null });
  const [restaurantForm, setRestaurantForm] = useState({ 
    name: "", 
    location: "", 
    cuisine: "", 
    universityId: "", 
    campusId: "", 
    openTime: "10:00 AM",
    closeTime: "10:00 PM",
    is24x7: true,
    photoURL: "",
    imageFile: null,
    id: null 
  });
  const [menuForm, setMenuForm] = useState({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", photoURL: "", imageFile: null, id: null });
  const [martItemForm, setMartItemForm] = useState({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", imageUrl: "", imageFile: null, id: null });
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "campusAdmin", universityId: "", campusId: "", restaurantId: "", id: null });
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // Filtering states
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterCampus, setFilterCampus] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("");
  const [searchUser, setSearchUser] = useState("");
  
  // User list collapse state
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  // Orders dropdown state
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger"
  });

  useEffect(() => {
    if (userData && userData.role === "superAdmin") {
      fetchAllData();
    } else {
      setError("Access denied. Super Admin privileges required.");
      setLoading(false);
    }
  }, [userData]);

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

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    
    // Add timeout mechanism
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });
    
    const fetchDataPromise = async () => {
      try {
        // Fetch universities
        const universitiesResponse = await api.get('/api/universities');
        const universitiesData = universitiesResponse.data;
        setUniversities(universitiesData);

        // Fetch all campuses
        const campusesResponse = await api.get('/api/campuses');
        const allCampuses = campusesResponse.data.map(campus => {
          const university = universitiesData.find(u => u.id === campus.universityId);
          return {
            ...campus,
            universityName: university?.name || ''
          };
        });
        setCampuses(allCampuses);

        // Fetch users from Firestore (still using Firestore for users)
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Fetch all restaurants
        const restaurantsResponse = await api.get('/api/restaurants');
        const allRestaurantsData = restaurantsResponse.data.map(restaurant => {
          const campus = allCampuses.find(c => c.id === restaurant.campusId);
          return {
            ...restaurant,
            campusName: campus?.name || '',
            universityName: campus?.universityName || ''
          };
        });
        setAllRestaurants(allRestaurantsData);

        // Fetch all menu items
        const menuItemsResponse = await api.get('/api/menu-items');
        const allMenuItemsData = menuItemsResponse.data.map(menuItem => {
          const restaurant = allRestaurantsData.find(r => r.id === menuItem.restaurantId);
          return {
            ...menuItem,
            restaurantName: restaurant?.name || '',
            campusId: restaurant?.campusId || '',
            campusName: restaurant?.campusName || '',
            universityId: restaurant?.universityId || '',
            universityName: restaurant?.universityName || ''
          };
        });
        setAllMenuItems(allMenuItemsData);

        // Fetch all mart items
        const martItemsResponse = await api.get('/api/mart-items');
        const allMartItemsData = martItemsResponse.data.map(martItem => {
          const campus = allCampuses.find(c => c.id === martItem.campusId);
          return {
            ...martItem,
            campusName: campus?.name || '',
            universityName: campus?.universityName || ''
          };
        });
        setAllMartItems(allMartItemsData);

    } catch (err) {
        const handledError = handleError(err, 'SuperAdmin - fetchAllData');
        setError(handledError.message);
      }
    };

    try {
      await Promise.race([fetchDataPromise(), timeoutPromise]);
    } catch (err) {
      const handledError = handleError(err, 'SuperAdmin - fetchAllData (timeout)');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  // University management
  const handleUniversitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      const headers = await authHeaders(user);
      if (universityForm.id) {
        await api.patch(`/api/universities/${universityForm.id}`, {
          name: universityForm.name,
        }, { headers });
      } else {
        await api.post('/api/universities', {
          name: universityForm.name,
        }, { headers });
      }
      setUniversityForm({ name: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save university: " + (err.response?.data?.error || err.message));
      console.error("Error saving university:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversityEdit = (university) => {
    setUniversityForm(university);
  };

  const handleUniversityDelete = async (id) => {
    const university = universities.find(u => u.id === id);
    showConfirmationDialog(
      "Delete University",
      `Are you sure you want to delete "${university?.name}"? This will also delete all its campuses, restaurants, menu items, and mart items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          await api.delete(`/api/universities/${id}`, { headers });
          fetchAllData();
        } catch (err) {
          setError("Failed to delete university");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // Campus management
  const handleCampusSubmit = async (e) => {
    e.preventDefault();
    if (!campusForm.universityId) {
      setError("Please select a university");
      return;
    }
    setLoading(true);
    try {
      const university = universities.find(u => u.id === campusForm.universityId);
      const headers = await authHeaders(user);
      
      if (campusForm.id) {
        // Update existing campus
        await api.patch(`/api/campuses/${campusForm.id}`, {
          name: campusForm.name,
        }, { headers });
      } else {
        // Create new campus
        await api.post('/api/campuses', {
          name: campusForm.name,
          universityId: campusForm.universityId,
        }, { headers });
      }
      setCampusForm({ name: "", universityId: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save campus");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCampusEdit = (campus) => {
    setCampusForm(campus);
  };

  const handleCampusDelete = async (campus) => {
    showConfirmationDialog(
      "Delete Campus",
      `Are you sure you want to delete "${campus.name}" campus? This will also delete all its restaurants, menu items, and mart items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          // Delete from MongoDB
          await api.delete(`/api/campuses/${campus.id}`, { headers });
          
          fetchAllData();
        } catch (err) {
          setError("Failed to delete campus");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  // User management
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      fetchAllData();
    } catch (err) {
      setError("Failed to update user role");
      console.error(err);
    }
  };

  const handleUserEdit = (user) => {
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Populate the form with user data
    setUserForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "", // Don't populate password for security
      role: user.role || "user",
      universityId: user.universityId || "",
      campusId: user.campusId || "",
      restaurantId: user.restaurantId || "",
      id: user.id
    });
    
    // Switch to users tab if not already there
    setActiveTab("users");
  };

  const handleUserDelete = async (userId) => {
    const user = users.find(u => u.id === userId);
    
    // Prevent super admin from deleting their own profile
    if (user?.role === "superAdmin" && user.id === userData?.uid) {
      setError("You cannot delete your own profile.");
      return;
    }
    
    showConfirmationDialog(
      "Delete User",
      `Are you sure you want to delete user "${user?.firstName} ${user?.lastName}" (${user?.email})? This action cannot be undone.`,
      async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          fetchAllData();
        } catch (err) {
          setError("Failed to delete user");
          console.error(err);
        }
      },
      "danger"
    );
  };

  // User creation/update
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.universityId || !userForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    if (userForm.role === 'restaurantManager' && !userForm.restaurantId) {
      setError("Please select a restaurant for restaurant manager");
      return;
    }
    
    // If editing (has id), check if password is required
    if (!userForm.id && !userForm.password) {
      setError("Password is required for new users");
      return;
    }
    
    setLoading(true);
    try {
      const userData = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role,
        universityId: userForm.universityId,
        campusId: userForm.campusId,
        universityName: universities.find(u => u.id === userForm.universityId)?.name,
        campusName: campuses.find(c => c.id === userForm.campusId)?.name,
      };
      
      // Add password only for new users or if provided for update
      if (!userForm.id || userForm.password) {
        userData.password = userForm.password;
      }
      
      // Add restaurant data for restaurant managers
      if (userForm.role === 'restaurantManager') {
        userData.restaurantId = userForm.restaurantId;
        userData.restaurantName = allRestaurants.find(r => r.id === userForm.restaurantId)?.name;
      } else {
        // Remove restaurant data if role changed from restaurant manager
        userData.restaurantId = null;
        userData.restaurantName = null;
      }
      
      const headers = await authHeaders(user);
      
      if (userForm.id) {
        // Update existing user in Firestore
        const userRef = doc(db, "users", userForm.id);
        await updateDoc(userRef, userData);
        alert("User updated successfully!");
      } else {
        // Create new user via backend API
        await api.post('/api/users', userData, { headers });
        alert("User created successfully! The user can now sign in with the provided email and password.");
      }
      
      setUserForm({ firstName: "", lastName: "", email: "", password: "", role: "campusAdmin", universityId: "", campusId: "", restaurantId: "", id: null });
      fetchAllData();
    } catch (err) {
      setError(`Failed to ${userForm.id ? 'update' : 'create'} user: ` + (err.response?.data?.error || err.message || err.code));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Image upload helper function
  const uploadImage = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    try {
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Restaurant management (now supports image upload via Cloudinary)
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantForm.universityId || !restaurantForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    setLoading(true);
    try {
      const headers = await authHeaders(user);
      // Upload image if selected
      let photoURL = restaurantForm.photoURL || null;
      if (restaurantForm.imageFile) {
        console.log('🖼️ Uploading restaurant image to Cloudinary...');
        try {
          photoURL = await uploadImage(restaurantForm.imageFile);
          console.log('✅ Image uploaded successfully:', photoURL);
        } catch (uploadErr) {
          console.error('❌ Image upload failed:', uploadErr);
          setError(`Image upload failed: ${uploadErr.message || 'Unknown error'}`);
          // Continue without image rather than failing the whole save
        }
      }

      const restaurantData = {
        name: restaurantForm.name,
        location: restaurantForm.location,
        cuisine: restaurantForm.cuisine,
        openTime: restaurantForm.openTime || "10:00 AM",
        closeTime: restaurantForm.closeTime || "10:00 PM",
        is24x7: restaurantForm.is24x7 !== undefined ? restaurantForm.is24x7 : true,
        photoURL: photoURL // Always include photoURL field (can be null)
      };

      console.log('💾 Saving restaurant with data:', restaurantData);

      if (restaurantForm.id) {
        const response = await api.patch(`/api/restaurants/${restaurantForm.id}`, restaurantData, { headers });
        console.log('✅ Restaurant updated:', response.data);
      } else {
        const response = await api.post('/api/restaurants', {
          campusId: restaurantForm.campusId,
          universityId: restaurantForm.universityId,
          ...restaurantData
        }, { headers });
        console.log('✅ Restaurant created:', response.data);
      }
      
      setRestaurantForm({ 
        name: "", 
        location: "", 
        cuisine: "", 
        universityId: "", 
        campusId: "", 
        openTime: "10:00 AM",
        closeTime: "10:00 PM",
        is24x7: true,
        photoURL: "",
        imageFile: null,
        id: null 
      });
      fetchAllData();
    } catch (err) {
      setError("Failed to save restaurant: " + (err.response?.data?.error || err.message));
      console.error('❌ Restaurant save failed:', err);
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
      photoURL: restaurant.photoURL || "",
      imageFile: null,
    });
  };

  const handleRestaurantDelete = async (restaurant) => {
    showConfirmationDialog(
      "Delete Restaurant",
      `Are you sure you want to delete "${restaurant.name}" restaurant? This will also delete all its menu items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          await api.delete(`/api/restaurants/${restaurant.id}`, { headers });
          fetchAllData();
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
    if (!menuForm.universityId || !menuForm.campusId || !menuForm.restaurantId) {
      setError("Please select university, campus, and restaurant");
      return;
    }
    setLoading(true);
    try {
      const headers = await authHeaders(user);
      let photoURL = menuForm.photoURL;
      if (menuForm.imageFile) {
        try { photoURL = await uploadImage(menuForm.imageFile); } catch (_) {}
      }
      if (menuForm.id) {
        await api.patch(`/api/menu-items/${menuForm.id}`, {
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          ...(photoURL && { photoURL }),
        }, { headers });
      } else {
        await api.post('/api/menu-items', {
          restaurantId: menuForm.restaurantId,
          campusId: menuForm.campusId,
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          ...(photoURL && { photoURL }),
        }, { headers });
      }
      setMenuForm({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", photoURL: "", imageFile: null, id: null });
      fetchAllData();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Unknown error';
      setError("Failed to save menu item: " + msg);
      console.error('Menu save failed', err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuEdit = (menu) => {
    setMenuForm({ ...menu, imageFile: null });
  };

  const handleMenuDelete = async (menu) => {
    showConfirmationDialog(
      "Delete Menu Item",
      `Are you sure you want to delete "${menu.name}" from the menu? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          await api.delete(`/api/menu-items/${menu.id}`, { headers });
          fetchAllData();
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

  // Bulk delete functions
  const handleBulkDeleteMenuItems = async (restaurant) => {
    const menuItemsCount = allMenuItems.filter(item => 
      item.universityId === restaurant.universityId && 
      item.campusId === restaurant.campusId && 
      item.restaurantId === restaurant.id
    ).length;

    showConfirmationDialog(
      "Delete All Menu Items",
      `Are you sure you want to delete ALL ${menuItemsCount} menu items from "${restaurant.name}"? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          const menuItemsToDelete = allMenuItems.filter(item => 
            item.universityId === restaurant.universityId && 
            item.campusId === restaurant.campusId && 
            item.restaurantId === restaurant.id
          );

          const deletePromises = menuItemsToDelete.map(item =>
            api.delete(`/api/menu-items/${item.id}`, { headers })
          );

          await Promise.all(deletePromises);
          fetchAllData();
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

  const handleBulkDeleteUsers = async (campus) => {
    const usersToDelete = users.filter(user => 
      user.universityId === campus.universityId && 
      user.campusId === campus.id &&
      !(user.role === "superAdmin" && user.id === userData?.uid) // Exclude super admin's own profile
    );
    
    const usersCount = usersToDelete.length;

    if (usersCount === 0) {
      setError("No users available to delete from this campus.");
      return;
    }

    showConfirmationDialog(
      "Delete All Campus Users",
      `Are you sure you want to delete ALL ${usersCount} users from "${campus.name}" campus? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const deletePromises = usersToDelete.map(user =>
            deleteDoc(doc(db, "users", user.id))
          );

          await Promise.all(deletePromises);
          fetchAllData();
        } catch (err) {
          setError("Failed to delete users");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  const handleBulkDeleteRestaurants = async (campus) => {
    const restaurantsCount = allRestaurants.filter(restaurant => 
      restaurant.universityId === campus.universityId && 
      restaurant.campusId === campus.id
    ).length;

    showConfirmationDialog(
      "Delete All Campus Restaurants",
      `Are you sure you want to delete ALL ${restaurantsCount} restaurants from "${campus.name}" campus? This will also delete all their menu items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          const restaurantsToDelete = allRestaurants.filter(restaurant => 
            restaurant.universityId === campus.universityId && 
            restaurant.campusId === campus.id
          );

          const deletePromises = restaurantsToDelete.map(restaurant =>
            api.delete(`/api/restaurants/${restaurant.id}`, { headers })
          );

          await Promise.all(deletePromises);
          fetchAllData();
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

  const handleBulkDeleteMartItems = async (campus) => {
    const martItemsCount = allMartItems.filter(item => 
      item.universityId === campus.universityId && 
      item.campusId === campus.id
    ).length;

    showConfirmationDialog(
      "Delete All Campus Mart Items",
      `Are you sure you want to delete ALL ${martItemsCount} mart items from "${campus.name}" campus? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          const martItemsToDelete = allMartItems.filter(item => 
            item.universityId === campus.universityId && 
            item.campusId === campus.id
          );

          const deletePromises = martItemsToDelete.map(item =>
            api.delete(`/api/mart-items/${item.id}`, { headers })
          );

          await Promise.all(deletePromises);
          fetchAllData();
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

  // Mart item management (use photoURL like Campus Admin)
  const handleMartItemSubmit = async (e) => {
    e.preventDefault();
    if (!martItemForm.universityId || !martItemForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    setLoading(true);
    try {
      const headers = await authHeaders(user);
      
      // Upload image if a new file is selected
      let photoURL = null;
      if (martItemForm.imageFile) {
        photoURL = await uploadImage(martItemForm.imageFile);
      }
      
      if (martItemForm.id) {
        await api.patch(`/api/mart-items/${martItemForm.id}`, {
          name: martItemForm.name,
          price: parseFloat(martItemForm.price),
          description: martItemForm.description,
          category: martItemForm.category,
          stock: parseInt(martItemForm.stock),
          ...(photoURL && { photoURL }),
        }, { headers });
      } else {
        await api.post('/api/mart-items', {
          campusId: martItemForm.campusId,
          name: martItemForm.name,
          price: parseFloat(martItemForm.price),
          description: martItemForm.description,
          category: martItemForm.category,
          stock: parseInt(martItemForm.stock),
          ...(photoURL && { photoURL }),
        }, { headers });
      }
      setMartItemForm({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", imageUrl: "", imageFile: null, id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save mart item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMartItemEdit = (item) => {
    setMartItemForm(item);
  };

  const handleMartItemDelete = async (item) => {
    showConfirmationDialog(
      "Delete Mart Item",
      `Are you sure you want to delete "${item.name}" from the mart? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const headers = await authHeaders(user);
          await api.delete(`/api/mart-items/${item.id}`, { headers });
          fetchAllData();
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

  // Filtering functions
  const getFilteredRestaurants = () => {
    let filtered = allRestaurants;
    if (filterUniversity) {
      filtered = filtered.filter(r => r.universityId === filterUniversity);
    }
    if (filterCampus) {
      filtered = filtered.filter(r => r.campusId === filterCampus);
    }
    return filtered;
  };

  const getFilteredMenuItems = () => {
    let filtered = allMenuItems;
    if (filterUniversity) {
      filtered = filtered.filter(m => m.universityId === filterUniversity);
    }
    if (filterCampus) {
      filtered = filtered.filter(m => m.campusId === filterCampus);
    }
    if (filterRestaurant) {
      filtered = filtered.filter(m => m.restaurantId === filterRestaurant);
    }
    return filtered;
  };

  const getFilteredMartItems = () => {
    let filtered = allMartItems;
    if (filterUniversity) {
      filtered = filtered.filter(m => m.universityId === filterUniversity);
    }
    if (filterCampus) {
      filtered = filtered.filter(m => m.campusId === filterCampus);
    }
    return filtered;
  };

  const getCampusesForUniversity = (universityId) => {
    return campuses.filter(c => c.universityId === universityId);
  };

  const getRestaurantsForCampus = (campusId) => {
    return allRestaurants.filter(r => r.campusId === campusId);
  };

  const getFilteredUsers = () => {
    let filteredUsers = users;

    // Filter by role
    if (filterUserRole) {
      filteredUsers = filteredUsers.filter(user => user.role === filterUserRole);
    }

    // Filter by university
    if (filterUniversity) {
      filteredUsers = filteredUsers.filter(user => user.universityId === filterUniversity);
    }

    // Filter by campus
    if (filterCampus) {
      filteredUsers = filteredUsers.filter(user => user.campusId === filterCampus);
    }

    // Filter by search term
    if (searchUser) {
      const searchTerm = searchUser.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    return filteredUsers;
  };

  // Statistics
  const getStats = () => {
    const totalCampuses = campuses.length;
    const totalRestaurants = allRestaurants.length;
    const totalMenuItems = allMenuItems.length;
    const totalMartItems = allMartItems.length;
    const totalUsers = users.length;
    const campusAdmins = users.filter(u => u.role === "campusAdmin").length;
    const superAdmins = users.filter(u => u.role === "superAdmin").length;
    const restaurantManagers = users.filter(u => u.role === "restaurantManager").length;
    const regularUsers = users.filter(u => u.role === "user").length;

    return {
      totalCampuses,
      totalRestaurants,
      totalMenuItems,
      totalMartItems,
      totalUsers,
      campusAdmins,
      superAdmins,
      restaurantManagers,
      regularUsers
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="super-admin-page">
        <LoadingSpinner message="Loading Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-page d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="alert alert-danger">
            <h4>Error Loading Dashboard</h4>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setError("");
                fetchAllData();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">Super Admin Dashboard</h1>
            <p className="text-center text-muted mb-4">
              Welcome, {userData?.firstName} {userData?.lastName} ({userData?.email})
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  System Overview
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "universities" ? "active" : ""}`}
                  onClick={() => setActiveTab("universities")}
                >
                  Universities & Campuses
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  User Management
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "restaurants" ? "active" : ""}`}
                  onClick={() => setActiveTab("restaurants")}
                >
                  All Restaurants
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "menuItems" ? "active" : ""}`}
                  onClick={() => setActiveTab("menuItems")}
                >
                  All Menu Items
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "martItems" ? "active" : ""}`}
                  onClick={() => setActiveTab("martItems")}
                >
                  All Mart Items
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "campusSettings" ? "active" : ""}`}
                  onClick={() => setActiveTab("campusSettings")}
                >
                  Campus Settings
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  Orders Dashboard
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "crm" ? "active" : ""}`}
                  onClick={() => setActiveTab("crm")}
                >
                  CRM
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {/* System Overview Tab */}
              {activeTab === "overview" && (
                <div className="tab-pane fade show active">
                  <h3>System Overview</h3>
                  
                  {/* Statistics Cards */}
                  <div className="row mb-4">
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-primary text-white">
                        <div className="card-body">
                          <h4 className="card-title">{universities.length}</h4>
                          <p className="card-text">Universities</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-success text-white">
                        <div className="card-body">
                          <h4 className="card-title">{stats.totalCampuses}</h4>
                          <p className="card-text">Campuses</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-warning text-white">
                        <div className="card-body">
                          <h4 className="card-title">{stats.totalRestaurants}</h4>
                          <p className="card-text">Restaurants</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-info text-white">
                        <div className="card-body">
                          <h4 className="card-title">{stats.totalMenuItems}</h4>
                          <p className="card-text">Menu Items</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-secondary text-white">
                        <div className="card-body">
                          <h4 className="card-title">{stats.totalMartItems}</h4>
                          <p className="card-text">Mart Items</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 mb-3">
                      <div className="card text-center bg-dark text-white">
                        <div className="card-body">
                          <h4 className="card-title">{stats.totalUsers}</h4>
                          <p className="card-text">Users</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <div className="card">
                        <div className="card-header">
                          <h5>User Statistics</h5>
                        </div>
                        <div className="card-body">
                          <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between">
                              <span>Total Users</span>
                              <span className="badge bg-primary">{stats.totalUsers}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between">
                              <span>Regular Users</span>
                              <span className="badge bg-secondary">{stats.regularUsers}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between">
                              <span>Campus Admins</span>
                              <span className="badge bg-warning">{stats.campusAdmins}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between">
                              <span>Super Admins</span>
                              <span className="badge bg-danger">{stats.superAdmins}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="card">
                        <div className="card-header">
                          <h5>Quick Actions</h5>
                        </div>
                        <div className="card-body">
                          <div className="d-grid gap-2">
                            <button 
                              className="btn btn-primary" 
                              onClick={() => setActiveTab("universities")}
                            >
                              Manage Universities & Campuses
                            </button>
                            <button 
                              className="btn btn-warning" 
                              onClick={() => setActiveTab("users")}
                            >
                              Manage Users & Roles
                            </button>
                            <button 
                              className="btn btn-info" 
                              onClick={() => setActiveTab("restaurants")}
                            >
                              View All Restaurants
                            </button>
                            <button 
                              className="btn btn-success" 
                              onClick={() => setActiveTab("martItems")}
                            >
                              View All Mart Items
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "crm" && (
                <div className="tab-pane fade show active">
                  <Suspense fallback={<LoadingSpinner message="Loading CRM..." /> }>
                    <SuperAdminCRM />
                  </Suspense>
                </div>
              )}

              {/* Universities & Campuses Tab */}
              {activeTab === "universities" && (
                <div className="tab-pane fade show active">
                  <h3>Universities & Campuses Management</h3>
                  
                  {/* University Form */}
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5>{universityForm.id ? "Edit University" : "Add New University"}</h5>
                      <form onSubmit={handleUniversitySubmit} className="row g-2">
                        <div className="col-md-8">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="University Name" 
                            required
                            value={universityForm.name}
                            onChange={(e) => setUniversityForm({ ...universityForm, name: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <button type="submit" className="btn btn-primary w-100">
                            {universityForm.id ? "Update University" : "Add University"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Campus Form */}
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5>{campusForm.id ? "Edit Campus" : "Add New Campus"}</h5>
                      <form onSubmit={handleCampusSubmit} className="row g-2">
                        <div className="col-md-4">
                          <select 
                            className="form-select" 
                            required
                            value={campusForm.universityId}
                            onChange={(e) => setCampusForm({ ...campusForm, universityId: e.target.value })}
                          >
                            <option value="">Select University</option>
                    {universities.map(university => (
                              <option key={university.id} value={university.id}>
                                {university.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Campus Name" 
                            required
                            value={campusForm.name}
                            onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <button type="submit" className="btn btn-success w-100">
                            {campusForm.id ? "Update Campus" : "Add Campus"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Universities List */}
                  <div className="row">
                    {universities.map(university => {
                      const universityCampuses = campuses.filter(c => c.universityId === university.id);
                      return (
                        <div key={university.id} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                          <div className="university-card">
                            <div className="admin-card-content">
                              <h5 className="card-title">{university.name}</h5>
                              <p className="text-muted small mb-3">
                                ID: {university.id.substring(0, 15)}...
                              </p>
                              
                              <div className="admin-card-info-row">
                                <span className="admin-card-info-label">Campuses</span>
                                <span className="admin-card-info-value">{universityCampuses.length} {universityCampuses.length === 1 ? 'Campus' : 'Campuses'}</span>
                              </div>
                              
                              {/* Campuses List */}
                              {universityCampuses.length > 0 && (
                                <div className="mt-3">
                                  <h6 className="text-muted small mb-2">Campuses:</h6>
                                  <div className="campus-list">
                                    {universityCampuses.map(campus => (
                                      <div key={campus.id} className="campus-item">
                                        <span>{campus.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="action-buttons">
                              <button 
                                className="btn-edit"
                                onClick={() => handleUniversityEdit(university)}
                                title="Edit University"
                              >
                                EDIT
                              </button>
                              <button 
                                className="btn-delete"
                                onClick={() => handleUniversityDelete(university.id)}
                                title="Delete University"
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Campuses Management Section */}
                  <div className="mt-5">
                    <h4 className="mb-4">All Campuses</h4>
                    <div className="row">
                      {campuses.map(campus => {
                        const university = universities.find(u => u.id === campus.universityId);
                        return (
                          <div key={campus.id} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                            <div className="campus-card">
                              <div className="admin-card-content">
                                <h5 className="card-title">{campus.name}</h5>
                                <p className="text-muted small mb-3">
                                  ID: {campus.id.substring(0, 15)}...
                                </p>
                                
                                <div className="admin-card-info-row">
                                  <span className="admin-card-info-label">University</span>
                                  <span className="admin-card-info-value">{university?.name || 'N/A'}</span>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="action-buttons">
                                <button 
                                  className="btn-edit"
                                  onClick={() => handleCampusEdit(campus)}
                                  title="Edit Campus"
                                >
                                  EDIT
                                </button>
                                <button 
                                  className="btn-delete"
                                  onClick={() => handleCampusDelete(campus)}
                                  title="Delete Campus"
                                >
                                  DELETE
                                </button>
                              </div>
                              
                              {/* Additional Actions Dropdown */}
                              <div className="admin-card-actions" style={{borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', marginTop: '0.5rem'}}>
                                <button 
                                  className="btn btn-sm btn-outline-warning w-100 mb-2"
                                  onClick={() => handleBulkDeleteUsers(campus)}
                                  title="Delete all users from this campus"
                                >
                                  CLEAR USERS
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-warning w-100 mb-2"
                                  onClick={() => handleBulkDeleteRestaurants(campus)}
                                  title="Delete all restaurants from this campus"
                                >
                                  CLEAR RESTAURANTS
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-warning w-100"
                                  onClick={() => handleBulkDeleteMartItems(campus)}
                                  title="Delete all mart items from this campus"
                                >
                                  CLEAR MART ITEMS
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="tab-pane fade show active">
                  <h3>User Management</h3>
                  
                  {/* User Filters */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Filters</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label">Search Users</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or email..."
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={filterUserRole}
                            onChange={(e) => setFilterUserRole(e.target.value)}
                          >
                            <option value="">All Roles</option>
                            <option value="user">Basic User</option>
                            <option value="campusAdmin">Campus Admin</option>
                            <option value="restaurantManager">Restaurant Manager</option>
                            <option value="superAdmin">Super Admin</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={filterUniversity}
                            onChange={(e) => {
                              setFilterUniversity(e.target.value);
                              setFilterCampus("");
                            }}
                          >
                            <option value="">All Universities</option>
                            {universities.map(uni => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Campus</label>
                          <select
                            className="form-select"
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                            disabled={!filterUniversity}
                          >
                            <option value="">All Campuses</option>
                            {filterUniversity && getCampusesForUniversity(filterUniversity).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Actions</label>
                          <div>
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                setFilterUserRole("");
                                setFilterUniversity("");
                                setFilterCampus("");
                                setSearchUser("");
                              }}
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Statistics Cards */}
                  <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                      <div className="card text-center bg-primary text-white">
                        <div className="card-body">
                          <h4 className="card-title">{users.filter(u => u.role === "user").length}</h4>
                          <p className="card-text">Basic Users</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card text-center bg-warning text-white">
                        <div className="card-body">
                          <h4 className="card-title">{users.filter(u => u.role === "campusAdmin").length}</h4>
                          <p className="card-text">Campus Admins</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card text-center bg-info text-white">
                        <div className="card-body">
                          <h4 className="card-title">{users.filter(u => u.role === "restaurantManager").length}</h4>
                          <p className="card-text">Restaurant Managers</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card text-center bg-danger text-white">
                        <div className="card-body">
                          <h4 className="card-title">{users.filter(u => u.role === "superAdmin").length}</h4>
                          <p className="card-text">Super Admins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-12 mb-3">
                      <div className="card text-center bg-success text-white">
                        <div className="card-body">
                          <h4 className="card-title">{getFilteredUsers().length}</h4>
                          <p className="card-text">Filtered Results</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Filter Buttons */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Quick Filters</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex gap-2 flex-wrap">
                        <button 
                          className={`btn ${filterUserRole === "" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setFilterUserRole("")}
                        >
                          All Users ({users.length})
                        </button>
                        <button 
                          className={`btn ${filterUserRole === "user" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setFilterUserRole("user")}
                        >
                          Basic Users ({users.filter(u => u.role === "user").length})
                        </button>
                        <button 
                          className={`btn ${filterUserRole === "campusAdmin" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setFilterUserRole("campusAdmin")}
                        >
                          Campus Admins ({users.filter(u => u.role === "campusAdmin").length})
                        </button>
                        <button 
                          className={`btn ${filterUserRole === "restaurantManager" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setFilterUserRole("restaurantManager")}
                        >
                          Restaurant Managers ({users.filter(u => u.role === "restaurantManager").length})
                        </button>
                        <button 
                          className={`btn ${filterUserRole === "superAdmin" ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setFilterUserRole("superAdmin")}
                        >
                          Super Admins ({users.filter(u => u.role === "superAdmin").length})
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Create/Edit User Form */}
                  <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{userForm.id ? 'Edit User' : 'Create New User'}</h5>
                      {userForm.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setUserForm({ firstName: "", lastName: "", email: "", password: "", role: "campusAdmin", universityId: "", campusId: "", restaurantId: "", id: null })}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleUserSubmit} className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="First Name"
                            required
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Last Name"
                            required
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Email"
                            required
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Password {userForm.id && <small className="text-muted">(leave blank to keep current)</small>}</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder={userForm.id ? "Leave blank to keep current" : "Password"}
                            required={!userForm.id}
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                          >
                            <option value="user">User</option>
                            <option value="campusAdmin">Campus Admin</option>
                            <option value="restaurantManager">Restaurant Manager</option>
                            <option value="superAdmin">Super Admin</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={userForm.universityId}
                            onChange={(e) => {
                              setUserForm({...userForm, universityId: e.target.value, campusId: "", restaurantId: ""});
                            }}
                            required
                          >
                            <option value="">Select University</option>
                            {universities.map(uni => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Campus</label>
                          <select
                            className="form-select"
                            value={userForm.campusId}
                            onChange={(e) => setUserForm({...userForm, campusId: e.target.value, restaurantId: ""})}
                            required
                            disabled={!userForm.universityId}
                          >
                            <option value="">Select Campus</option>
                            {getCampusesForUniversity(userForm.universityId).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                        </div>
                        {userForm.role === 'restaurantManager' && (
                          <div className="col-md-4">
                            <label className="form-label">Restaurant</label>
                            <select
                              className="form-select"
                              value={userForm.restaurantId || ""}
                              onChange={(e) => setUserForm({...userForm, restaurantId: e.target.value})}
                              required
                              disabled={!userForm.campusId}
                            >
                              <option value="">Select Restaurant</option>
                              {getRestaurantsForCampus(userForm.campusId).map(restaurant => (
                                <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className={`${userForm.role === 'restaurantManager' ? 'col-md-8' : 'col-md-4'} d-flex align-items-end`}>
                          <button type="submit" className="btn btn-primary w-100">
                            {userForm.id ? 'Update User' : 'Create User'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Collapsible User List Header */}
                  <div className="card mb-3">
                    <div 
                      className="card-header collapsible-header d-flex justify-content-between align-items-center"
                      onClick={() => setIsUserListOpen(!isUserListOpen)}
                    >
                      <h5 className="mb-0">
                        All Users ({getFilteredUsers().length})
                      </h5>
                      <span className="badge bg-secondary">
                        {isUserListOpen ? '▼ Close' : '▶ Open'}
                      </span>
                    </div>
                  </div>

                  {isUserListOpen && (
                  <>
                    {/* Quick Search Bar */}
                    <div className="card mb-3">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="🔍 Quick search by name or email..."
                              value={searchUser}
                              onChange={(e) => setSearchUser(e.target.value)}
                            />
                          </div>
                          <div className="col-md-3">
                            <select
                              className="form-select"
                              value={filterUserRole}
                              onChange={(e) => setFilterUserRole(e.target.value)}
                            >
                              <option value="">All Roles</option>
                              <option value="user">Basic User</option>
                              <option value="campusAdmin">Campus Admin</option>
                              <option value="restaurantManager">Restaurant Manager</option>
                              <option value="superAdmin">Super Admin</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <button 
                              className="btn btn-outline-secondary w-100"
                              onClick={() => {
                                setSearchUser("");
                                setFilterUserRole("");
                              }}
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="table-responsive">
                    {/* Filter Status */}
                    {(filterUserRole || filterUniversity || filterCampus || searchUser) && (
                      <div className="alert alert-info mb-3">
                        <strong>Active Filters:</strong>
                        {searchUser && <span className="badge bg-dark me-2">Search: "{searchUser}"</span>}
                        {filterUserRole && <span className="badge bg-primary me-2">Role: {filterUserRole}</span>}
                        {filterUniversity && <span className="badge bg-secondary me-2">University: {universities.find(u => u.id === filterUniversity)?.name}</span>}
                        {filterCampus && <span className="badge bg-info me-2">Campus: {campuses.find(c => c.id === filterCampus)?.name}</span>}
                        <span className="badge bg-success">Showing {getFilteredUsers().length} of {users.length} users</span>
                      </div>
                    )}
                    
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>University</th>
                          <th>Campus</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">
                              <i className="fas fa-search me-2"></i>
                              No users found matching the current filters.
                            </td>
                          </tr>
                        ) : (
                          getFilteredUsers().map(user => (
                          <tr key={user.id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>
                              <div className="role-badge-container">
                                <span className={`role-badge ${
                                  user.role === "superAdmin" ? "role-super-admin" : 
                                  user.role === "campusAdmin" ? "role-campus-admin" : 
                                  user.role === "restaurantManager" ? "role-restaurant-manager" : "role-basic-user"
                                }`}>
                                  {user.role === "user" ? "Basic User" : 
                                   user.role === "campusAdmin" ? "Campus Admin" : 
                                   user.role === "restaurantManager" ? "Restaurant Mgr" : 
                                   user.role === "superAdmin" ? "Super Admin" : "Basic User"}
                                </span>
                              <select
                                className="form-select form-select-sm role-select"
                                value={user.role || "user"}
                                onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                              >
                                <option value="user">User</option>
                                <option value="campusAdmin">Campus Admin</option>
                                <option value="restaurantManager">Restaurant Manager</option>
                                <option value="superAdmin">Super Admin</option>
                              </select>
                              </div>
                            </td>
                            <td>
                              {user.universityName ? (
                                <span className="badge bg-primary">{user.universityName}</span>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              {user.campusName ? (
                                <span className="badge bg-info">{user.campusName}</span>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleUserEdit(user)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleUserDelete(user.id)}
                                disabled={user.role === "superAdmin" && user.id === userData?.uid}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  </>
                  )}
                </div>
              )}

              {/* All Restaurants Tab */}
              {activeTab === "restaurants" && (
                <div className="tab-pane fade show active">
                  <h3>Restaurant Management</h3>
                  
                  {/* Filters */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Filters</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={filterUniversity}
                            onChange={(e) => {
                              setFilterUniversity(e.target.value);
                              setFilterCampus("");
                              setFilterRestaurant("");
                            }}
                          >
                            <option value="">All Universities</option>
                            {universities.map(uni => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Campus</label>
                          <select
                            className="form-select"
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                            disabled={!filterUniversity}
                          >
                            <option value="">All Campuses</option>
                            {filterUniversity && getCampusesForUniversity(filterUniversity).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Actions</label>
                          <div>
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                setFilterUniversity("");
                                setFilterCampus("");
                                setFilterRestaurant("");
                              }}
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Form */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Add/Edit Restaurant</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleRestaurantSubmit}>
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">University</label>
                            <select
                              className="form-select"
                              value={restaurantForm.universityId}
                              onChange={(e) => {
                                setRestaurantForm({...restaurantForm, universityId: e.target.value, campusId: ""});
                                setSelectedCampus(null);
                              }}
                              required
                            >
                              <option value="">Select University</option>
                              {universities.map(uni => (
                                <option key={uni.id} value={uni.id}>{uni.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Campus</label>
                            <select
                              className="form-select"
                              value={restaurantForm.campusId}
                              onChange={(e) => setRestaurantForm({...restaurantForm, campusId: e.target.value})}
                              required
                              disabled={!restaurantForm.universityId}
                            >
                              <option value="">Select Campus</option>
                              {restaurantForm.universityId && getCampusesForUniversity(restaurantForm.universityId).map(campus => (
                                <option key={campus.id} value={campus.id}>{campus.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Restaurant Name"
                              value={restaurantForm.name}
                              onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Location</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Location"
                              value={restaurantForm.location}
                              onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Cuisine</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Cuisine"
                              value={restaurantForm.cuisine}
                              onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        
                        {/* Restaurant Timing Fields */}
                        <div className="row g-3 mt-2">
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
                                id="is24x7"
                                checked={restaurantForm.is24x7 !== undefined ? restaurantForm.is24x7 : true}
                                onChange={(e) => setRestaurantForm({...restaurantForm, is24x7: e.target.checked})}
                              />
                              <label className="form-check-label" htmlFor="is24x7">
                                24/7 Open
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* Restaurant Image Upload */}
                        <div className="row g-3 mt-2">
                          <div className="col-md-4">
                            <label className="form-label">Restaurant Image</label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setRestaurantForm({ ...restaurantForm, imageFile: file });
                              }}
                            />
                            {(restaurantForm.imageFile || restaurantForm.photoURL) && (
                              <div className="mt-2">
                                <img
                                  src={restaurantForm.imageFile ? URL.createObjectURL(restaurantForm.imageFile) : restaurantForm.photoURL}
                                  alt="Preview"
                                  style={{ maxWidth: '200px', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="row g-3 mt-2">
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {restaurantForm.id ? "Update Restaurant" : "Add Restaurant"}
                            </button>
                            {restaurantForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setRestaurantForm({ 
                                  name: "", 
                                  location: "", 
                                  cuisine: "", 
                                  universityId: "", 
                                  campusId: "", 
                                  openTime: "10:00 AM",
                                  closeTime: "10:00 PM",
                                  is24x7: true,
                                  photoURL: "",
                                  imageFile: null,
                                  id: null 
                                })}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Restaurants List */}
                  <div className="row">
                    {getFilteredRestaurants().map(restaurant => (
                      <div key={`${restaurant.universityId}-${restaurant.campusId}-${restaurant.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                        <div className="restaurant-card">
                          <div className="restaurant-card-header">
                            <h5 className="restaurant-card-title">{restaurant.name}</h5>
                            <p className="restaurant-card-subtitle">
                              {restaurant.location} • {restaurant.cuisine}
                            </p>
                          </div>
                          
                          <div className="restaurant-card-body">
                            <div className="restaurant-badges">
                              <span className="badge badge-university">{restaurant.universityName}</span>
                              <span className="badge badge-campus">{restaurant.campusName}</span>
                            </div>
                            {restaurant.photoURL && (
                              <div className="mt-2">
                                <img
                                  src={restaurant.photoURL}
                                  alt={restaurant.name}
                                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            
                            <div className="restaurant-timing">
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                              </svg>
                              <span>{restaurant.is24x7 ? '24/7 Open' : `${restaurant.openTime} - ${restaurant.closeTime}`}</span>
                            </div>
                            
                            <div className="restaurant-id">
                              <small>ID: {restaurant.id.substring(0, 8)}...</small>
                            </div>
                          </div>
                          
                          <div className="restaurant-card-footer">
                            <button 
                              className="btn-restaurant btn-edit"
                              onClick={() => handleRestaurantEdit(restaurant)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-restaurant btn-delete"
                              onClick={() => handleRestaurantDelete(restaurant)}
                            >
                              Delete
                            </button>
                            <button 
                              className="btn-restaurant btn-clear"
                              onClick={() => handleBulkDeleteMenuItems(restaurant)}
                              title="Delete all menu items from this restaurant"
                            >
                              Clear Menu
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {getFilteredRestaurants().length === 0 && (
                    <div className="text-center text-muted">
                      <p>No restaurants found with the selected filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* All Mart Items Tab */}
              {activeTab === "martItems" && (
                <div className="tab-pane fade show active">
                  <h3>Mart Items Management</h3>
                  
                  {/* Filters */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Filters</h5>
                    </div>
                        <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={filterUniversity}
                            onChange={(e) => {
                              setFilterUniversity(e.target.value);
                              setFilterCampus("");
                              setFilterRestaurant("");
                            }}
                          >
                            <option value="">All Universities</option>
                            {universities.map(uni => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Campus</label>
                          <select
                            className="form-select"
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                            disabled={!filterUniversity}
                          >
                            <option value="">All Campuses</option>
                            {filterUniversity && getCampusesForUniversity(filterUniversity).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                      </div>
                        <div className="col-md-4">
                          <label className="form-label">Actions</label>
                          <div>
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                setFilterUniversity("");
                                setFilterCampus("");
                                setFilterRestaurant("");
                              }}
                            >
                              Clear Filters
                            </button>
                    </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mart Item Form */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Add/Edit Mart Item</h5>
                    </div>
                        <div className="card-body">
                      <form onSubmit={handleMartItemSubmit}>
                        <div className="row g-3">
                          <div className="col-md-2">
                            <label className="form-label">University</label>
                            <select
                              className="form-select"
                              value={martItemForm.universityId}
                              onChange={(e) => {
                                setMartItemForm({...martItemForm, universityId: e.target.value, campusId: ""});
                              }}
                              required
                            >
                              <option value="">Select University</option>
                              {universities.map(uni => (
                                <option key={uni.id} value={uni.id}>{uni.name}</option>
                              ))}
                            </select>
                        </div>
                          <div className="col-md-2">
                            <label className="form-label">Campus</label>
                            <select
                              className="form-select"
                              value={martItemForm.campusId}
                              onChange={(e) => setMartItemForm({...martItemForm, campusId: e.target.value})}
                              required
                              disabled={!martItemForm.universityId}
                            >
                              <option value="">Select Campus</option>
                              {martItemForm.universityId && getCampusesForUniversity(martItemForm.universityId).map(campus => (
                                <option key={campus.id} value={campus.id}>{campus.name}</option>
                              ))}
                            </select>
                      </div>
                          <div className="col-md-2">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Item Name"
                              value={martItemForm.name}
                              onChange={(e) => setMartItemForm({...martItemForm, name: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Price</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Price"
                              value={martItemForm.price}
                              onChange={(e) => setMartItemForm({...martItemForm, price: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Category</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Category"
                              value={martItemForm.category}
                              onChange={(e) => setMartItemForm({...martItemForm, category: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Stock</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Stock"
                              value={martItemForm.stock}
                              onChange={(e) => setMartItemForm({...martItemForm, stock: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Description"
                              value={martItemForm.description}
                              onChange={(e) => setMartItemForm({...martItemForm, description: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        {/* Mart Item Image Upload */}
                        <div className="row g-3 mt-2">
                          <div className="col-md-12">
                            <label className="form-label">Item Image</label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  setMartItemForm({
                                    ...martItemForm,
                                    imageFile: e.target.files[0]
                                  });
                                }
                              }}
                            />
                            {(martItemForm.imageUrl || martItemForm.imageFile) && (
                              <div className="mt-2">
                                <img 
                                  src={martItemForm.imageFile ? URL.createObjectURL(martItemForm.imageFile) : martItemForm.imageUrl} 
                                  alt="Preview" 
                                  style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover", borderRadius: "8px" }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="row g-3 mt-2">
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {martItemForm.id ? "Update Mart Item" : "Add Mart Item"}
                            </button>
                            {martItemForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setMartItemForm({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", imageUrl: "", imageFile: null, id: null })}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  
                  {/* Mart Items List */}
                  <div className="row">
                    {getFilteredMartItems().map(item => (
                      <div key={`${item.universityId}-${item.campusId}-${item.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                        <div className="mart-item-card">
                          {item.photoURL && (
                            <div className="mart-item-image">
                              <img 
                                src={item.photoURL} 
                                alt={item.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.style.display = 'none';
                                }}
                              />
                              {item.stock <= 5 && item.stock > 0 && (
                                <div className="stock-badge low-stock">Low Stock</div>
                              )}
                              {item.stock === 0 && (
                                <div className="stock-badge out-of-stock">Out of Stock</div>
                              )}
                            </div>
                          )}
                          
                          <div className="mart-item-body">
                            <h5 className="mart-item-title">{item.name}</h5>
                            <div className="mart-item-price">₹{item.price}</div>
                            
                            <div className="mart-item-info">
                              <div className="info-row">
                                <span className="info-label">Category:</span>
                                <span className="info-value">{item.category}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-label">Stock:</span>
                                <span className={`info-value stock-${item.stock <= 5 ? 'low' : 'good'}`}>
                                  {item.stock} units
                                </span>
                              </div>
                            </div>
                            
                            {item.description && (
                              <p className="mart-item-description">{item.description}</p>
                            )}
                            
                            <div className="mart-item-badges">
                              <span className="badge badge-university">{item.universityName}</span>
                              <span className="badge badge-campus">{item.campusName}</span>
                            </div>
                            
                            <div className="mart-item-id">
                              <small>ID: {item.id.substring(0, 8)}...</small>
                            </div>
                          </div>
                          
                          <div className="mart-item-footer">
                            <button 
                              className="btn-mart-item btn-edit"
                              onClick={() => handleMartItemEdit(item)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-mart-item btn-delete"
                              onClick={() => handleMartItemDelete(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {getFilteredMartItems().length === 0 && (
                    <div className="text-center text-muted">
                      <p>No mart items found with the selected filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* All Menu Items Tab */}
              {activeTab === "menuItems" && (
                <div className="tab-pane fade show active">
                  <h3>Menu Items Management</h3>
                  
                  {/* Filters */}
                  <div className="card mb-4">
                        <div className="card-header">
                      <h5 className="mb-0">Filters</h5>
                        </div>
                        <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={filterUniversity}
                            onChange={(e) => {
                              setFilterUniversity(e.target.value);
                              setFilterCampus("");
                              setFilterRestaurant("");
                            }}
                          >
                            <option value="">All Universities</option>
                            {universities.map(uni => (
                              <option key={uni.id} value={uni.id}>{uni.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Campus</label>
                          <select
                            className="form-select"
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                            disabled={!filterUniversity}
                          >
                            <option value="">All Campuses</option>
                            {filterUniversity && getCampusesForUniversity(filterUniversity).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                      </div>
                        <div className="col-md-3">
                          <label className="form-label">Restaurant</label>
                          <select
                            className="form-select"
                            value={filterRestaurant}
                            onChange={(e) => setFilterRestaurant(e.target.value)}
                            disabled={!filterCampus}
                          >
                            <option value="">All Restaurants</option>
                            {filterCampus && getRestaurantsForCampus(filterCampus).map(restaurant => (
                              <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                            ))}
                          </select>
                    </div>
                        <div className="col-md-3">
                          <label className="form-label">Actions</label>
                          <div>
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                setFilterUniversity("");
                                setFilterCampus("");
                                setFilterRestaurant("");
                              }}
                            >
                              Clear Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Item Form */}
                  <div className="card mb-4">
                        <div className="card-header">
                      <h5 className="mb-0">Add/Edit Menu Item</h5>
                        </div>
                        <div className="card-body">
                      <form onSubmit={handleMenuSubmit}>
                        <div className="row g-3">
                          <div className="col-md-2">
                            <label className="form-label">University</label>
                            <select
                              className="form-select"
                              value={menuForm.universityId}
                              onChange={(e) => {
                                setMenuForm({...menuForm, universityId: e.target.value, campusId: "", restaurantId: ""});
                              }}
                              required
                            >
                              <option value="">Select University</option>
                              {universities.map(uni => (
                                <option key={uni.id} value={uni.id}>{uni.name}</option>
                              ))}
                            </select>
                        </div>
                          <div className="col-md-2">
                            <label className="form-label">Campus</label>
                            <select
                              className="form-select"
                              value={menuForm.campusId}
                              onChange={(e) => {
                                setMenuForm({...menuForm, campusId: e.target.value, restaurantId: ""});
                              }}
                              required
                              disabled={!menuForm.universityId}
                            >
                              <option value="">Select Campus</option>
                              {menuForm.universityId && getCampusesForUniversity(menuForm.universityId).map(campus => (
                                <option key={campus.id} value={campus.id}>{campus.name}</option>
                              ))}
                            </select>
                      </div>
                          <div className="col-md-2">
                            <label className="form-label">Restaurant</label>
                            <select
                              className="form-select"
                              value={menuForm.restaurantId}
                              onChange={(e) => setMenuForm({...menuForm, restaurantId: e.target.value})}
                              required
                              disabled={!menuForm.campusId}
                            >
                              <option value="">Select Restaurant</option>
                              {menuForm.campusId && getRestaurantsForCampus(menuForm.campusId).map(restaurant => (
                                <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                              ))}
                            </select>
                    </div>
                          <div className="col-md-2">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Item Name"
                              value={menuForm.name}
                              onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                              required
                            />
                  </div>
                          <div className="col-md-2">
                            <label className="form-label">Price</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Price"
                              value={menuForm.price}
                              onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                              required
                            />
                </div>
                          <div className="col-md-2">
                            <label className="form-label">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Description"
                              value={menuForm.description}
                              onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Item Image</label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={(e) => setMenuForm({ ...menuForm, imageFile: e.target.files?.[0] || null })}
                            />
                            {(menuForm.imageFile || menuForm.photoURL) && (
                              <div className="mt-2">
                                <img
                                  src={menuForm.imageFile ? URL.createObjectURL(menuForm.imageFile) : menuForm.photoURL}
                                  alt="Preview"
                                  style={{ maxWidth: '200px', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {menuForm.id ? "Update Menu Item" : "Add Menu Item"}
                            </button>
                            {menuForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setMenuForm({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", photoURL: "", imageFile: null, id: null })}
                              >
                                Cancel
                              </button>
              )}
            </div>
          </div>
                      </form>
                    </div>
                  </div>

                  {/* Bulk Import for selected university/campus/restaurant */}
                  <BulkMenuImport
                    universityId={menuForm.universityId}
                    campusId={menuForm.campusId}
                    restaurantId={menuForm.restaurantId}
                    restaurants={allRestaurants.filter(r => r.universityId === menuForm.universityId && r.campusId === menuForm.campusId)}
                    onComplete={() => fetchAllData()}
                  />

                  {/* Menu Items List */}
                  <div className="row">
                    {getFilteredMenuItems().map(item => (
                      <div key={`${item.universityId}-${item.campusId}-${item.restaurantId}-${item.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                        <div className="menu-item-card">
                          {item.photoURL && (
                            <div className="menu-item-image">
                              <img 
                                src={item.photoURL} 
                                alt={item.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="menu-item-body">
                            <h5 className="menu-item-title">{item.name}</h5>
                            <div className="menu-item-price">₹{item.price}</div>
                            
                            {item.description && (
                              <p className="menu-item-description">{item.description}</p>
                            )}
                            
                            <div className="menu-item-badges">
                              <span className="badge badge-university">{item.universityName}</span>
                              <span className="badge badge-campus">{item.campusName}</span>
                              <span className="badge badge-restaurant">{item.restaurantName}</span>
                            </div>
                            
                            <div className="menu-item-id">
                              <small>ID: {item.id.substring(0, 8)}...</small>
                            </div>
                          </div>
                          
                          <div className="menu-item-footer">
                            <button 
                              className="btn-menu-item btn-edit"
                              onClick={() => handleMenuEdit(item)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-menu-item btn-delete"
                              onClick={() => handleMenuDelete(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {getFilteredMenuItems().length === 0 && (
                    <div className="text-center text-muted">
                      <p>No menu items found with the selected filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Campus Settings Tab */}
              {activeTab === "campusSettings" && (
                <div className="tab-pane fade show active">
                  <CampusSettingsManager />
                </div>
              )}

              {/* Orders Dashboard Tab */}
              {activeTab === "orders" && (
                <div className="tab-pane fade show active">
                  <div className="mb-4">
                    <button
                      className="btn btn-primary w-100 d-flex justify-content-between align-items-center"
                      onClick={() => setIsOrdersOpen(!isOrdersOpen)}
                      style={{
                        backgroundColor: 'rgba(74, 85, 104, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '12px 20px',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      <span>All Orders</span>
                      <span>{isOrdersOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOrdersOpen && (
                      <div className="mt-3">
                        <SuperAdminOrdersPanel />
                      </div>
                    )}
                  </div>
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

export default SuperAdmin; 