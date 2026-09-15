import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getDashboardSummary);

export default router;
