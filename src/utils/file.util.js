import multer from 'multer';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const __dirname = path.resolve();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/csv'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only Excel, PDF, or CSV files', 400), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

export const uploadFile = () => upload.array('files');

const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const processFile = () => async (req, res, next) => {
  const filesDir = path.resolve(__dirname, 'public');
  console.log(filesDir);
  ensureDirectoryExistence(filesDir);
  const fileNamePrefix = 'document';
  if (!req.files) return next();

  req.body.files = [];

  await Promise.all(
    req.files.map(async (file, index) => {
      const ext = path.extname(file.originalname);
      const oneFileName = `${Date.now()}-${fileNamePrefix}-${index + 1}${ext}`;

      fs.writeFileSync(path.join(filesDir, oneFileName), file.buffer);

      req.body.files.push(oneFileName);
    })
  );

  next();
};

export const removeFile = async (filesArray) => {
  const directoryPath = path.resolve(__dirname, '../public/files');
  filesArray.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    console.log(filePath); // Full path to the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting ${filePath}:`, err);
      }
    });
  });
};

export function getDataByHeader(filePath, headerName) {
  const workbook = xlsx.readFile(filePath);
  let dataByHeader = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length > 0) {
      const headers = jsonData[0]; // First row as headers
      const index = headers.indexOf(headerName);

      if (index !== -1) {
        let columnData = jsonData.slice(1).map((row) => row[index]);

        columnData = columnData
          .map((item) => (typeof item === 'string' ? item.trim() : item))
          .map((item) => cleanNumericData(item))
          .filter((item) => item !== undefined && item !== null && item !== '');
        dataByHeader = dataByHeader.concat(columnData); // Merge into the array
      }
    }
  });

  return dataByHeader; // Keeping duplicates as they are
}

function cleanNumericData(value) {
  if (typeof value === 'number') return value; // Already a valid number

  if (typeof value === 'string') {
    value = value.trim();

    // Handle values inside parentheses (e.g., "(500)" → "-500")
    if (value.startsWith('(') && value.endsWith(')')) {
      value = '-' + value.slice(1, -1);
    }

    // Remove non-numeric characters except dots and commas
    value = value.replace(/[^0-9.,-]/g, '');

    // Convert to a proper number
    if (value.includes(',')) {
      const parts = value.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Case: "1,234.56" (handle comma as thousands separator)
        value = value.replace(/,/g, '');
      } else {
        // Case: "1.234,56" (handle comma as decimal separator)
        value = value.replace('.', '').replace(',', '.');
      }
    }

    const num = parseFloat(value);
    return isNaN(num) ? null : num; // Return null if not a valid number
  }

  return null; // Ignore any non-string and non-number values
}

// Utility: Read entire sheet as array of objects (rows)
export function getSheetData(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: null });
}

// Utility: Group data by one or two factors for ANOVA
export function groupByFactors(data, factorNames, valueName) {
  if (
    !Array.isArray(factorNames) ||
    factorNames.length < 1 ||
    factorNames.length > 2
  ) {
    throw new Error('factorNames must be an array of one or two column names');
  }
  if (!valueName) throw new Error('valueName is required');

  if (factorNames.length === 1) {
    // One-way: group by single factor, ensure only valid numbers are included
    const groups = {};
    data.forEach((row) => {
      const key = row[factorNames[0]];
      if (key == null) return;
      let val = row[valueName];
      if (val != null && val !== '') {
        val = Number(val);
        if (!isNaN(val) && isFinite(val)) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(val);
        }
      }
    });
    // Sort groups by factor level for consistency (numeric sort)
    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => groups[k]);
  } else {
    // Two-way: group by both factors
    const levels1 = Array.from(
      new Set(data.map((row) => row[factorNames[0]]).filter((x) => x != null))
    );
    const levels2 = Array.from(
      new Set(data.map((row) => row[factorNames[1]]).filter((x) => x != null))
    );
    // Build a 2D array: [ [group for (level1, level2)], ... ]
    const groups = levels1.map((level1) =>
      levels2.map((level2) =>
        data
          .filter(
            (row) =>
              row[factorNames[0]] === level1 && row[factorNames[1]] === level2
          )
          .map((row) => Number(row[valueName]))
          .filter(
            (val) => val != null && val !== '' && !isNaN(val) && isFinite(val)
          )
      )
    );
    return { groups, levels1, levels2 };
  }
}
