import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  setDoc,
  query,
  where 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import ConfirmationDialog from "../components/ConfirmationDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import { createSheetTab, deleteSheetTab, createMasterSheet } from "../utils/googleSheets";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import "../styles/SuperAdmin.css";

const SuperAdmin = () => {
  const { userData } = useAuth();
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
  const [restaurantForm, setRestaurantForm] = useState({ name: "", location: "", cuisine: "", universityId: "", campusId: "", id: null });
  const [menuForm, setMenuForm] = useState({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", id: null });
  const [martItemForm, setMartItemForm] = useState({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", id: null });
  const [domainForm, setDomainForm] = useState({ name: "", domain: "", universityId: "", campusId: "", id: null });
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "campusAdmin", universityId: "", campusId: "", id: null });
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // Filtering states
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterCampus, setFilterCampus] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState("");

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
      // Create master sheet if it doesn't exist
      createMasterSheet().catch(err => {
        console.warn('Failed to create master sheet:', err);
        // Don't show error to user as this is optional functionality
      });
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
        const universitiesSnapshot = await getDocs(collection(db, "universities"));
        const universitiesData = universitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUniversities(universitiesData);

        // Fetch all campuses
        const allCampuses = [];
        for (const university of universitiesData) {
          try {
            const campusesSnapshot = await getDocs(collection(db, "universities", university.id, "campuses"));
            const campusesData = campusesSnapshot.docs.map(doc => ({
              id: doc.id,
              universityId: university.id,
              universityName: university.name,
              ...doc.data()
            }));
            allCampuses.push(...campusesData);
          } catch (campusErr) {
            console.error(`Error fetching campuses for university ${university.id}:`, campusErr);
          }
        }
        setCampuses(allCampuses);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Fetch all restaurants and menu items
        const allRestaurantsData = [];
        const allMenuItemsData = [];
        for (const campus of allCampuses) {
          try {
            const restaurantsSnapshot = await getDocs(collection(db, "universities", campus.universityId, "campuses", campus.id, "restaurants"));
            const restaurantsData = restaurantsSnapshot.docs.map(doc => ({
              id: doc.id,
              campusId: campus.id,
              campusName: campus.name,
              universityId: campus.universityId,
              universityName: campus.universityName,
              ...doc.data()
            }));
            allRestaurantsData.push(...restaurantsData);

            // Fetch menu items for each restaurant
            for (const restaurant of restaurantsData) {
              try {
                const menuItemsSnapshot = await getDocs(collection(db, "universities", campus.universityId, "campuses", campus.id, "restaurants", restaurant.id, "menuItems"));
                const menuItemsData = menuItemsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                  campusId: campus.id,
                  campusName: campus.name,
                  universityId: campus.universityId,
                  universityName: campus.universityName,
                  ...doc.data()
                }));
                allMenuItemsData.push(...menuItemsData);
              } catch (menuErr) {
                console.error(`Error fetching menu items for restaurant ${restaurant.id}:`, menuErr);
              }
            }
          } catch (restaurantErr) {
            console.error(`Error fetching restaurants for campus ${campus.id}:`, restaurantErr);
          }
        }
        setAllRestaurants(allRestaurantsData);
        setAllMenuItems(allMenuItemsData);

        // Fetch all mart items
        const allMartItemsData = [];
        for (const campus of allCampuses) {
          try {
            const martItemsSnapshot = await getDocs(collection(db, "universities", campus.universityId, "campuses", campus.id, "martItems"));
            const martItemsData = martItemsSnapshot.docs.map(doc => ({
              id: doc.id,
              campusId: campus.id,
              campusName: campus.name,
              universityId: campus.universityId,
              universityName: campus.universityName,
              ...doc.data()
            }));
            allMartItemsData.push(...martItemsData);
          } catch (martErr) {
            console.error(`Error fetching mart items for campus ${campus.id}:`, martErr);
          }
        }
        setAllMartItems(allMartItemsData);

        // Fetch domains
        const domainsSnapshot = await getDocs(collection(db, "allowedDomains"));
        const domainsData = domainsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDomains(domainsData);

    } catch (err) {
        const handledError = handleError(err, 'SuperAdmin - fetchAllData');
        setError(handledError.message);
        console.error("Error in fetchAllData:", handledError);
      }
    };

    try {
      await Promise.race([fetchDataPromise(), timeoutPromise]);
    } catch (err) {
      const handledError = handleError(err, 'SuperAdmin - fetchAllData (timeout)');
      setError(handledError.message);
      console.error("Error in fetchAllData (with timeout):", handledError);
    } finally {
      setLoading(false);
    }
  };

  // University management
  const handleUniversitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (universityForm.id) {
        await updateDoc(doc(db, "universities", universityForm.id), {
          name: universityForm.name,
        });
      } else {
        await addDoc(collection(db, "universities"), {
          name: universityForm.name,
        });
      }
      setUniversityForm({ name: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save university");
      console.error(err);
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
          await deleteDoc(doc(db, "universities", id));
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
      
      if (campusForm.id) {
        // Update existing campus
        await updateDoc(doc(db, "universities", campusForm.universityId, "campuses", campusForm.id), {
          name: campusForm.name,
        });
      } else {
        // Create new campus
        const campusDoc = await addDoc(collection(db, "universities", campusForm.universityId, "campuses"), {
          name: campusForm.name,
        });
        
        // Create Google Sheets tab for the new campus
        try {
          await createSheetTab(university.name, campusForm.name);
  
        } catch (sheetsError) {
          console.error('Failed to create Google Sheets tab:', sheetsError);
          setError(`Campus created but failed to create Google Sheets tab: ${sheetsError.message}`);
        }
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
      `Are you sure you want to delete "${campus.name}" campus? This will also delete all its restaurants, menu items, mart items, and the corresponding Google Sheets tab. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          // Delete from Firestore
          await deleteDoc(doc(db, "universities", campus.universityId, "campuses", campus.id));
          
          // Delete Google Sheets tab
          try {
            await deleteSheetTab(campus.universityName, campus.name);
    
          } catch (sheetsError) {
            console.error('Failed to delete Google Sheets tab:', sheetsError);
            setError(`Campus deleted but failed to delete Google Sheets tab: ${sheetsError.message}`);
          }
          
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

  const handleUserDelete = async (userId) => {
    const user = users.find(u => u.id === userId);
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

  // User creation
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.universityId || !userForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);
      const firebaseUser = userCredential.user;
      // Create Firestore user document
      const newUser = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role,
        universityId: userForm.universityId,
        campusId: userForm.campusId,
        universityName: universities.find(u => u.id === userForm.universityId)?.name,
        campusName: campuses.find(c => c.id === userForm.campusId)?.name,
        createdAt: new Date().toISOString(),
        uid: firebaseUser.uid,
      };
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      setUserForm({ firstName: "", lastName: "", email: "", password: "", role: "campusAdmin", universityId: "", campusId: "", id: null });
      fetchAllData();
      alert("User created successfully! The user can now sign in with the provided email and password.");
    } catch (err) {
      setError("Failed to create user: " + (err.message || err.code));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Restaurant management
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantForm.universityId || !restaurantForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    setLoading(true);
    try {
      if (restaurantForm.id) {
        await updateDoc(doc(db, "universities", restaurantForm.universityId, "campuses", restaurantForm.campusId, "restaurants", restaurantForm.id), {
          name: restaurantForm.name,
          location: restaurantForm.location,
          cuisine: restaurantForm.cuisine,
        });
      } else {
        await addDoc(collection(db, "universities", restaurantForm.universityId, "campuses", restaurantForm.campusId, "restaurants"), {
          name: restaurantForm.name,
          location: restaurantForm.location,
          cuisine: restaurantForm.cuisine,
        });
      }
      setRestaurantForm({ name: "", location: "", cuisine: "", universityId: "", campusId: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save restaurant");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantEdit = (restaurant) => {
    setRestaurantForm(restaurant);
  };

  const handleRestaurantDelete = async (restaurant) => {
    showConfirmationDialog(
      "Delete Restaurant",
      `Are you sure you want to delete "${restaurant.name}" restaurant? This will also delete all its menu items. This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "universities", restaurant.universityId, "campuses", restaurant.campusId, "restaurants", restaurant.id));
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
      if (menuForm.id) {
        await updateDoc(doc(db, "universities", menuForm.universityId, "campuses", menuForm.campusId, "restaurants", menuForm.restaurantId, "menuItems", menuForm.id), {
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
        });
      } else {
        await addDoc(collection(db, "universities", menuForm.universityId, "campuses", menuForm.campusId, "restaurants", menuForm.restaurantId, "menuItems"), {
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
        });
      }
      setMenuForm({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save menu item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuEdit = (menu) => {
    setMenuForm(menu);
  };

  const handleMenuDelete = async (menu) => {
    showConfirmationDialog(
      "Delete Menu Item",
      `Are you sure you want to delete "${menu.name}" from the menu? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "universities", menu.universityId, "campuses", menu.campusId, "restaurants", menu.restaurantId, "menuItems", menu.id));
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

  // Mart item management
  const handleMartItemSubmit = async (e) => {
    e.preventDefault();
    if (!martItemForm.universityId || !martItemForm.campusId) {
      setError("Please select university and campus");
      return;
    }
    setLoading(true);
    try {
      if (martItemForm.id) {
        await updateDoc(doc(db, "universities", martItemForm.universityId, "campuses", martItemForm.campusId, "martItems", martItemForm.id), {
          name: martItemForm.name,
          price: parseFloat(martItemForm.price),
          description: martItemForm.description,
          category: martItemForm.category,
          stock: parseInt(martItemForm.stock),
        });
      } else {
        await addDoc(collection(db, "universities", martItemForm.universityId, "campuses", martItemForm.campusId, "martItems"), {
          name: martItemForm.name,
          price: parseFloat(martItemForm.price),
          description: martItemForm.description,
          category: martItemForm.category,
          stock: parseInt(martItemForm.stock),
        });
      }
      setMartItemForm({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", id: null });
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
          await deleteDoc(doc(db, "universities", item.universityId, "campuses", item.campusId, "martItems", item.id));
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

  // Domain management
  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    if (!domainForm.universityId || !domainForm.campusId) {
      setError("Please select a university and campus");
      return;
    }
    setLoading(true);
    try {
      if (domainForm.id) {
        await updateDoc(doc(db, "allowedDomains", domainForm.id), {
          name: domainForm.name,
          domain: domainForm.domain.startsWith('@') ? domainForm.domain : `@${domainForm.domain}`,
          universityId: domainForm.universityId,
          campusId: domainForm.campusId,
        });
      } else {
        await addDoc(collection(db, "allowedDomains"), {
          name: domainForm.name,
          domain: domainForm.domain.startsWith('@') ? domainForm.domain : `@${domainForm.domain}`,
          universityId: domainForm.universityId,
          campusId: domainForm.campusId,
        });
      }
      setDomainForm({ name: "", domain: "", universityId: "", campusId: "", id: null });
      fetchAllData();
    } catch (err) {
      setError("Failed to save domain");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainEdit = (domain) => {
    setDomainForm({
      ...domain,
      campusId: domain.campusId || ""
    });
  };

  const handleDomainDelete = async (id) => {
    const domain = domains.find(d => d.id === id);
    showConfirmationDialog(
      "Delete Domain",
      `Are you sure you want to delete domain "${domain?.name}" (${domain?.domain})? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "allowedDomains", id));
          fetchAllData();
        } catch (err) {
          setError("Failed to delete domain");
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

  // Statistics
  const getStats = () => {
    const totalCampuses = campuses.length;
    const totalRestaurants = allRestaurants.length;
    const totalMenuItems = allMenuItems.length;
    const totalMartItems = allMartItems.length;
    const totalUsers = users.length;
    const campusAdmins = users.filter(u => u.role === "campusAdmin").length;
    const superAdmins = users.filter(u => u.role === "superAdmin").length;
    const regularUsers = users.filter(u => u.role === "user").length;

    return {
      totalCampuses,
      totalRestaurants,
      totalMenuItems,
      totalMartItems,
      totalUsers,
      campusAdmins,
      superAdmins,
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
            <h1 className="text-center mb-4">🔧 Super Admin Dashboard</h1>
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
                  className={`nav-link ${activeTab === "domains" ? "active" : ""}`}
                  onClick={() => setActiveTab("domains")}
                >
                  Domain Management
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
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title">{university.name}</h5>
                            <p className="card-text text-muted">
                              ID: {university.id}
                            </p>
                              <div className="mb-3">
                              <span className="badge bg-primary">
                                  {universityCampuses.length} Campuses
                              </span>
                              </div>
                              
                              {/* Campuses for this university */}
                              <div className="mb-3">
                                <h6>Campuses:</h6>
                                {universityCampuses.length > 0 ? (
                                  <ul className="list-group list-group-flush">
                                    {universityCampuses.map(campus => (
                                      <li key={campus.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{campus.name}</span>
                                        <div>
                                          <button 
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => handleCampusEdit(campus)}
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleCampusDelete(campus)}
                                          >
                                            Delete
                              </button>
                            </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted">No campuses yet</p>
                                )}
                          </div>
                              
                              <div className="d-flex justify-content-between">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleUniversityEdit(university)}
                                >
                                  Edit University
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleUniversityDelete(university.id)}
                                >
                                  Delete University
                                </button>
                        </div>
                      </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="tab-pane fade show active">
                  <h3>User Management</h3>
                  
                  {/* Create User Form */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Create New User</h5>
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
                          <label className="form-label">Password</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            required
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
                            <option value="superAdmin">Super Admin</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">University</label>
                          <select
                            className="form-select"
                            value={userForm.universityId}
                            onChange={(e) => {
                              setUserForm({...userForm, universityId: e.target.value, campusId: ""});
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
                            onChange={(e) => setUserForm({...userForm, campusId: e.target.value})}
                            required
                            disabled={!userForm.universityId}
                          >
                            <option value="">Select Campus</option>
                            {getCampusesForUniversity(userForm.universityId).map(campus => (
                              <option key={campus.id} value={campus.id}>{campus.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <button type="submit" className="btn btn-primary w-100">
                            Create User
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="table-responsive">
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
                        {users.map(user => (
                          <tr key={user.id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={user.role || "user"}
                                onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                              >
                                <option value="user">User</option>
                                <option value="campusAdmin">Campus Admin</option>
                                <option value="superAdmin">Super Admin</option>
                              </select>
                            </td>
                            <td>{user.universityName || "N/A"}</td>
                            <td>{user.campusName || "N/A"}</td>
                            <td>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleUserDelete(user.id)}
                                disabled={user.role === "superAdmin" && user.id === userData?.uid}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {restaurantForm.id ? "Update Restaurant" : "Add Restaurant"}
                            </button>
                            {restaurantForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setRestaurantForm({ name: "", location: "", cuisine: "", universityId: "", campusId: "", id: null })}
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
                      <div key={`${restaurant.universityId}-${restaurant.campusId}-${restaurant.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-3">
                        <div className="card h-100">
                        <div className="card-body">
                            <h5 className="card-title">{restaurant.name}</h5>
                            <p className="card-text text-muted">
                              {restaurant.location} • {restaurant.cuisine}
                            </p>
                            <div className="mb-2">
                              <span className="badge bg-primary me-1">{restaurant.universityName}</span>
                              <span className="badge bg-secondary">{restaurant.campusName}</span>
                        </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                ID: {restaurant.id}
                              </small>
                              <div>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleRestaurantEdit(restaurant)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger me-1"
                                  onClick={() => handleRestaurantDelete(restaurant)}
                                >
                                  Delete
                                </button>

                      </div>
                    </div>
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
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {martItemForm.id ? "Update Mart Item" : "Add Mart Item"}
                            </button>
                            {martItemForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setMartItemForm({ name: "", price: "", description: "", category: "", stock: "", universityId: "", campusId: "", id: null })}
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
                      <div key={`${item.universityId}-${item.campusId}-${item.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-3">
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
                            <div className="mb-2">
                              <span className="badge bg-primary me-1">{item.universityName}</span>
                              <span className="badge bg-secondary">{item.campusName}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                ID: {item.id}
                              </small>
                              <div>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleMartItemEdit(item)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger me-1"
                                  onClick={() => handleMartItemDelete(item)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
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
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary me-2">
                              {menuForm.id ? "Update Menu Item" : "Add Menu Item"}
                            </button>
                            {menuForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setMenuForm({ name: "", price: "", description: "", universityId: "", campusId: "", restaurantId: "", id: null })}
                              >
                                Cancel
                              </button>
              )}
            </div>
          </div>
                      </form>
                    </div>
                  </div>

                  {/* Menu Items List */}
                  <div className="row">
                    {getFilteredMenuItems().map(item => (
                      <div key={`${item.universityId}-${item.campusId}-${item.restaurantId}-${item.id}`} className="col-md-6 col-lg-4 col-xl-3 mb-3">
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
                            {item.description && (
                              <p className="card-text text-muted small">{item.description}</p>
                            )}
                            <div className="mb-2">
                              <span className="badge bg-primary me-1">{item.universityName}</span>
                              <span className="badge bg-secondary me-1">{item.campusName}</span>
                              <span className="badge bg-info">{item.restaurantName}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                ID: {item.id}
                              </small>
                              <div>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleMenuEdit(item)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger me-1"
                                  onClick={() => handleMenuDelete(item)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
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

              {/* Domain Management Tab */}
              {activeTab === "domains" && (
                <div className="tab-pane fade show active">
                  <h3>Domain Management</h3>
                  <p className="text-muted mb-4">Manage allowed email domains for university signups</p>
                  
                  {/* Add Domain Form */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Add/Edit Domain</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleDomainSubmit}>
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">University</label>
                            <select
                              className="form-select"
                              value={domainForm.universityId}
                              onChange={(e) => setDomainForm({...domainForm, universityId: e.target.value, campusId: ""})}
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
                              value={domainForm.campusId}
                              onChange={(e) => setDomainForm({...domainForm, campusId: e.target.value})}
                              required
                              disabled={!domainForm.universityId}
                            >
                              <option value="">Select Campus</option>
                              {domainForm.universityId && getCampusesForUniversity(domainForm.universityId).map(campus => (
                                <option key={campus.id} value={campus.id}>{campus.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Domain Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., example.edu"
                              value={domainForm.name}
                              onChange={(e) => setDomainForm({...domainForm, name: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Email Domain</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., @example.edu"
                              value={domainForm.domain}
                              onChange={(e) => setDomainForm({...domainForm, domain: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            <button type="submit" className="btn btn-primary me-2">
                              {domainForm.id ? "Update" : "Add"} Domain
                            </button>
                            {domainForm.id && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => setDomainForm({ name: "", domain: "", universityId: "", campusId: "", id: null })}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Domains List */}
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>University</th>
                          <th>Campus</th>
                          <th>Domain Name</th>
                          <th>Email Domain</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.map(domain => (
                          <tr key={domain.id}>
                            <td>{universities.find(u => u.id === domain.universityId)?.name || "Unknown"}</td>
                            <td>{campuses.find(c => c.id === domain.campusId)?.name || "Unknown"}</td>
                            <td>{domain.name}</td>
                            <td>{domain.domain}</td>
                            <td>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {domains.length === 0 && (
                    <div className="text-center text-muted">
                      <p>No domains configured yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="tab-pane fade show active">
                  <SuperAdminDashboard />
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