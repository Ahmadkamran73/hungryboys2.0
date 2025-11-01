# Restaurant Image Debug Guide

## Issue
Restaurant images are NOT showing on RestaurantCard, but MenuItemCard images work fine.

## What I've Done

### 1. Added Debug Logging
- **RestaurantCard.jsx**: Added `console.log` to see what photoURL value the card receives
- **Restaurants.jsx**: Added `console.log` to see what data is fetched from API

### 2. Image Rendering Pattern (Matches MenuItemCard)
- **Before**: RestaurantCard used CSS `backgroundImage` (no error handling)
- **After**: RestaurantCard now uses `<img>` tag with `onError` fallback (same as MenuItemCard)
- **CSS**: Added `.restaurant-card-bg` with `object-fit: cover` and proper z-index

### 3. Data Flow Analysis

#### MenuItemCard (WORKING ✅)
```
Database → Backend GET /api/menu-items → Frontend MenuPage → MenuItemCard
- Backend returns: photoURL: m.photoURL
- Frontend maps: photoURL: d.photoURL
- Card receives: photoURL prop
- Card renders: <img src={photoURL} onError={hide} />
```

#### RestaurantCard (NOT WORKING ❌)
```
Database → Backend GET /api/restaurants → Frontend Restaurants → RestaurantCard
- Backend returns: photoURL: r.photoURL || r.imageUrl || null
- Frontend maps: photoURL: r.photoURL || r.imageUrl || r.photoUrl || r.imageURL || null
- Card receives: photoURL prop
- Card renders: <img src={photoURL} onError={hide} />
```

## Checklist to Debug

### Step 1: Check Browser Console
Open http://localhost:5173/restaurants and check console for:
```
Restaurants fetched and normalized: [...]
RestaurantCard "Tariq Pulao": photoURL = ...
```

**Expected:**
- If photoURL is `null` or `undefined` → Database doesn't have the field
- If photoURL is a string → Check if URL is valid

### Step 2: Check Network Tab
1. Open DevTools → Network → XHR
2. Find request to `/api/restaurants?campusId=...`
3. Look at Response JSON
4. Find "Tariq Pulao" entry
5. Check if it has `photoURL` field with a valid URL

**Expected:**
```json
{
  "id": "...",
  "name": "Tariq Pulao",
  "photoURL": "https://res.cloudinary.com/...",
  ...
}
```

### Step 3: Verify Database (If You Have Access)
Connect to MongoDB and run:
```js
db.restaurants.findOne({ name: "Tariq Pulao" })
```

**Check if it has:**
- `photoURL` field with Cloudinary URL
- OR `imageUrl` field (old schema)

### Step 4: Re-upload Image (Super Admin)
1. Go to Super Admin → "All Restaurants" tab
2. Find "Tariq Pulao" → Click "Edit"
3. Use "Restaurant Image" file input to upload a new image
4. Save
5. Refresh Restaurants page

## Code Changes Made

### RestaurantCard.jsx
```jsx
// Base gradient background
const headerStyle = { background: getGradient(name) };

// In JSX:
<div className="restaurant-card-header" style={headerStyle}>
  {photoURL && (
    <img
      src={photoURL}
      alt=""
      className="restaurant-card-bg"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  )}
  <div className="restaurant-card-overlay">
    {/* Status badge and icon */}
  </div>
</div>
```

### RestaurantCard.css
```css
.restaurant-card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.restaurant-card-overlay {
  /* ...existing styles... */
  z-index: 1; /* Above the image */
}
```

### backend/index.js (GET /api/restaurants)
```javascript
const normalized = items.map(r => ({
  id: String(r._id),
  // ... other fields ...
  photoURL: r.photoURL || r.imageUrl || null // Fallback for old data
}));
```

### Restaurants.jsx
```javascript
const normalized = (Array.isArray(data) ? data : []).map(r => ({
  ...r,
  photoURL: r.photoURL || r.imageUrl || r.photoUrl || r.imageURL || null,
}));
```

## Most Likely Cause

**The database record for "Tariq Pulao" does NOT have a photoURL field saved.**

### Why?
- You may have uploaded the image in Super Admin, but:
  1. The upload to Cloudinary failed silently
  2. The form didn't save the photoURL to the database
  3. The record existed before photoURL field was added

### Solution
1. In Super Admin, edit "Tariq Pulao"
2. Re-select the image file
3. Save (this will upload to Cloudinary and save photoURL)
4. Check Network tab to confirm PATCH request includes photoURL
5. Refresh Restaurants page

## If Still Not Working

Run this test in browser console on Restaurants page:
```javascript
// Check what the card receives
const cards = document.querySelectorAll('.restaurant-card');
cards.forEach(card => {
  const name = card.querySelector('.restaurant-name').textContent;
  const img = card.querySelector('.restaurant-card-bg');
  console.log(name, '→ img:', img, 'src:', img?.src);
});
```

This will show if the `<img>` element exists and what src it has.

## Contact Points
- Backend API: `/api/restaurants` (line 812 in backend/index.js)
- Frontend fetch: `src/pages/Restaurants.jsx` (line 30-50)
- Card component: `src/components/RestaurantCard.jsx`
- Upload logic: `src/pages/SuperAdmin.jsx` (handleRestaurantSubmit, line 506)
