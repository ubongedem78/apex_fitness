const { lookupMember, checkIn, getTodayVisits } = require('../services/visitService');
const { assignTrainer, removeAssignment, getAssignment, listAssignments } = require('../services/ptAssignmentService');

const lookup = async (req, res, next) => {
  try {
    const { memberNumber } = req.params;
    const result = await lookupMember(memberNumber);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const checkin = async (req, res, next) => {
  try {
    const result = await checkIn(req.body, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const todayVisits = async (req, res, next) => {
  try {
    const result = await getTodayVisits(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const assignPT = async (req, res, next) => {
  try {
    const result = await assignTrainer(req.body, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const removePT = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await removeAssignment(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getPT = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    const result = await getAssignment(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const allAssignments = async (req, res, next) => {
  try {
    const result = await listAssignments(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { lookup, checkin, todayVisits, assignPT, removePT, getPT, allAssignments };
