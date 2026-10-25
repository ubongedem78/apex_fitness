const ptRequestService = require('../services/ptRequestService');

const cancelPTRequest = async (req, res, next) => {
  try {
    const result = await ptRequestService.cancelPTRequest(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const createPTRequest = async (req, res, next) => {
  try {
    const result = await ptRequestService.createPTRequest(req.body, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getMyPTRequests = async (req, res, next) => {
  try {
    const result = await ptRequestService.getMyPTRequests(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getAllPTRequests = async (req, res, next) => {
  try {
    const result = await ptRequestService.getAllPTRequests();
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const getPTRequestCount = async (req, res, next) => {
  try {
    const result = await ptRequestService.getPTRequestCount();
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

const confirmPTRequest = async (req, res, next) => {
  try {
    const result = await ptRequestService.confirmPTRequest(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { createPTRequest, getMyPTRequests, getAllPTRequests, getPTRequestCount, confirmPTRequest, cancelPTRequest };
