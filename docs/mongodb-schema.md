# MongoDB Schema Design (Hungry Boys)

This document defines the MongoDB data model to migrate from Firebase/Firestore to MongoDB Atlas. It includes: collections, field definitions, example documents, JSON Schema validators, and index recommendations.

Assumptions
- Authentication: Keep Firebase Auth; use Firebase UID as users._id (string). Server verifies ID tokens.
- Denormalization: Store names alongside IDs for fast reads and fewer joins.
- Soft deletes: Prefer isActive/isDeleted flags over hard deletes when appropriate.

---

## Collections Overview
- users
- universities
- campuses
- restaurants
- menuItems
- martItems
- orders
- logs

---

## 1) users
Purpose: application users (students, campus admins, super admin). If using Firebase Auth, set _id = Firebase UID string.

Example
```
{
  _id: "UID_abc123",           // Firebase UID (string)
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+919876543210",
  role: "user",                // user | campusAdmin | superAdmin
  universityId: "uni_123",     // optional for superAdmin
  universityName: "ABC University",
  campusId: "camp_456",
  campusName: "Main Campus",
  hostelBlock: "A",
  roomNumber: "101",
  isActive: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z"),
  lastLogin: ISODate("2025-01-05T08:21:00Z")
}
```

Indexes
- unique: { email: 1 }
- { role: 1 }
- { campusId: 1 }

Validator (MongoDB JSON Schema)
```
{
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "email", "role", "createdAt"],
    properties: {
      _id: { bsonType: "string" },
      email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
      firstName: { bsonType: ["string", "null"] },
      lastName: { bsonType: ["string", "null"] },
      phone: { bsonType: ["string", "null"] },
      role: { enum: ["user", "campusAdmin", "superAdmin"] },
      universityId: { bsonType: ["string", "null"] },
      campusId: { bsonType: ["string", "null"] },
      isActive: { bsonType: "bool" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: ["date", "null"] },
      lastLogin: { bsonType: ["date", "null"] }
    }
  }
}
```

---

## 2) universities
Purpose: top-level institution info.

