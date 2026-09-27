import db from '../config/db.js';

const PAID_STATUSES = ['OK', '$'];

export const getDashboardOverview = async ({ year, month }) => {
  const [summaryRows] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM jugadores) AS totalPlayers,
      (SELECT COUNT(*) FROM jugadores WHERE estado_inscripcion = 'OK' AND COALESCE(n_registro, '') NOT IN ('RET', 'EXP')) AS activePlayers,
      (SELECT COUNT(*) FROM jugadores WHERE n_registro IN ('RET', 'EXP')) AS retiredPlayers,
         (SELECT COUNT(*) FROM jugadores j
          LEFT JOIN mensualidades m ON m.jugador_id = j.id AND m.anio = ${year} AND m.mes = ${month}
          WHERE j.estado_inscripcion = 'OK' AND COALESCE(j.n_registro, '') NOT IN ('RET', 'EXP')
          AND COALESCE(m.estado_pago, '0') NOT IN ('OK', '$')) AS pendingPayments,
       (SELECT COUNT(*) FROM mensualidades
         WHERE anio = ${year} AND mes = ${month} AND estado_pago IN ('OK', '$')) AS paidPayments,
       (SELECT COUNT(*) FROM uniformes_jugadores
         WHERE anio = ${year} AND (
            NULLIF(uniforme_azul, '') IS NOT NULL OR
            NULLIF(uniforme_gris, '') IS NOT NULL OR
            NULLIF(torneo_1, '') IS NOT NULL OR
            NULLIF(torneo_2, '') IS NOT NULL
          )) AS playersWithUniform,
       (SELECT COUNT(*) FROM jugadores j
          WHERE j.estado_inscripcion = 'OK' AND COALESCE(j.n_registro, '') NOT IN ('RET', 'EXP')
            AND NOT EXISTS (
              SELECT 1 FROM uniformes_jugadores u
              WHERE u.jugador_id = j.id AND u.anio = ${year} AND (
                NULLIF(u.uniforme_azul, '') IS NOT NULL OR
                NULLIF(u.uniforme_gris, '') IS NOT NULL OR
                NULLIF(u.torneo_1, '') IS NOT NULL OR
                NULLIF(u.torneo_2, '') IS NOT NULL
              )
            )) AS playersWithoutUniform,
       (SELECT COUNT(*) FROM jugadores j
          WHERE j.estado_inscripcion = 'OK'
            AND NOT ((NULLIF(TRIM(j.nombre_mama), '') IS NOT NULL AND NULLIF(TRIM(j.celular_mama), '') IS NOT NULL)
              OR (NULLIF(TRIM(j.nombre_papa), '') IS NOT NULL AND NULLIF(TRIM(j.celular_papa), '') IS NOT NULL))) AS playersWithoutGuardianContact`,
  );

  const [recentPaymentRows] = await db.execute(
    `SELECT m.id, j.nombre_jugador AS student, m.anio, m.mes,
            m.estado_pago AS paymentStatus, m.fecha_pago AS paymentDate
       FROM mensualidades m
       INNER JOIN jugadores j ON j.id = m.jugador_id
      WHERE m.anio = ? AND m.mes = ?
      ORDER BY m.fecha_pago IS NULL, m.fecha_pago DESC, m.id DESC
      LIMIT 10`,
    [year, month],
  );

  const summary = summaryRows[0];
  const pendingPayments = Number(summary.pendingPayments);
  const playersWithoutUniform = Number(summary.playersWithoutUniform);
  const playersWithoutGuardianContact = Number(summary.playersWithoutGuardianContact);

  return {
    period: { year, month },
    stats: {
      totalStudents: Number(summary.totalPlayers),
      activeStudents: Number(summary.activePlayers),
      retiredStudents: Number(summary.retiredPlayers),
      pendingPayments,
      paidPayments: Number(summary.paidPayments),
      playersWithUniform: Number(summary.playersWithUniform),
      playersWithoutUniform,
      playersWithoutGuardianContact,
      monthlyIncome: null,
    },
    recentPayments: recentPaymentRows.map((payment) => ({
      id: payment.id,
      student: payment.student,
      concept: `Mensualidad ${payment.mes}/${payment.anio}`,
      amount: null,
      status: PAID_STATUSES.includes(payment.paymentStatus) ? 'Pagado' : 'Pendiente',
      date: payment.paymentDate,
    })),
    alerts: [
      ...(pendingPayments > 0 ? [`${pendingPayments} mensualidades están pendientes en el periodo seleccionado`] : []),
      ...(playersWithoutUniform > 0 ? [`${playersWithoutUniform} jugadores activos no tienen uniforme registrado`] : []),
      ...(playersWithoutGuardianContact > 0 ? [`ATENCIÓN: ${playersWithoutGuardianContact} jugadores activos no tienen un acudiente completo (nombre y teléfono)`] : []),
    ],
  };
};

export const getPlayers = async ({ search = '', status = 'active', limit = 50, offset = 0 }) => {
  const searchTerm = `%${search}%`;
  const statusFilter = status === 'retired'
    ? "j.n_registro IN ('RET', 'EXP')"
    : status === 'all'
      ? '1 = 1'
      : "j.estado_inscripcion = 'OK' AND COALESCE(j.n_registro, '') NOT IN ('RET', 'EXP')";
  const [rows] = await db.execute(
    `SELECT j.id, j.n_registro AS registrationNumber, j.nombre_jugador AS name,
            j.anio_nacimiento AS birthYear, j.numero_camiseta AS shirtNumber,
            j.numero_documento AS documentNumber, j.estado_inscripcion AS enrollmentStatus,
            j.fecha_inscripcion AS enrollmentDate,
            j.nombre_mama AS motherName, j.celular_mama AS motherPhone,
            j.nombre_papa AS fatherName, j.celular_papa AS fatherPhone,
            ((NULLIF(TRIM(j.nombre_mama), '') IS NOT NULL AND NULLIF(TRIM(j.celular_mama), '') IS NOT NULL)
              OR (NULLIF(TRIM(j.nombre_papa), '') IS NOT NULL AND NULLIF(TRIM(j.celular_papa), '') IS NOT NULL)) AS hasGuardianContact,
            EXISTS (
              SELECT 1 FROM uniformes_jugadores u
               WHERE u.jugador_id = j.id
                 AND (NULLIF(u.uniforme_azul, '') IS NOT NULL OR
                      NULLIF(u.uniforme_gris, '') IS NOT NULL OR
                      NULLIF(u.torneo_1, '') IS NOT NULL OR
                      NULLIF(u.torneo_2, '') IS NOT NULL)
            ) AS hasUniform
       FROM jugadores j
      WHERE (${statusFilter})
        AND (CAST(j.id AS CHAR) LIKE ? OR j.nombre_jugador LIKE ? OR j.numero_documento LIKE ? OR j.n_registro LIKE ?)
      ORDER BY j.nombre_jugador ASC
      LIMIT ? OFFSET ?`,
    [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset],
  );

  const [[count]] = await db.execute(
    `SELECT COUNT(*) AS total FROM jugadores j
      WHERE (${statusFilter})
        AND (CAST(id AS CHAR) LIKE ? OR nombre_jugador LIKE ? OR numero_documento LIKE ? OR n_registro LIKE ?)`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
  );

  return { rows, total: Number(count.total), limit, offset };
};

export const updateGuardianContacts = async ({ playerId, motherName, motherPhone, fatherName, fatherPhone }) => {
  const values = [motherName, motherPhone, fatherName, fatherPhone].map((value) => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || null;
  });
  const hasCompleteGuardian = (values[0] && values[1]) || (values[2] && values[3]);

  if (!hasCompleteGuardian) {
    const error = new Error('Debe registrar nombre y teléfono de al menos un acudiente');
    error.statusCode = 400;
    throw error;
  }

  const [result] = await db.execute(
    `UPDATE jugadores
        SET nombre_mama = ?, celular_mama = ?, nombre_papa = ?, celular_papa = ?
      WHERE id = ?`,
    [...values, playerId],
  );

  if (result.affectedRows === 0) {
    const error = new Error('Jugador no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return { playerId, motherName: values[0], motherPhone: values[1], fatherName: values[2], fatherPhone: values[3] };
};

export const getPayments = async ({ year, month, limit = 100, offset = 0 }) => {
  const [rows] = await db.execute(
    `SELECT m.id, m.jugador_id AS playerId, j.nombre_jugador AS playerName,
            m.anio AS year, m.mes AS month, m.estado_pago AS paymentStatus,
            m.fecha_pago AS paymentDate
       FROM mensualidades m
       INNER JOIN jugadores j ON j.id = m.jugador_id
      WHERE m.anio = ? AND m.mes = ?
      ORDER BY j.nombre_jugador ASC
      LIMIT ? OFFSET ?`,
    [year, month, limit, offset],
  );

  return rows;
};

export const getUniforms = async ({ year, limit = 100, offset = 0 }) => {
  const [rows] = await db.execute(
    `SELECT u.id, u.jugador_id AS playerId, j.nombre_jugador AS playerName,
            u.anio AS year, u.uniforme_azul AS blueUniform,
            u.uniforme_gris AS grayUniform, u.torneo_1 AS tournamentOne,
            u.torneo_2 AS tournamentTwo
       FROM uniformes_jugadores u
       INNER JOIN jugadores j ON j.id = u.jugador_id
      WHERE u.anio = ?
      ORDER BY j.nombre_jugador ASC
      LIMIT ? OFFSET ?`,
    [year, limit, offset],
  );

  return rows;
};
