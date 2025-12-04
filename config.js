const host = process.env.DB_HOST || 'localhost';
const database = process.env.DB_NAME || 'saas95';
const user = process.env.DB_USER || '';
const password = process.env.DB_PASSWORD || '';

const site_url = process.env.SITE_URL || 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

module.exports = {host, database, user, password, site_url, port};

