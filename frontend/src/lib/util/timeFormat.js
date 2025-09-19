// reusable time utility functions

// format a date into "Month Day<suffix>, Year"
// example: "September 9th, 2025"
const formatDateWithSuffix = (inputDate) => {
  const date = new Date(inputDate);

  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const year = date.getFullYear();

  const month = date.toLocaleString('default', { month: 'long' });

  // Helper function to get ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (n) => {
    const j = n % 10,
          k = n % 100;
    if (j === 1 && k !== 11) return n + "st";
    if (j === 2 && k !== 12) return n + "nd";
    if (j === 3 && k !== 13) return n + "rd";
    return n + "th";
  };

  return `${month} ${getOrdinalSuffix(day)}, ${year}`;
}

// human-friendly relative time formatter
// examples: "45s ago", "12min ago", "3h ago", "2d ago", "3w ago", "since September 9th, 2025"
const timeSince = (inputDate, text="since") => {
  const now = new Date();
  const past = new Date(inputDate);
  if (isNaN(past.getTime())) return "Invalid Date";

  const diff = Math.floor((now - past) / 1000); // in seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2629800) return `${Math.floor(diff / 604800)}w ago`; // ~1 month (30.44 days)
  
  return `${text} ${formatDateWithSuffix(past)}`;
};

// format time as HH:mm (24 hour format)
// examples: "09:05", "18:42"
function formatTime(date) {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// checks if two dates are on different calendar days
function isDifferentDay(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}

// format chat dates (Today/ Yesterday / Full date with suffix)
// used for messages grouping
function formatChatDate(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1)

  if(!isDifferentDay(date, today)) {
    return "Today"
  } else if(!isDifferentDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return formatDateWithSuffix(date);
  }
}

export {
  formatDateWithSuffix, timeSince, formatTime, isDifferentDay, formatChatDate
}