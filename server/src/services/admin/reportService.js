const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../../config/database');
const { User, Subscription, Payment, Booking, Class, MembershipPlan, Location } = require('../../models');

const getReport = async ({ startDate, endDate }, role) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 180 * 86400000);
  const end   = endDate   ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();

  const [
    totalRevenue,
    joiningFeeRevenue,
    newMembers,
    totalBookings,
    churnedSubscriptions,
    revenueByMonthRows,
    bookingsByDayRows,
    topClassesRows,
    memberGrowthRows,
  ] = await Promise.all([
    Payment.sum('amount', { where: { status: 'success', createdAt: { [Op.between]: [start, end] } } }),
    Payment.sum('joiningFee', { where: { status: 'success', createdAt: { [Op.between]: [start, end] } } }),
    User.count({ where: { role: 'member', createdAt: { [Op.between]: [start, end] } } }),
    Booking.count({ where: { status: { [Op.ne]: 'cancelled' }, bookedAt: { [Op.between]: [start, end] } } }),
    Subscription.count({ where: { status: 'cancelled', cancelledAt: { [Op.between]: [start, end] } } }),
    sequelize.query(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month,
              SUM(amount) AS revenue,
              SUM("joiningFee") AS "joiningFee"
       FROM payments WHERE status = 'success' AND "createdAt" BETWEEN :start AND :end
       GROUP BY month ORDER BY month ASC`,
      { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT TO_CHAR("bookedAt", 'YYYY-MM-DD') AS date, COUNT(*) AS count
       FROM bookings WHERE "bookedAt" BETWEEN :start AND :end
       GROUP BY date ORDER BY date ASC`,
      { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT c.name, COUNT(b.id) AS bookings
       FROM classes c LEFT JOIN bookings b ON b."classId" = c.id AND b."bookedAt" BETWEEN :start AND :end
       GROUP BY c.id, c.name ORDER BY bookings DESC LIMIT 10`,
      { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS total
       FROM users WHERE role = 'member' AND "createdAt" BETWEEN :start AND :end
       GROUP BY month ORDER BY month ASC`,
      { replacements: { start, end }, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
  const churnRate = activeSubscriptions > 0
    ? parseFloat(((churnedSubscriptions / (activeSubscriptions + churnedSubscriptions)) * 100).toFixed(2))
    : 0;

  const grossRevenue = parseFloat(totalRevenue || 0);
  const joiningFees = parseFloat(joiningFeeRevenue || 0);

  const result = {
    stats: {
      totalRevenue: grossRevenue,
      membershipRevenue: parseFloat((grossRevenue - joiningFees).toFixed(2)),
      joiningFeeRevenue: joiningFees,
      newMembers,
      totalBookings,
      churnRate,
    },
    revenueByMonth: revenueByMonthRows.map((r) => {
      const revenue = parseFloat(r.revenue || 0);
      const joining = parseFloat(r.joiningFee || 0);
      return {
        month: r.month,
        revenue,
        joiningFee: joining,
        membershipRevenue: parseFloat((revenue - joining).toFixed(2)),
      };
    }),
    bookingsByDay: bookingsByDayRows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    topClasses: topClassesRows.map((r) => ({ name: r.name, bookings: parseInt(r.bookings, 10) })),
    memberGrowth: memberGrowthRows.map((r) => ({ month: r.month, total: parseInt(r.total, 10) })),
  };

  if (role !== 'admin') {
    delete result.stats.totalRevenue;
    delete result.stats.membershipRevenue;
    delete result.stats.joiningFeeRevenue;
    delete result.revenueByMonth;
  }

  return result;
};

const getOverview = async (role) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const todayStr = now.toISOString().split('T')[0];
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalMembers, classesThisWeek, activeSubscriptions, revenueByMonthRows] = await Promise.all([
    User.count({ where: { role: 'member' } }),
    Class.count({
      where: {
        date: { [Op.gte]: startOfWeek.toISOString().split('T')[0] },
        status: { [Op.ne]: 'cancelled' },
      },
    }),
    Subscription.count({ where: { status: 'active' } }),
    sequelize.query(
      `SELECT TO_CHAR("createdAt", 'Mon') AS month,
              TO_CHAR("createdAt", 'YYYY-MM') AS sort_key,
              SUM(amount) AS revenue
       FROM payments
       WHERE status = 'success' AND "createdAt" >= :since
       GROUP BY TO_CHAR("createdAt", 'Mon'), TO_CHAR("createdAt", 'YYYY-MM')
       ORDER BY sort_key ASC`,
      { replacements: { since: sixMonthsAgo }, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  const revenueResult = await Payment.findOne({
    attributes: [[fn('SUM', col('amount')), 'total']],
    where: { status: 'success', createdAt: { [Op.gte]: startOfMonth } },
    raw: true,
  });
  const monthlyRevenue = parseFloat(revenueResult?.total || 0);

  const todaysClasses = await Class.findAll({
    where: { date: todayStr, status: 'scheduled' },
    include: [{ model: Location, attributes: ['id', 'name'] }],
    order: [['startTime', 'ASC']],
    limit: 5,
  });

  const recentMembers = await User.findAll({
    where: { role: 'member' },
    include: [
      {
        model: Subscription,
        required: false,
        where: { status: 'active' },
        include: [{ model: MembershipPlan, as: 'plan', attributes: ['id', 'name'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  const result = {
    stats: {
      totalMembers,
      monthlyRevenue,
      activeSubscriptions,
      classesThisWeek,
    },
    revenueByMonth: revenueByMonthRows.map((r) => ({ month: r.month, revenue: parseFloat(r.revenue || 0) })),
    todaysClasses: todaysClasses.map((c) => ({ ...c.toJSON(), enrolledCount: c.bookedCount })),
    recentMembers: recentMembers.map((m) => {
      const json = m.toJSON();
      json.subscription = json.Subscriptions?.[0] || null;
      return json;
    }),
  };

  if (role !== 'admin') {
    delete result.stats.monthlyRevenue;
    delete result.revenueByMonth;
  }

  return result;
};

const getRevenue = async ({ locationId }) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  let whereClause = `WHERE p.status = 'success' AND p."createdAt" >= :startDate`;
  const replacements = { startDate: twelveMonthsAgo };

  if (locationId) {
    whereClause += ` AND s."locationId" = :locationId`;
    replacements.locationId = locationId;
  }

  const query = `
    SELECT
      TO_CHAR(p."createdAt", 'YYYY-MM') AS month,
      SUM(p.amount) AS total,
      COUNT(*) AS transactions
    FROM payments p
    ${locationId ? 'LEFT JOIN subscriptions s ON p."subscriptionId" = s.id' : ''}
    ${whereClause}
    GROUP BY TO_CHAR(p."createdAt", 'YYYY-MM')
    ORDER BY month ASC
  `;

  const results = await sequelize.query(query, {
    replacements,
    type: sequelize.QueryTypes.SELECT,
  });

  return { revenue: results };
};

const getMembers = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const newMembersQuery = `
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM') AS month,
      COUNT(*) AS new_members
    FROM users
    WHERE role = 'member' AND "createdAt" >= :startDate
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
    ORDER BY month ASC
  `;

  const cancelledQuery = `
    SELECT
      TO_CHAR("cancelledAt", 'YYYY-MM') AS month,
      COUNT(*) AS churned
    FROM subscriptions
    WHERE status = 'cancelled' AND "cancelledAt" >= :startDate
    GROUP BY TO_CHAR("cancelledAt", 'YYYY-MM')
    ORDER BY month ASC
  `;

  const [newMembers, churned] = await Promise.all([
    sequelize.query(newMembersQuery, {
      replacements: { startDate: twelveMonthsAgo },
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(cancelledQuery, {
      replacements: { startDate: twelveMonthsAgo },
      type: sequelize.QueryTypes.SELECT,
    }),
  ]);

  return { newMembers, churned };
};

const getClasses = async () => {
  const topClassesQuery = `
    SELECT
      c.id,
      c.name,
      c."classType",
      c.date,
      c.capacity,
      c."bookedCount",
      COUNT(b.id) AS total_bookings,
      COUNT(CASE WHEN b.status = 'attended' THEN 1 END) AS attended_count
    FROM classes c
    LEFT JOIN bookings b ON b."classId" = c.id
    GROUP BY c.id, c.name, c."classType", c.date, c.capacity, c."bookedCount"
    ORDER BY total_bookings DESC
    LIMIT 10
  `;

  const attendanceByTypeQuery = `
    SELECT
      c."classType",
      COUNT(b.id) AS total_bookings,
      COUNT(CASE WHEN b.status = 'attended' THEN 1 END) AS attended,
      AVG(c."bookedCount"::FLOAT / NULLIF(c.capacity, 0) * 100) AS avg_occupancy_rate
    FROM classes c
    LEFT JOIN bookings b ON b."classId" = c.id
    GROUP BY c."classType"
    ORDER BY total_bookings DESC
  `;

  const [topClasses, attendanceByType] = await Promise.all([
    sequelize.query(topClassesQuery, { type: sequelize.QueryTypes.SELECT }),
    sequelize.query(attendanceByTypeQuery, { type: sequelize.QueryTypes.SELECT }),
  ]);

  return { topClasses, attendanceByType };
};

const getBookings = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = `
    SELECT
      TO_CHAR("bookedAt", 'YYYY-MM-DD') AS date,
      COUNT(*) AS total_bookings,
      COUNT(CASE WHEN status = 'booked' THEN 1 END) AS active,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled,
      COUNT(CASE WHEN status = 'attended' THEN 1 END) AS attended
    FROM bookings
    WHERE "bookedAt" >= :startDate
    GROUP BY TO_CHAR("bookedAt", 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  const results = await sequelize.query(query, {
    replacements: { startDate: thirtyDaysAgo },
    type: sequelize.QueryTypes.SELECT,
  });

  return { bookings: results };
};

module.exports = { getReport, getOverview, getRevenue, getMembers, getClasses, getBookings };