Example
```
{
  _id: "uni_123",
  name: "ABC University",
  location: "City, State",
  isActive: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

Indexes
- unique: { name: 1 }

---

## 3) campuses
Purpose: campuses belonging to a university.

Example
```
{
  _id: "camp_456",
  name: "Main Campus",
  universityId: "uni_123",
  universityName: "ABC University",
  location: "Area, City",
  isActive: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

Indexes
- { universityId: 1 }
- unique compound: { name: 1, universityId: 1 }

---

## 4) restaurants
Purpose: restaurants under a campus.

Example
```
{
  _id: "rest_789",
  name: "Campus Cafe",
  universityId: "uni_123",
  universityName: "ABC University",
  campusId: "camp_456",
  campusName: "Main Campus",
  openTime: "08:00",     // 24h HH:mm
  closeTime: "22:00",
  is24x7: false,
  isActive: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

Indexes
- { campusId: 1 }
- { universityId: 1 }

---

## 5) menuItems
Purpose: menu items sold by a restaurant.

Example
```
{
  _id: ObjectId("..."),
  name: "Chicken Biryani",
  price: 350,
  restaurantId: "rest_789",
  restaurantName: "Campus Cafe",
  campusId: "camp_456",
  campusName: "Main Campus",
  universityId: "uni_123",
  universityName: "ABC University",
  description: "Spicy biryani with raita",
  category: "Main Course",
  photoURL: "https://...",
  isAvailable: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

Indexes
- { restaurantId: 1 }
- { campusId: 1 }
- compound (dedupe aid): { name: 1, restaurantId: 1 }

Validator (JSON Schema)
```
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "price", "restaurantId", "createdAt"],
    properties: {
      name: { bsonType: "string" },
      price: { bsonType: "double" },
      restaurantId: { bsonType: "string" },
      photoURL: { bsonType: ["string", "null"] },
      isAvailable: { bsonType: ["bool", "null"] },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: ["date", "null"] }
    }
  }
}
```

---

## 6) martItems
Purpose: campus mart inventory items.

Example
```
{
  _id: ObjectId("..."),
  name: "Notebook",
  price: 50,
  campusId: "camp_456",
  campusName: "Main Campus",
  universityId: "uni_123",
  universityName: "ABC University",
  description: "A5 size",
  category: "Stationery",
  stock: 120,
  photoURL: "https://...",
  isAvailable: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

Indexes
- { campusId: 1 }
- optional: { name: 1, campusId: 1 }

---

## 7) orders (Google Sheets–compatible, without gender columns)
Purpose: mirror current order payload while dropping gender-specific fields for simpler storage and privacy.

Example (Sheets-aligned fields)
```
{
  _id: ObjectId("..."),

  // From Sheets headers / current backend
  universityName: "ABC University",
  campusName: "Main Campus",
  firstName: "John",
  lastName: "Doe",
  room: "Hall X - 101",
  phone: "0300-0000000",
  email: "john@example.com",
  gender: "male",                  // male | female
  persons: 2,
  deliveryCharge: 300,              // persons * per-person charge
  itemTotal: 1200,
  grandTotal: 1500,
  cartItems: "📍 Cafe A:...\n\n📍 Cafe B:...",  // human-friendly string
  timestamp: "Friday, October 24, 2025, 10:00:00 AM", // string (Asia/Karachi)
  accountTitle: "Maratib Ali",
  bankName: "SadaPay",
  screenshotURL: "https://res.cloudinary.com/...",
  specialInstruction: "Less spicy",

  // Recommended extra fields for backend panels (optional but useful)
  createdAt: ISODate("2025-10-24T10:00:00Z"),  // derive from timestamp
  universityId: "uni_123",                     // if available
  campusId: "camp_456",
  // status workflow (optional extension):
  status: "pending", // pending | accepted | preparing | ready | out-for-delivery | delivered | cancelled
}
```

Notes
- Fields align with your current app minus gender breakdown columns.
- Add `createdAt` as a Date for efficient querying and sorting.
- Optionally include `universityId`/`campusId` for reliable filtering in admin panels.

Indexes (Sheets-style querying + admin panels)
- { campusId: 1, createdAt: -1 }            // if campusId stored
- { campusName: 1, createdAt: -1 }          // fallback when only names exist
- { phone: 1, createdAt: -1 }
- Optional: text index on { cartItems: "text" }

Validator (light, Sheets-compatible)
```
{
  $jsonSchema: {
    bsonType: "object",
    required: ["universityName", "campusName", "firstName", "phone", "gender", "grandTotal", "createdAt"],
    properties: {
      universityName: { bsonType: "string" },
      campusName: { bsonType: "string" },
      firstName: { bsonType: "string" },
      lastName: { bsonType: ["string", "null"] },
      phone: { bsonType: "string" },
      email: { bsonType: ["string", "null"] },
      gender: { enum: ["male", "female"] },
      persons: { bsonType: ["int", "long"] },
      deliveryCharge: { bsonType: ["double", "int", "long", "decimal"] },
      itemTotal: { bsonType: ["double", "int", "long", "decimal"] },
      grandTotal: { bsonType: ["double", "int", "long", "decimal"] },
      cartItems: { bsonType: ["string", "null"] },
      timestamp: { bsonType: ["string", "null"] },
      accountTitle: { bsonType: ["string", "null"] },
      bankName: { bsonType: ["string", "null"] },
      screenshotURL: { bsonType: ["string", "null"] },
      specialInstruction: { bsonType: ["string", "null"] },
      createdAt: { bsonType: "date" },
      universityId: { bsonType: ["string", "null"] },
      campusId: { bsonType: ["string", "null"] },
      status: { enum: ["pending", "accepted", "preparing", "ready", "out-for-delivery", "delivered", "cancelled", null] }
    }
  }
}
```

---

## 8) logs
Purpose: immutable audit trail of important actions.

Example
```
{
  _id: ObjectId("..."),
  action: "order_status_changed",    // user_created | user_deleted | order_created | order_status_changed | menu_item_added | menu_item_updated | ...
  performedBy: "UID_admin",
  performerRole: "campusAdmin",
  performerEmail: "admin@abc.edu",

  targetType: "order",               // user | order | restaurant | menuItem | campus | university
  targetId: "ORD-20251024-001",
  targetDetails: { statusFrom: "pending", statusTo: "accepted" },

  universityId: "uni_123",
  campusId: "camp_456",

  changes: { before: { status: "pending" }, after: { status: "accepted" } },

  timestamp: ISODate("2025-10-24T10:05:00Z"),
  ipAddress: "203.0.113.10",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
```

Indexes
- { timestamp: -1 }
- { performedBy: 1, timestamp: -1 }
- { action: 1, timestamp: -1 }
- { targetType: 1, targetId: 1 }

---

## Collection Creation with Validators (reference)
Use validators when creating collections to enforce structure.

Shell snippet (Compass or mongosh):
```
db.createCollection("users", { validator: { /* users JSON schema here */ } })
db.createCollection("menuItems", { validator: { /* menuItems JSON schema here */ } })
db.createCollection("orders", { validator: { /* orders JSON schema here */ } })
```

Create indexes (examples):
```
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ campusId: 1 })

db.campuses.createIndex({ universityId: 1 })
db.campuses.createIndex({ name: 1, universityId: 1 }, { unique: true })

db.restaurants.createIndex({ campusId: 1 })
db.restaurants.createIndex({ universityId: 1 })

db.menuItems.createIndex({ restaurantId: 1 })
db.menuItems.createIndex({ campusId: 1 })
db.menuItems.createIndex({ name: 1, restaurantId: 1 })

db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ campusId: 1, status: 1, createdAt: -1 })

db.orders.createIndex({ restaurantId: 1, status: 1 })

db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ performedBy: 1, timestamp: -1 })
db.logs.createIndex({ action: 1, timestamp: -1 })
db.logs.createIndex({ targetType: 1, targetId: 1 })
```

---

## Notes & Best Practices
- Keep createdAt/updatedAt maintained from the backend.
- Use transactions for multi-document critical updates (e.g., moving inventory + creating order).
- For large imports, use bulkWrite.
- Consider change streams + WebSockets for real-time order updates.
- Backup & retention: enable Atlas backups; export logs periodically if needed.

---

## Migration Mapping (Firestore → MongoDB)
- universities → universities
- universities/{u}/campuses → campuses (with universityId)
- campuses/{c}/restaurants → restaurants (with campusId, universityId)
- restaurants/{r}/menuItems → menuItems (with restaurantId, campusId, universityId)
- campuses/{c}/martItems → martItems (with campusId, universityId)
- users → users (keep UID as _id)
- orders (Sheets/endpoint) → orders

---

End of document.
