export function isValidReferral(refId, userId, users) {
  return (
    /^\d+$/.test(refId) &&
    refId !== userId &&
    users[refId] &&
    users[userId].referredBy === null
  );
}
