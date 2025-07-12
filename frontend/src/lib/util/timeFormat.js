
const formatDateWithSuffix = (inputDate) => {
  const date = new Date(inputDate);

  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const year = date.getFullYear();

  const month = date.toLocaleString('default', { month: 'long' });

  // Helper function to get ordinal suffix
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

const timeSince = (inputDate) => {
  const now = new Date();
  const past = new Date(inputDate);
  if (isNaN(past.getTime())) return "Invalid Date";

  const diff = Math.floor((now - past) / 1000); // in seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2629800) return `${Math.floor(diff / 604800)}w ago`; // ~1 month (30.44 days)
  
  return `since ${formatDateWithSuffix(past)}`;
};

export {
    formatDateWithSuffix, timeSince
}