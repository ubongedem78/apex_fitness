export const formatCurrency = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const intervals = [['year',31536000],['month',2592000],['week',604800],['day',86400],['hour',3600],['minute',60]];
  for (const [unit, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
};

export const getStatusColor = (status) => {
  const map = {
    active:    '#22c55e',
    paused:    '#f59e0b',
    cancelled: '#ef4444',
    expired:   '#6b7280',
    booked:    '#22c55e',
    attended:  '#3b82f6',
    no_show:   '#6b7280',
    scheduled: '#22c55e',
    completed: '#3b82f6',
    success:   '#22c55e',
    pending:   '#f59e0b',
    paid:      '#22c55e',
    assigned:  '#3b82f6',
    failed:    '#ef4444',
    refunded:  '#6b7280',
    attention: '#f59e0b',
  };
  return map[status] || '#6b7280';
};
