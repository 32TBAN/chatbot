const validKeyWord = (word, keysWords) => {
  return keysWords.some((keyWord) => word.includes(keyWord));
};

const validateEmail = async (email) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
  return re.test(String(email).toLowerCase());
};

const formatIcsDateTime = (date, time) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(
    2,
    "0"
  )}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00Z`;
};

const incrementHour = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const incrementedHour = hours + 1;
  return `${String(incrementedHour).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
};

const validateDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
};

const validateTime = (time) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export {
  validKeyWord,
  validateEmail,
  formatIcsDateTime,
  incrementHour,
  validateDate,
  validateTime,
};
