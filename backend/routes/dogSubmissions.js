const express = require('express');
const router = express.Router();
const {
    submitDogSubmission,
    getMySubmissions,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission
} = require('../controllers/dogSubmissionsController');
const checkSupabase = require('../middleware/supabaseCheck');
const { checkPermission, authenticateUser } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../constants/permissions');

// Submit dog submission
router.post('/', checkSupabase, submitDogSubmission);

// Get current user's submissions (requires authentication)
router.get('/me', checkSupabase, authenticateUser(), getMySubmissions);

// Get all submissions (for admin - requires MANAGE_SUBMISSIONS permission)
router.get('/', checkSupabase, checkPermission(PERMISSIONS.MANAGE_SUBMISSIONS), getAllSubmissions);

// Approve submission (requires MANAGE_SUBMISSIONS permission)
router.post('/:id/approve', checkSupabase, checkPermission(PERMISSIONS.MANAGE_SUBMISSIONS), approveSubmission);

// Reject submission (requires MANAGE_SUBMISSIONS permission)
router.post('/:id/reject', checkSupabase, checkPermission(PERMISSIONS.MANAGE_SUBMISSIONS), rejectSubmission);

module.exports = router;
