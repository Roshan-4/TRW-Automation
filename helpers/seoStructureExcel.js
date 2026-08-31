const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const REPORT_PATH = path.resolve(__dirname, '../artifacts/seo-structure-report.xlsx');

const STATUS_FILL = {
  Match: 'C6EFCE',
  Changed: 'FFEB9C',
  'Missing on live page': 'FFC7CE',
  'Extra on live page': 'FFC7CE',
  Fail: 'FFC7CE',
  Pass: 'C6EFCE',
};

const applyStatus = (cell, result) => {
  const hex = STATUS_FILL[result];
  if (!hex) {
    return;
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${hex}` },
  };
};

const ensureSheet = (workbook, name, columns) => {
  let sheet = workbook.getWorksheet(name);
  if (!sheet) {
    sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
  }
  return sheet;
};

const removeRowsForPage = (sheet, pageKey, lang) => {
  const toDelete = [];
  sheet.eachRow((row, number) => {
    if (number === 1) {
      return;
    }
    if (row.getCell(1).value === pageKey && row.getCell(2).value === lang) {
      toDelete.push(number);
    }
  });
  toDelete.reverse().forEach((number) => sheet.spliceRows(number, 1));
};

/**
 * Merge this Cypress invocation's comparisons into artifacts/seo-structure-report.xlsx.
 * One Summary row per page+language, plus page-wise Expected vs Actual rows.
 */
const writeSeoStructureExcel = async (records) => {
  if (!records || !records.length) {
    return REPORT_PATH;
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(REPORT_PATH)) {
    await workbook.xlsx.readFile(REPORT_PATH);
  }

  const summary = ensureSheet(workbook, 'Summary', [
    { header: 'Page key', key: 'pageKey', width: 22 },
    { header: 'Language', key: 'lang', width: 12 },
    { header: 'Page', key: 'pageLabel', width: 36 },
    { header: 'URL', key: 'path', width: 40 },
    { header: 'Headings result', key: 'headingsResult', width: 16 },
    { header: 'FAQ result', key: 'faqResult', width: 16 },
    { header: 'Missing headings', key: 'missingHeadings', width: 50 },
    { header: 'Extra headings', key: 'extraHeadings', width: 50 },
    { header: 'Snapshot file', key: 'dataFile', width: 48 },
  ]);

  const headings = ensureSheet(workbook, 'Headings (page-wise)', [
    { header: 'Page key', key: 'pageKey', width: 22 },
    { header: 'Language', key: 'lang', width: 12 },
    { header: 'Page', key: 'pageLabel', width: 36 },
    { header: '#', key: 'index', width: 6 },
    { header: 'Expected tag', key: 'expectedTag', width: 14 },
    { header: 'Expected heading (test data)', key: 'expectedText', width: 60 },
    { header: 'Actual tag', key: 'actualTag', width: 14 },
    { header: 'Actual heading (live page)', key: 'actualText', width: 60 },
    { header: 'Result', key: 'result', width: 22 },
  ]);

  const faqs = ensureSheet(workbook, 'FAQ (page-wise)', [
    { header: 'Page key', key: 'pageKey', width: 22 },
    { header: 'Language', key: 'lang', width: 12 },
    { header: 'Page', key: 'pageLabel', width: 36 },
    { header: '#', key: 'index', width: 6 },
    { header: 'Expected question (test data)', key: 'expectedText', width: 60 },
    { header: 'Actual question (live page)', key: 'actualText', width: 60 },
    { header: 'Result', key: 'result', width: 22 },
    { header: 'Expected FAQ heading', key: 'expectedHeading', width: 40 },
    { header: 'Actual FAQ heading', key: 'actualHeading', width: 40 },
  ]);

  records.forEach((record) => {
    removeRowsForPage(summary, record.pageKey, record.lang);
    removeRowsForPage(headings, record.pageKey, record.lang);
    removeRowsForPage(faqs, record.pageKey, record.lang);

    const summaryRow = summary.addRow({
      pageKey: record.pageKey,
      lang: record.lang,
      pageLabel: record.pageLabel,
      path: record.path,
      headingsResult: record.headingsMatched ? 'Pass' : 'Fail',
      faqResult: record.faqMatched ? 'Pass' : 'Fail',
      missingHeadings: (record.missingHeadings || []).join(' | '),
      extraHeadings: (record.extraHeadings || []).join(' | '),
      dataFile: record.dataFile,
    });
    applyStatus(summaryRow.getCell(5), record.headingsMatched ? 'Pass' : 'Fail');
    applyStatus(summaryRow.getCell(6), record.faqMatched ? 'Pass' : 'Fail');

    (record.headingRows || []).forEach((row) => {
      const headingRow = headings.addRow({
        pageKey: record.pageKey,
        lang: record.lang,
        pageLabel: record.pageLabel,
        index: row.index,
        expectedTag: row.expectedTag,
        expectedText: row.expectedText,
        actualTag: row.actualTag,
        actualText: row.actualText,
        result: row.result,
      });
      applyStatus(headingRow.getCell(9), row.result);
    });

    (record.faqRows || []).forEach((row) => {
      const faqRow = faqs.addRow({
        pageKey: record.pageKey,
        lang: record.lang,
        pageLabel: record.pageLabel,
        index: row.index,
        expectedText: row.expectedText,
        actualText: row.actualText,
        result: row.result,
        expectedHeading: record.expectedFaqHeading || '',
        actualHeading: record.actualFaqHeading || '',
      });
      applyStatus(faqRow.getCell(7), row.result);
    });
  });

  await workbook.xlsx.writeFile(REPORT_PATH);
  return REPORT_PATH;
};

module.exports = {
  REPORT_PATH,
  writeSeoStructureExcel,
};
