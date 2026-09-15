import db from '../config/db.js';

export const getDashboardSummary = async (req, res) => {
  try {
    // Devolvemos el objeto JSON exacto que tu archivo index.html necesita leer
    return res.status(200).json({
      stats: {
        totalStudents: 150,
        activeStudents: 120,
        monthlyIncome: 4500000,
        pendingPayments: 8,
        classesToday: 4,
        activeMemberships: 115
      },
      recentPayments: [
        { student: 'Juan Pérez', concept: 'Mensualidad Septiembre', amount: 50000, status: 'Pagado' },
        { student: 'María López', concept: 'Inscripción', amount: 30000, status: 'Pendiente' }
      ],
      alerts: [
        '3 estudiantes tienen pagos vencidos hace más de 5 días.',
        'La clase de las 6:00 PM no tiene profesor asignado.'
      ]
    });

  } catch (error) {
    console.error('Error en getDashboardSummary:', error);
    return res.status(500).json({ 
      status: 'ERROR',
      message: 'Error al obtener los datos del dashboard', 
      error: error.message 
    });
  }
};
