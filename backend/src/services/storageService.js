const fs = require('fs');
const path = require('path');

class StorageService {
    async deleteFile(filepath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filepath, (err) => {
                if (err) resolve(false); // resolve false if file not found or other error, don't crash
                else resolve(true);
            });
        });
    }
}

module.exports = new StorageService();
