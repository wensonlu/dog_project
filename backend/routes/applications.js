const express = require('express');
const router = express.Router();
const {
    submitApplication,
    getAllApplications,
    getUserApplications,
    approveApplication,
    rejectApplication
} = require('../controllers/applicationsController');
const checkSupabase = require('../middleware/supabaseCheck');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../constants/permissions');

// Submit adoption application
router.post('/', checkSupabase, submitApplication);

// Get all applications (for admin - requires MANAGE_ADOPTIONS permission)
router.get('/', checkSupabase, checkPermission(PERMISSIONS.MANAGE_ADOPTIONS), getAllApplications);

// Get applications for a user
router.get('/:userId', checkSupabase, getUserApplications);

// Approve application (requires MANAGE_ADOPTIONS permission)
router.post('/:id/approve', checkSupabase, checkPermission(PERMISSIONS.MANAGE_ADOPTIONS), approveApplication);

// Reject application (requires MANAGE_ADOPTIONS permission)
router.post('/:id/reject', checkSupabase, checkPermission(PERMISSIONS.MANAGE_ADOPTIONS), rejectApplication);

module.exports = router;
