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
