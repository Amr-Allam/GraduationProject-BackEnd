export function validateData(sampleData) {
  if (!Array.isArray(sampleData)) {
    throw new Error('Data is not an array.');
  }

  const isValid =
    sampleData.length > 0 &&
    sampleData.every((item) => typeof item === 'number' && !isNaN(item));

  if (!isValid) {
    throw new Error('Invalid data: All elements must be numbers.');
  }

  return true;
}
