const {google} = require('googleapis');

const loginToSheet = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({version: 'v4', auth});
};

module.exports = loginToSheet;
