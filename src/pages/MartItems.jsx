import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useUniversity } from "../context/UniversityContext";
import MartItemCard from "../components/MartItemCard";
import SearchBar from "../components/SearchBar";
import FloatingCartButton from "../components/FloatingCartButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/MartItems.css";

const MartItems = () => {
  const [martItems, setMartItems] = useState([]);
  const [filteredMartItems, setFilteredMartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedUniversity, selectedCampus } = useUniversity();

  useEffect(() => {
    const fetchMartItems = async () => {
      if (!selectedUniversity || !selectedCampus) {
        setMartItems([]);
        setFilteredMartItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch mart items for the selected campus
        const martItemsRef = collection(
          db, 
          "universities", 
          selectedUniversity.id, 
          "campuses", 
          selectedCampus.id, 
          "martItems"
        );
        
        const querySnapshot = await getDocs(martItemsRef);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMartItems(data);
        setFilteredMartItems(data);
      } catch (err) {
        const handledError = handleError(err, 'MartItems - fetchMartItems');
        setError(handledError.message);
        console.error("Error fetching mart items:", handledError);
      } finally {
        setLoading(false);
      }
    };

    fetchMartItems();
  }, [selectedUniversity, selectedCampus]);

  // Filter mart items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMartItems(martItems);
    } else {
      const filtered = martItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMartItems(filtered);
    }
  }, [searchTerm, martItems]);

  // Show message if no university/campus is selected
  if (!selectedUniversity || !selectedCampus) {
    return (
      <div className="mart-items-page">
        <div className="container">
          <div className="text-center mt-5">
            <h3 className="text-muted">
              {!selectedUniversity 
                ? "Please select a university and campus to view mart items"
                : "Please select a campus to view mart items"
              }
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mart-items-page">
        <LoadingSpinner message="Loading Mart Items..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mart-items-page text-center text-danger mt-5">
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div className="mart-items-page">
      <div className="container">
        <h1 className="text-center fw-bold mb-5 mart-items-title">
          Mart Items at {selectedCampus.name}
        </h1>
        <div className="text-center mb-4">
          <p className="text-muted">
            {selectedUniversity.name} - {selectedCampus.name}
          </p>
        </div>
        
        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search mart items by name, category, or description..."
        />
        
        {filteredMartItems.length === 0 ? (
          <div className="text-center mt-5">
            {searchTerm ? (
              <>
                <h4 className="text-muted">No mart items found matching "{searchTerm}"</h4>
                <p className="text-muted">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <h4 className="text-muted">No mart items available at this campus</h4>
                <p className="text-muted">Check back later for new items!</p>
              </>
            )}
          </div>
        ) : (
          <div className="row g-4 justify-content-center">
            {filteredMartItems.map(item => (
              <div
                key={item.id}
                className="col-6 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
              >
                                  <MartItemCard
                    name={item.name}
                    price={item.price}
                    description={item.description}
                    category={item.category}
                    stock={item.stock}
                    photoURL={item.photoURL}
                    campusId={selectedCampus?.id}
                  />
              </div>
            ))}
          </div>
        )}
      </div>
      <FloatingCartButton />
    </div>
  );
};

export default MartItems; 