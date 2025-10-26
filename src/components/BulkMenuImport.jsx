import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../utils/api";

const BulkMenuImport = ({ universityId, campusId, restaurantId: propRestaurantId, restaurants = [], onComplete }) => {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(propRestaurantId || "");
  const [parsedRows, setParsedRows] = useState(null); // valid rows parsed from file
  const { user } = useAuth();

  useEffect(() => {
    if (propRestaurantId) setSelectedRestaurantId(propRestaurantId);
  }, [propRestaurantId]);

  const parseFile = async (file) => {
    setLoading(true);
    setMessage("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('No sheets found in the file');

      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!Array.isArray(rows) || rows.length === 0) {
        setMessage('No rows found in the sheet');
        setParsedRows(null);
        setLoading(false);
        return;
      }

      // Normalize header names: look for name/title/item and price/cost
      const normalized = rows.map((r) => {
        const keys = Object.keys(r);
        const row = {};
        for (const k of keys) {
          const kk = k.toString().trim().toLowerCase();
          if (kk.includes('name') || kk.includes('item')) row.name = r[k];
          else if (kk.includes('price') || kk.includes('cost')) row.price = r[k];
        }
        return row;
      });

      // Filter valid rows (require name and price)
      const validRows = normalized.filter(r => r.name && (r.price !== undefined && r.price !== null && String(r.price).trim() !== ''));
      if (validRows.length === 0) {
        setMessage('No valid rows with name and price found. Make sure columns are named (Name, Price)');
        setParsedRows(null);
        setLoading(false);
        return;
      }

      setParsedRows(validRows);
      setMessage(`Parsed ${validRows.length} valid rows. Click Confirm to import.`);
    } catch (err) {
      console.error('Bulk parse failed', err);
      setMessage('Failed to parse file: ' + (err.message || err));
      setParsedRows(null);
    } finally {
      setLoading(false);
    }
  };

  const uploadParsedRows = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    const targetRestaurantId = selectedRestaurantId;
    if (!universityId || !campusId || !targetRestaurantId) {
      setMessage('University/Campus/Restaurant selection is required to import.');
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const idToken = user ? await user.getIdToken() : null;
      await axios.post(`${BASE_URL}/api/menu-items/bulk`, {
        restaurantId: targetRestaurantId,
        campusId,
        items: parsedRows.map(r => ({ name: String(r.name).trim(), price: parseFloat(r.price) || 0 }))
      }, {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {}
      });
      setMessage(`Imported ${parsedRows.length} items successfully.`);
      setFileName("");
      setParsedRows(null);
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      console.error('Bulk import failed', err);
      setMessage('Failed to import file: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    await parseFile(file);
    // reset input (so same file can be re-selected if needed)
    e.target.value = null;
  };

  return (
    <div className="bulk-import mb-4">
      <h6>Bulk Import Menu Items</h6>
      <p className="text-muted small">Select a restaurant, then upload an Excel/CSV file with columns: Name, Price (headers are case-insensitive).</p>

      <div className="row g-2 align-items-center mb-2">
        <div className="col-auto">
          {restaurants && restaurants.length > 0 ? (
            <select className="form-select" value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)}>
              <option value="">Select Restaurant</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input type="text" className="form-control" value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)} placeholder="Enter restaurant ID" />
          )}
        </div>

        <div className="col-auto">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={!selectedRestaurantId || loading} />
        </div>
      </div>

      {loading && <div className="text-muted">Processing...</div>}

      {fileName && <div className="mt-2"><strong>File:</strong> {fileName}</div>}

      {parsedRows && (
        <div className="mt-3">
          <div className="alert alert-warning">Parsed <strong>{parsedRows.length}</strong> rows. Review and click <strong>Confirm Import</strong> to proceed.</div>
          <div>
            <button className="btn btn-danger me-2" onClick={() => uploadParsedRows()} disabled={loading}>Confirm Import</button>
            <button className="btn btn-outline-secondary" onClick={() => { setParsedRows(null); setFileName(''); setMessage('Import cancelled'); }}>Cancel</button>
          </div>
        </div>
      )}

      {message && <div className="mt-2 alert alert-info py-2">{message}</div>}
    </div>
  );
};

export default BulkMenuImport;
