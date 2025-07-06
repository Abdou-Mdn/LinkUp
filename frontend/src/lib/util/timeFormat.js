
const formatDateWithSuffix = (inputDate) => {
  const date = new Date(inputDate);
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

export {
    formatDateWithSuffix
}