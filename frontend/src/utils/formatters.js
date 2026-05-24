export const formatSeconds = (
  seconds
) => {

  const mins = Math.floor(
    seconds / 60
  );

  const secs = seconds % 60;

  return `${mins}:${String(
    secs
  ).padStart(2, "0")}`;
};

export const formatPlayerCount = (
  current,
  max
) => {
  return `${current}/${max}`;
};

export const truncateText = (
  text,
  limit = 20
) => {

  if (!text) {
    return "";
  }

  if (text.length <= limit) {
    return text;
  }

  return (
    text.slice(0, limit) + "..."
  );
};

export default {
  formatSeconds,
  formatPlayerCount,
  truncateText,
};