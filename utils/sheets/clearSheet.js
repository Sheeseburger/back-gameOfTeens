const clearSheet = async (sheets, spreadsheetId, sheetName) => {
  const range = `${sheetName}!A:Z`;
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range
  });
};
module.exports = clearSheet;
