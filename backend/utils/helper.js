// utils/helper.js

// Function to format currency in Indian Rupees
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Function to create a standard API response
const createResponse = (status, data, message = '') => {
    return {
        status,
        data,
        message,
    };
};

// Function to validate if a value is a number
const isNumber = (value) => {
    return typeof value === 'number' && !isNaN(value);
};

// Function to validate required fields in a request
const validateRequiredFields = (fields, reqBody) => {
    const missingFields = fields.filter(field => !reqBody[field]);
    return missingFields.length > 0 ? missingFields : null;
};

// Function to calculate remaining stock alert
const checkStockAlert = (quantity) => {
    return quantity < 10 ? `Low stock alert! Only ${quantity} units remaining.` : null;
};

module.exports = {
    formatCurrency,
    createResponse,
    isNumber,
    validateRequiredFields,
    checkStockAlert,
};
