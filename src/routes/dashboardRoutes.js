import express from 'express';
import {
	getDashboardSummary,
	getPaymentsList,
	getPlayersList,
	getUniformsList,
	updatePlayerGuardians,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getDashboardSummary);
router.get('/players', getPlayersList);
router.patch('/players/:id/guardians', updatePlayerGuardians);
router.get('/payments', getPaymentsList);
router.get('/uniforms', getUniformsList);

export default router;
