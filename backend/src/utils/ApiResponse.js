/**
 * Standardize API Response
 * @param {Response} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Boolean} success - Success status
 * @param {Object} data - Data to send
 * @param {String} message - Optional message
 */
const sendResponse = (res, statusCode, success, data = null, message = null) => {
    const response = {
        success,
    };

    if (message) response.message = message;
    if (data) response.data = data;

    res.status(statusCode).json(response);
};

module.exports = sendResponse;
