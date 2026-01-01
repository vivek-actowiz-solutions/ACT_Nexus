/**
 * Convert any incoming date to IST Date object
 * @param {Date | string | number} inputDate
 * @returns {Date} IST date (safe for MongoDB)
 */
function toISTDate(inputDate = new Date()) {
  const date = new Date(inputDate);

  // IST offset = UTC + 5:30 (in minutes)
  const IST_OFFSET = 5.5 * 60;

  // Convert local/UTC date → IST
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = utcTime + IST_OFFSET * 60000;

  return new Date(istTime);
}

module.exports = { toISTDate };
