const db = require('../config/db');

// Record a Sale
const recordSale = async (itemId, quantity, customerName) => {
  const [result] = await db.execute('INSERT INTO sales (item_id, quantity, customer_name) VALUES (?, ?, ?)', [itemId, quantity, customerName]);
  return result.insertId;
};

// Get Sales Report
const getSalesReport = async () => {
  const [rows] = await db.execute('SELECT * FROM sales');
  return rows;
};

module.exports = {
  recordSale,
  getSalesReport,
};