import {
  getDashboardOverview,
  getPayments,
  getPlayers,
  getUniforms,
  createPlayer,
  getDocuments,
  updateDocumentStatus,
  registerPayment,
  updateGuardianContacts,
} from '../services/dashboardService.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
    const month = Number.parseInt(req.query.month, 10) || now.getMonth() + 1;

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ status: 'ERROR', message: 'El periodo solicitado no es válido' });
    }

    return res.status(200).json(await getDashboardOverview({ year, month }));

  } catch (error) {
    console.error('Error en getDashboardSummary:', error);
    return res.status(500).json({ 
      status: 'ERROR',
      message: 'Error al obtener los datos del dashboard', 
      error: error.message 
    });
  }
};

const pagination = (req) => ({
  limit: Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100),
  offset: Math.max(Number.parseInt(req.query.offset, 10) || 0, 0),
});

export const getPlayersList = async (req, res) => {
  try {
    const status = ['active', 'retired', 'all'].includes(req.query.status) ? req.query.status : 'active';
    return res.json(await getPlayers({ search: req.query.search || '', status, ...pagination(req) }));
  } catch (error) {
    console.error('Error en getPlayersList:', error);
    return res.status(500).json({ status: 'ERROR', message: 'No se pudieron obtener los jugadores' });
  }
};

export const updatePlayerGuardians = async (req, res) => {
  try {
    const playerId = Number.parseInt(req.params.id, 10);
    if (!playerId) return res.status(400).json({ status: 'ERROR', message: 'El jugador no es válido' });
    return res.json(await updateGuardianContacts({ playerId, ...req.body }));
  } catch (error) {
    console.error('Error en updatePlayerGuardians:', error);
    return res.status(error.statusCode || 500).json({ status: 'ERROR', message: error.message });
  }
};

export const createPlayerRecord = async (req, res) => {
  try {
    return res.status(201).json(await createPlayer(req.body));
  } catch (error) {
    console.error('Error en createPlayerRecord:', error);
    return res.status(error.statusCode || 500).json({ status: 'ERROR', message: error.message });
  }
};

export const getPlayerDocuments = async (req, res) => {
  try {
    const playerId = Number.parseInt(req.params.id, 10);
    if (!playerId) return res.status(400).json({ status: 'ERROR', message: 'El jugador no es válido' });
    return res.json(await getDocuments(playerId));
  } catch (error) {
    console.error('Error en getPlayerDocuments:', error);
    return res.status(error.statusCode || 500).json({ status: 'ERROR', message: error.message });
  }
};

export const updatePlayerDocument = async (req, res) => {
  try {
    const playerId = Number.parseInt(req.params.id, 10);
    if (!playerId) return res.status(400).json({ status: 'ERROR', message: 'El jugador no es válido' });
    return res.json(await updateDocumentStatus({ playerId, type: req.params.type, status: req.body.status }));
  } catch (error) {
    console.error('Error en updatePlayerDocument:', error);
    return res.status(error.statusCode || 500).json({ status: 'ERROR', message: error.message });
  }
};

export const getPaymentsList = async (req, res) => {
  try {
    const now = new Date();
    const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
    const month = Number.parseInt(req.query.month, 10) || now.getMonth() + 1;
    return res.json(await getPayments({ year, month, ...pagination(req) }));
  } catch (error) {
    console.error('Error en getPaymentsList:', error);
    return res.status(500).json({ status: 'ERROR', message: 'No se pudieron obtener las mensualidades' });
  }
};

export const registerMonthlyPayment = async (req, res) => {
  try {
    const playerId = Number.parseInt(req.body.playerId, 10);
    const year = Number.parseInt(req.body.year, 10);
    const month = Number.parseInt(req.body.month, 10);
    if (!playerId || year < 2000 || year > 2100 || month < 1 || month > 12) {
      return res.status(400).json({ status: 'ERROR', message: 'El jugador o periodo no es válido' });
    }
    return res.status(200).json(await registerPayment({
      playerId,
      year,
      month,
      receiptNumber: req.body.receiptNumber,
    }));
  } catch (error) {
    console.error('Error en registerMonthlyPayment:', error);
    return res.status(error.statusCode || 500).json({ status: 'ERROR', message: error.message });
  }
};

export const getUniformsList = async (req, res) => {
  try {
    const year = Number.parseInt(req.query.year, 10) || new Date().getFullYear();
    return res.json(await getUniforms({ year, ...pagination(req) }));
  } catch (error) {
    console.error('Error en getUniformsList:', error);
    return res.status(500).json({ status: 'ERROR', message: 'No se pudieron obtener los uniformes' });
  }
};
