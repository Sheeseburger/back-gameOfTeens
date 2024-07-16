async function createSheetIfNotExists(sheets, spreadsheetId, sheetTitle) {
  const {data} = await sheets.spreadsheets.get({
    spreadsheetId
  });

  const sheetExists = data.sheets.some(sheet => sheet.properties.title === sheetTitle);

  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle
              }
            }
          }
        ]
      }
    });
  }
}
module.exports = createSheetIfNotExists;
