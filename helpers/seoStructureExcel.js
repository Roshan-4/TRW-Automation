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

const SUMMARY_COLUMNS = [
  { header: 'Page key', key: 'pageKey', width: 22 },
  { header: 'Language', key: 'lang', width: 12 },
  { header: 'Device', key: 'device', width: 10 },
  { header: 'Page', key: 'pageLabel', width: 36 },
  { header: 'URL', key: 'url', width: 55 },
  { header: 'Headings result', key: 'headingsResult', width: 16 },
  { header: 'FAQ result', key: 'faqResult', width: 16 },
  { header: 'Missing headings', key: 'missingHeadings', width: 50 },
  { header: 'Extra headings', key: 'extraHeadings', width: 50 },
  { header: 'Snapshot file', key: 'dataFile', width: 48 },
];

const HEADINGS_COLUMNS = [
  { header: 'Page key', key: 'pageKey', width: 22 },
  { header: 'Language', key: 'lang', width: 12 },
  { header: 'Device', key: 'device', width: 10 },
  { header: 'Page', key: 'pageLabel', width: 36 },
  { header: 'URL', key: 'url', width: 55 },
  { header: '#', key: 'index', width: 6 },
  { header: 'Expected tag', key: 'expectedTag', width: 14 },
  { header: 'Expected heading (test data)', key: 'expectedText', width: 60 },
  { header: 'Actual tag', key: 'actualTag', width: 14 },
  { header: 'Actual heading (live page)', key: 'actualText', width: 60 },
  { header: 'Result', key: 'result', width: 22 },
];

const FAQ_COLUMNS = [
  { header: 'Page key', key: 'pageKey', width: 22 },
  { header: 'Language', key: 'lang', width: 12 },
  { header: 'Device', key: 'device', width: 10 },
  { header: 'Page', key: 'pageLabel', width: 36 },
  { header: 'URL', key: 'url', width: 55 },
  { header: '#', key: 'index', width: 6 },
  { header: 'Expected question (test data)', key: 'expectedText', width: 60 },
  { header: 'Actual question (live page)', key: 'actualText', width: 60 },
  { header: 'Result', key: 'result', width: 22 },
  { header: 'Expected FAQ heading', key: 'expectedHeading', width: 40 },
  { header: 'Actual FAQ heading', key: 'actualHeading', width: 40 },
];

// Column index of "Result" in each sheet (for the status color fill), 1-based.
const RESULT_COL = { summaryHeadings: 6, summaryFaq: 7, headings: 11, faq: 9 };

const ensureSheet = (workbook, name, columns) => {
  let sheet = workbook.getWorksheet(name);
  if (!sheet) {
    sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
  }
  return sheet;
};

// Rows are unique per page+language+device — desktop and mobile runs of the
// same page/language must coexist rather than overwrite each other.
const removeRowsForPage = (sheet, pageKey, lang, device) => {
  const toDelete = [];
  sheet.eachRow((row, number) => {
    if (number === 1) {
      return;
    }
    if (
      row.getCell(1).value === pageKey &&
      row.getCell(2).value === lang &&
      row.getCell(3).value === device
    ) {
      toDelete.push(number);
    }
  });
  toDelete.reverse().forEach((number) => sheet.spliceRows(number, 1));
};

