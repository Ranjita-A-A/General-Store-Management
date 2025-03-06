const saleModel = require('../models/saleModel');

// Record a Sale
const recordSale = async (req, res) => {
  const { itemId, quantity, customerName } = req.body;

  if (!itemId || !quantity || !customerName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newSaleId = await saleModel.recordSale(itemId, quantity, customerName);
    res.status(201).json({ id: newSaleId, itemId, quantity, customerName });
  } catch (error) {
    res.status(500).json({ message: 'Error recording sale', error });
  }
};

// Get Sales Report
const getSalesReport = async (req, res) => {
  try {
    const report = await saleModel.getSalesReport();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales report', error });
  }
};

module.exports = {
  recordSale,
  getSalesReport,
};