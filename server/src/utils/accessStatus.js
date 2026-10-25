const DAY_MS = 1000 * 60 * 60 * 24;

const todayStr = () => new Date().toISOString().split('T')[0];

const resolveAccess = (sub, { noun = 'Subscription', today = todayStr() } = {}) => {
  if (!sub) {
    return { accessStatus: 'none', accessMessage: `No ${noun.toLowerCase()}.`, cancelled: false, canAccess: false, endDate: null, daysLeft: null };
  }

  const endDate = sub.endDate;
  const cancelled = !!sub.cancelledAt;
  const daysLeft = Math.ceil((new Date(endDate) - new Date(today)) / DAY_MS);
  const ended = sub.status === 'cancelled' || sub.status === 'expired' || daysLeft <= 0;

  if (ended) {
    if (cancelled) {
      return { accessStatus: 'cancelled', accessMessage: `${noun} cancelled. Access ended ${endDate}.`, cancelled: true, canAccess: false, endDate, daysLeft };
    }
    return { accessStatus: 'expired', accessMessage: `${noun} expired on ${endDate}.`, cancelled: false, canAccess: false, endDate, daysLeft };
  }

  const base = daysLeft <= 7 ? 'expiring' : 'active';

  if (cancelled) {
    return { accessStatus: base, accessMessage: `Cancelled - access until ${endDate} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left). Will not renew.`, cancelled: true, canAccess: true, endDate, daysLeft };
  }
  if (base === 'expiring') {
    return { accessStatus: 'expiring', accessMessage: `${noun} expires on ${endDate} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left).`, cancelled: false, canAccess: true, endDate, daysLeft };
  }
  return { accessStatus: 'active', accessMessage: `Active - expires ${endDate}.`, cancelled: false, canAccess: true, endDate, daysLeft };
};

module.exports = { resolveAccess, todayStr };