/**
 * Merge this Cypress invocation's comparisons into artifacts/seo-structure-report.xlsx.
 * One Summary row per page+language+device, plus page-wise Expected vs Actual rows.
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

  const summary = ensureSheet(workbook, 'Summary', SUMMARY_COLUMNS);
  const headings = ensureSheet(workbook, 'Headings (page-wise)', HEADINGS_COLUMNS);
  const faqs = ensureSheet(workbook, 'FAQ (page-wise)', FAQ_COLUMNS);

  records.forEach((record) => {
    const device = record.device || 'desktop';
    removeRowsForPage(summary, record.pageKey, record.lang, device);
    removeRowsForPage(headings, record.pageKey, record.lang, device);
    removeRowsForPage(faqs, record.pageKey, record.lang, device);

    const summaryRow = summary.addRow({
      pageKey: record.pageKey,
      lang: record.lang,
      device,
      pageLabel: record.pageLabel,
      url: record.url || record.path,
      headingsResult: record.headingsMatched ? 'Pass' : 'Fail',
      faqResult: record.faqMatched ? 'Pass' : 'Fail',
      missingHeadings: (record.missingHeadings || []).join(' | '),
      extraHeadings: (record.extraHeadings || []).join(' | '),
      dataFile: record.dataFile,
    });
    applyStatus(summaryRow.getCell(RESULT_COL.summaryHeadings), record.headingsMatched ? 'Pass' : 'Fail');
    applyStatus(summaryRow.getCell(RESULT_COL.summaryFaq), record.faqMatched ? 'Pass' : 'Fail');

    (record.headingRows || []).forEach((row) => {
      const headingRow = headings.addRow({
        pageKey: record.pageKey,
        lang: record.lang,
        device,
        pageLabel: record.pageLabel,
        url: record.url || record.path,
        index: row.index,
        expectedTag: row.expectedTag,
        expectedText: row.expectedText,
        actualTag: row.actualTag,
        actualText: row.actualText,
        result: row.result,
      });
      applyStatus(headingRow.getCell(RESULT_COL.headings), row.result);
    });

    (record.faqRows || []).forEach((row) => {
      const faqRow = faqs.addRow({
        pageKey: record.pageKey,
        lang: record.lang,
        device,
        pageLabel: record.pageLabel,
        url: record.url || record.path,
        index: row.index,
        expectedText: row.expectedText,
        actualText: row.actualText,
        result: row.result,
        expectedHeading: record.expectedFaqHeading || '',
        actualHeading: record.actualFaqHeading || '',
      });
      applyStatus(faqRow.getCell(RESULT_COL.faq), row.result);
    });
  });

  await workbook.xlsx.writeFile(REPORT_PATH);
  return REPORT_PATH;
};

/**
 * Combine multiple per-device seo-structure-report.xlsx files (e.g. one from
 * the seo-desktop CI job, one from seo-mobile) into a single workbook. Each
 * source keeps its own rows — Page+Language+Device already makes every row
 * unique, so this is a straight row-level append, not a page-level merge.
 */
const mergeSeoStructureExcelFiles = async (sourcePaths, outputPath) => {
  const existing = sourcePaths.filter((p) => fs.existsSync(p));
  if (!existing.length) {
    return null;
  }

  const workbook = new ExcelJS.Workbook();
  const summary = ensureSheet(workbook, 'Summary', SUMMARY_COLUMNS);
  const headings = ensureSheet(workbook, 'Headings (page-wise)', HEADINGS_COLUMNS);
  const faqs = ensureSheet(workbook, 'FAQ (page-wise)', FAQ_COLUMNS);

  const copySheetRows = (sourceSheet, targetSheet, resultCols) => {
    if (!sourceSheet) {
      return;
    }
    sourceSheet.eachRow((row, number) => {
      if (number === 1) {
        return;
      }
      const values = {};
      targetSheet.columns.forEach((col, index) => {
        values[col.key] = row.getCell(index + 1).value;
      });
      const newRow = targetSheet.addRow(values);
      resultCols.forEach((colIndex) => applyStatus(newRow.getCell(colIndex), row.getCell(colIndex).value));
    });
  };

  for (const sourcePath of existing) {
    const sourceWorkbook = new ExcelJS.Workbook();
    // eslint-disable-next-line no-await-in-loop
    await sourceWorkbook.xlsx.readFile(sourcePath);
    copySheetRows(sourceWorkbook.getWorksheet('Summary'), summary, [
      RESULT_COL.summaryHeadings,
      RESULT_COL.summaryFaq,
    ]);
    copySheetRows(sourceWorkbook.getWorksheet('Headings (page-wise)'), headings, [RESULT_COL.headings]);
    copySheetRows(sourceWorkbook.getWorksheet('FAQ (page-wise)'), faqs, [RESULT_COL.faq]);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
};

module.exports = {
  REPORT_PATH,
  writeSeoStructureExcel,
  mergeSeoStructureExcelFiles,
};
