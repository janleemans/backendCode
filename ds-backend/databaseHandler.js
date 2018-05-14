const mysql = require('mysql');

const dbPassword = 'welcome1';//"Welcome1!";
const dbUserName = "root";

// the connect string will get it's value from the ACCS
// binding, if you are running locally you need to
// make sure you have a thunnel as per below
//const connectString = process.env.MYSQLCS_CONNECT_STRING
        //|| "127.0.0.1:3306/deathstar";

const databaseUrl = `${JSON.stringify(process.env.OCCS_HOSTIPS)}`.split('public_ip: ')[1].split('"')[0];

const connectString = `${databaseUrl}:3306`;

const host = connectString.split(":")[0];
const user = process.env.MYSQLCS_USER_NAME || dbUserName;
const password = process.env.MYSQLCS_USER_PASSWORD || dbPassword;
const database = "deathstar"; //connectString.split("/")[1];

const connectionJson = {
    host: host,
    user: user,
    password: password,
    database: database,
    timezone: 'utc',
    connectionLimit: 10
};

console.log(JSON.stringify(connectionJson));

const pool = mysql.createPool(connectionJson);

module.exports = pool;
