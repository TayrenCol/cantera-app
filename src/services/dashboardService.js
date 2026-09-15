export const getDashboardOverview = async () => {
  const stats = {
    totalStudents: 245,
    activeStudents: 198,
    monthlyIncome: 18500,
    pendingPayments: 12,
    classesToday: 18,
    activeMemberships: 221,
  };

  const recentPayments = [
    { id: 1, student: 'Ana García', concept: 'Membresía', amount: 1200, status: 'Pagado', date: '2026-09-14' },
    { id: 2, student: 'Luis Pérez', concept: 'Clases', amount: 850, status: 'Pagado', date: '2026-09-13' },
    { id: 3, student: 'Sofía Castro', concept: 'Membresía', amount: 1200, status: 'Pendiente', date: '2026-09-12' },
    { id: 4, student: 'Mateo Ruiz', concept: 'Entrenamiento', amount: 600, status: 'Pagado', date: '2026-09-11' },
  ];

  const alerts = [
    '3 alumnos tienen pagos pendientes este mes',
    '2 membresías vencen en los próximos 7 días',
    '5 profesores tienen clases programadas hoy',
  ];

  return {
    stats,
    recentPayments,
    alerts,
  };
};
