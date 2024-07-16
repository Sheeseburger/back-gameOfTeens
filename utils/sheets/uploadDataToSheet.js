const createSheetIfNotExists = require('./createSheetIfNotExist');
const loginToSheet = require('./loginToSheet');

const uploadDataToSheet = async (sheetData, name, spreadsheetId) => {
  const sheets = loginToSheet();

  const resource = {
    values: sheetData
  };

  try {
    await createSheetIfNotExists(sheets, spreadsheetId, name);
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: name,
      valueInputOption: 'RAW',
      resource: resource
    });
    return result.data.updates.updatedCells;
  } catch (err) {
    console.error('Error uploading data to sheet:', err);
  }
};

module.exports = uploadDataToSheet;
