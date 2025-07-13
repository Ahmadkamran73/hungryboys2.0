import React from "react";
import { useUniversity } from "../context/UniversityContext";
import UniversitySelector from "../components/UniversitySelector";

const Demo = () => {
  const {
    universities,
    campuses,
    selectedUniversity,
    selectedCampus,
    loading
  } = useUniversity();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card" style={{ backgroundColor: '#0d0d0d', color: '#ffffff', border: '2px solid #e4002b' }}>
            <div className="card-body">
              <h2 className="card-title text-center mb-4" style={{ color: '#e4002b' }}>
                🎓 University & Campus Selector Demo
              </h2>
              
              <div className="text-center mb-4">
                <UniversitySelector />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#e4002b' }}>Current Selection</h5>
                      <div className="mb-2">
                        <strong>University:</strong> {selectedUniversity ? selectedUniversity.name : 'None selected'}
                      </div>
                      <div className="mb-2">
                        <strong>Campus:</strong> {selectedCampus ? selectedCampus.name : 'None selected'}
                      </div>
                      <div className="mb-2">
                        <strong>University ID:</strong> {selectedUniversity ? selectedUniversity.id : 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Campus ID:</strong> {selectedCampus ? selectedCampus.id : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#e4002b' }}>Available Data</h5>
                      <div className="mb-2">
                        <strong>Universities:</strong> {universities.length}
                      </div>
                      <div className="mb-2">
                        <strong>Campuses:</strong> {campuses.length}
                      </div>
                      <div className="mb-2">
                        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h5 style={{ color: '#e4002b' }}>How to Use in Your Components:</h5>
                <div className="bg-dark p-3 rounded">
                  <code style={{ color: '#00ff00' }}>
                    {`import { useUniversity } from "../context/UniversityContext";

const MyComponent = () => {
  const {
    selectedUniversity,
    selectedCampus,
    setSelectedUniversity,
    setSelectedCampus
  } = useUniversity();

  // Access selected values
  const universityId = selectedUniversity?.id;
  const campusId = selectedCampus?.id;
  
  // Use in your logic
  
};`}
                  </code>
                </div>
              </div>

              <div className="mt-4">
                <h5 style={{ color: '#e4002b' }}>Features:</h5>
                <ul>
                  <li>✅ Nested dropdown selection (University → Campus)</li>
                  <li>✅ Global state management with React Context</li>
                  <li>✅ Persistent storage in localStorage</li>
                  <li>✅ Dark theme styling matching your design</li>
                  <li>✅ Loading states and error handling</li>
                  <li>✅ Responsive design</li>
                  <li>✅ Clear selection option</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo; 