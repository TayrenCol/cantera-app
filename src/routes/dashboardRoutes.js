import express from 'express';
import {
	getDashboardSummary,
	getPaymentsList,
	getPlayersList,
	getUniformsList,
	createPlayerRecord,
	getPlayerDocuments,
	updatePlayerDocument,
	registerMonthlyPayment,
	updatePlayerGuardians,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getDashboardSummary);
router.get('/players', getPlayersList);
router.post('/players', createPlayerRecord);
router.patch('/players/:id/guardians', updatePlayerGuardians);
router.get('/players/:id/documents', getPlayerDocuments);
router.patch('/players/:id/documents/:type', updatePlayerDocument);
router.get('/payments', getPaymentsList);
router.post('/payments', registerMonthlyPayment);
router.get('/uniforms', getUniformsList);

export default router;
