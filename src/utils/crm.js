// Utilities to compute CRM datasets from orders, without backend changes

// Count per status
export function buildStatusCounts(orders) {
  const counts = {};
  (orders || []).forEach(o => {
    const s = o.status || 'pending';
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

// Time-series for last N days: orders count and revenue
export function buildDailySeries(orders, days = 14) {
  const end = new Date();
  const labels = [];
  const counts = new Array(days).fill(0);
  const revenue = new Array(days).fill(0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
  }

  (orders || []).forEach(o => {
    const created = new Date(o.createdAt);
    const diffDays = Math.floor((end.setHours(0,0,0,0) - new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime()) / (1000*60*60*24));
    const idx = days - 1 - diffDays;
    if (idx >= 0 && idx < days) {
      counts[idx] += 1;
      revenue[idx] += Number(o.grandTotal || 0);
    }
  });

  return { labels, counts, revenue };
}

// Delivered revenue vs receivable (not yet delivered)
export function buildCollectionSplit(orders) {
  let delivered = 0;
  let total = 0;
  (orders || []).forEach(o => {
    const amt = Number(o.grandTotal || 0);
    total += amt;
    if (o.status === 'delivered') delivered += amt;
  });
  const receivable = Math.max(total - delivered, 0);
  return { delivered, receivable };
}

// Delivered rate and counts
export function buildDeliveredStats(orders) {
  const total = (orders || []).length;
  const deliveredCount = (orders || []).filter(o => o.status === 'delivered').length;
  const rate = total ? (deliveredCount / total) : 0;
  const { delivered, receivable } = buildCollectionSplit(orders);
  return { deliveredCount, total, rate, deliveredAmount: delivered, receivableAmount: receivable };
}

// Aggregate orders by hour of day over the last N days
export function buildHourlyCounts(orders, days = 7) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0,0,0,0);
  const counts = new Array(24).fill(0);
  (orders || []).forEach(o => {
    const created = new Date(o.createdAt);
    if (created >= start && created <= end) {
      counts[created.getHours()] += 1;
    }
  });
  return counts;
}

// Top restaurants by revenue, fallback to names from restaurantNames if cartItemsArray missing
export function buildTopRestaurants(orders, topN = 5) {
  const revenueByRestaurant = {};
  (orders || []).forEach(o => {
    if (Array.isArray(o.cartItemsArray) && o.cartItemsArray.length) {
      o.cartItemsArray.forEach(it => {
        const name = it.restaurantName || it.restaurantId || 'Unknown';
        const amt = Number(it.price || 0) * Number(it.quantity || 1);
        revenueByRestaurant[name] = (revenueByRestaurant[name] || 0) + amt;
      });
    } else if (Array.isArray(o.restaurantNames) && o.restaurantNames.length) {
      const share = Number(o.grandTotal || 0) / o.restaurantNames.length;
      o.restaurantNames.forEach(name => {
        const key = name || 'Unknown';
        revenueByRestaurant[key] = (revenueByRestaurant[key] || 0) + share;
      });
    }
  });
  const entries = Object.entries(revenueByRestaurant).sort((a,b) => b[1] - a[1]).slice(0, topN);
  return { labels: entries.map(e => e[0]), values: entries.map(e => Math.round(e[1])) };
}

// Top items by quantity for a specific restaurant (for Restaurant Manager CRM)
export function buildTopItemsForRestaurant(orders, topN = 5) {
  const qtyByItem = {};
  (orders || []).forEach(o => {
    if (Array.isArray(o.cartItems) && o.cartItems.length) {
      o.cartItems.forEach(it => {
        const name = it.name || it.itemName || 'Item';
        qtyByItem[name] = (qtyByItem[name] || 0) + Number(it.quantity || 1);
      });
    } else if (Array.isArray(o.cartItemsArray) && o.cartItemsArray.length) {
      // fallback
      o.cartItemsArray.forEach(it => {
        const name = it.name || it.itemName || 'Item';
        qtyByItem[name] = (qtyByItem[name] || 0) + Number(it.quantity || 1);
      });
    }
  });
  const entries = Object.entries(qtyByItem).sort((a,b) => b[1] - a[1]).slice(0, topN);
  return { labels: entries.map(e => e[0]), values: entries.map(e => e[1]) };
}

// Orders by Day of Week with configurable period
export function buildOrdersByDay(orders, period = '7days') {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  let startDate, numDays, labels = [], counts = [];
  
  switch(period) {
    case '1day':
      numDays = 1;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      numDays = 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0,0,0,0);
      break;
    case '1month':
      numDays = 30;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0,0,0,0);
      break;
    case '6months':
      numDays = 180;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 179);
      startDate.setHours(0,0,0,0);
      break;
    case '1year':
      numDays = 365;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 364);
      startDate.setHours(0,0,0,0);
      break;
    case 'all':
    default:
      // Find oldest order date
      const oldestOrder = (orders || []).reduce((oldest, o) => {
        const created = new Date(o.createdAt);
        return !oldest || created < oldest ? created : oldest;
      }, null);
      
      if (oldestOrder) {
        startDate = new Date(oldestOrder);
        startDate.setHours(0,0,0,0);
        numDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;
      } else {
        numDays = 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0,0,0,0);
      }
      break;
  }
  
  // Initialize arrays
  counts = new Array(numDays).fill(0);
  
  // Generate labels
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (numDays <= 7) {
      labels.push(`${days[d.getDay()]} ${d.getDate()}`);
    } else if (numDays <= 30) {
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    } else if (numDays <= 180) {
      // Show week ranges for 6 months
      if (i % 7 === 0 || i === numDays - 1) {
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      } else {
        labels.push('');
      }
    } else {
      // Show month ranges for 1 year or all time
      if (i % 30 === 0 || i === numDays - 1) {
        labels.push(`${d.getMonth() + 1}/${d.getFullYear().toString().substr(2)}`);
      } else {
        labels.push('');
      }
    }
  }
  
  // Count orders per day
  (orders || []).forEach(o => {
    const created = new Date(o.createdAt);
    if (created >= startDate) {
      const diffDays = Math.floor((created.getTime() - startDate.getTime()) / (1000*60*60*24));
      if (diffDays >= 0 && diffDays < numDays) {
        counts[diffDays] += 1;
      }
    }
  });
  
  return { labels, counts };
}

// Deliveries by time period
export function buildDeliveriesByPeriod(orders, period = '1day') {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case '1day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0,0,0,0);
      break;
    case '1month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '6months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      startDate.setHours(0,0,0,0);
      break;
    case '1year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      startDate = new Date(0); // Beginning of time
      break;
  }
  
  let totalDeliveries = 0;
  let totalOrders = 0;
  
  (orders || []).forEach(o => {
    const created = new Date(o.createdAt);
    if (created >= startDate) {
      totalOrders += 1;
      totalDeliveries += Number(o.persons || 0);
    }
  });
  
  return { totalDeliveries, totalOrders };
}
