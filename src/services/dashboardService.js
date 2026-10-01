import db from '../config/db.js';

const PAID_STATUSES = ['OK', '$'];
const DOCUMENT_TYPES = [
  { id: 'registro-civil-identidad', label: 'Registro civil o tarjeta de identidad', group: 'Personal' },
  { id: 'certificado-eps', label: 'Certificado de afiliación a EPS', group: 'Personal' },
  { id: 'cedula-acudiente', label: 'Cédula del acudiente principal', group: 'Personal' },
  { id: 'hoja-de-vida', label: 'Hoja de vida del jugador', group: 'Club' },
  { id: 'compromiso-vinculacion', label: 'Compromiso de vinculación', group: 'Club' },
  { id: 'cesion-derechos-imagen', label: 'Cesión de derechos de imagen', group: 'Club' },
];
const DOCUMENT_STATUSES = ['Pendiente', 'Cargado', 'Verificado'];
const CATEGORIES = [
  '2022-2023', '2021', '2020', '2019', '2017-2018 A', '2017-2018 B', '2016', '2015', '2013-2014',
];

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const categoryForBirthYear = (birthYear) => {
  const categoriesByBirthYear = {
  2023: '2022-2023', 2022: '2022-2023', 2021: '2021', 2020: '2020', 2019: '2019',
  2018: null, 2017: null, 2016: '2016', 2015: '2015', 2014: '2013-2014', 2013: '2013-2014',
  };
  return Object.hasOwn(categoriesByBirthYear, birthYear) ? categoriesByBirthYear[birthYear] : undefined;
};

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
       (SELECT COALESCE(SUM(monto), 0) FROM mensualidades
         WHERE anio = ${year} AND mes = ${month} AND estado_pago IN ('OK', '$')) AS monthlyIncome,
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
              OR (NULLIF(TRIM(j.nombre_papa), '') IS NOT NULL AND NULLIF(TRIM(j.celular_papa), '') IS NOT NULL))) AS playersWithoutGuardianContact,
       (SELECT COUNT(*) FROM jugadores j
          WHERE j.estado_inscripcion = 'OK' AND COALESCE(j.n_registro, '') NOT IN ('RET', 'EXP')
            AND (SELECT COUNT(*) FROM documentos_jugadores d WHERE d.jugador_id = j.id AND d.estado = 'Verificado') < 6) AS playersWithIncompleteDocuments`,
  );

  const [recentPaymentRows] = await db.execute(
        `SELECT m.id, j.nombre_jugador AS student, m.anio, m.mes, m.monto,
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
  const playersWithIncompleteDocuments = Number(summary.playersWithIncompleteDocuments);

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
      playersWithIncompleteDocuments,
      monthlyIncome: Number(summary.monthlyIncome),
    },
    recentPayments: recentPaymentRows.map((payment) => ({
      id: payment.id,
      student: payment.student,
      concept: `Mensualidad ${payment.mes}/${payment.anio}`,
      status: PAID_STATUSES.includes(payment.paymentStatus) ? 'Pagado' : 'Pendiente',
      date: payment.paymentDate,
      amount: payment.monto === null ? null : Number(payment.monto),
    })),
    alerts: [
      ...(pendingPayments > 0 ? [`${pendingPayments} mensualidades están pendientes en el periodo seleccionado`] : []),
      ...(playersWithoutUniform > 0 ? [`${playersWithoutUniform} jugadores activos no tienen uniforme registrado`] : []),
      ...(playersWithoutGuardianContact > 0 ? [`ATENCIÓN: ${playersWithoutGuardianContact} jugadores activos no tienen un acudiente completo (nombre y teléfono)`] : []),
      ...(playersWithIncompleteDocuments > 0 ? [`${playersWithIncompleteDocuments} expedientes tienen documentos pendientes de verificación`] : []),
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
          j.categoria AS category,
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

export const createPlayer = async ({ name, documentNumber, birthYear, category, registrationNumber, motherName, motherPhone, fatherName, fatherPhone }) => {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const year = Number.parseInt(birthYear, 10);
  const selectedCategory = typeof category === 'string' ? category.trim() : '';
  const expectedCategory = categoryForBirthYear(year);
  if (!normalizedName || !Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
    throw fail('Ingresa el nombre y un año de nacimiento válido');
  }
  if (!CATEGORIES.includes(selectedCategory) || expectedCategory === undefined || (expectedCategory && selectedCategory !== expectedCategory)) {
    throw fail('La categoría no corresponde al año de nacimiento');
  }

  const values = [motherName, motherPhone, fatherName, fatherPhone].map((value) => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || null;
  });
  if (!((values[0] && values[1]) || (values[2] && values[3]))) {
    throw fail('Registra nombre y teléfono de al menos un acudiente');
  }
  const [result] = await db.execute(
    `INSERT INTO jugadores
       (n_registro, nombre_jugador, anio_nacimiento, categoria, numero_documento,
        nombre_mama, celular_mama, nombre_papa, celular_papa, estado_inscripcion, fecha_inscripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OK', CURRENT_DATE())`,
    [registrationNumber?.trim() || null, normalizedName, year, selectedCategory, documentNumber?.trim() || null, ...values],
  );
  return { id: result.insertId, name: normalizedName, birthYear: year, category: selectedCategory };
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
        `SELECT m.id, j.id AS playerId, j.nombre_jugador AS playerName, j.anio_nacimiento AS birthYear,
          j.categoria AS category,
            m.anio AS year, m.mes AS month, m.estado_pago AS paymentStatus,
            m.fecha_pago AS paymentDate, m.monto AS amount, m.numero_comprobante AS receiptNumber
      FROM jugadores j
      LEFT JOIN mensualidades m ON m.jugador_id = j.id AND m.anio = ? AND m.mes = ?
      WHERE j.estado_inscripcion = 'OK' AND COALESCE(j.n_registro, '') NOT IN ('RET', 'EXP')
      ORDER BY j.nombre_jugador ASC
      LIMIT ? OFFSET ?`,
    [year, month, limit, offset],
  );

  return rows.map((row) => ({
    ...row,
    paymentStatus: PAID_STATUSES.includes(row.paymentStatus) ? 'Pagado' : 'Pendiente',
    amount: row.amount === null ? null : Number(row.amount),
  }));
};

export const registerPayment = async ({ playerId, year, month, receiptNumber }) => {
  const [[player]] = await db.execute(
    `SELECT anio_nacimiento AS birthYear, categoria AS category
       FROM jugadores
      WHERE id = ? AND estado_inscripcion = 'OK' AND COALESCE(n_registro, '') NOT IN ('RET', 'EXP')`,
    [playerId],
  );
  if (!player) throw fail('No se encontró un jugador activo con ese identificador', 404);

  const amount = player.category === '2022-2023' ? 80000 : 110000;
  const normalizedReceipt = typeof receiptNumber === 'string' ? receiptNumber.trim() : '';
  if (!normalizedReceipt) throw fail('Ingresa el número del comprobante de pago');
  await db.execute(
    `INSERT INTO mensualidades (jugador_id, anio, mes, estado_pago, fecha_pago, monto, numero_comprobante)
     VALUES (?, ?, ?, 'OK', NOW(), ?, ?)
     ON DUPLICATE KEY UPDATE estado_pago = 'OK', fecha_pago = NOW(), monto = VALUES(monto), numero_comprobante = VALUES(numero_comprobante)`,
    [playerId, year, month, amount, normalizedReceipt || null],
  );
  return { playerId, year, month, amount, receiptNumber: normalizedReceipt || null, paymentStatus: 'OK' };
};

export const getDocuments = async (playerId) => {
  const [[player]] = await db.execute('SELECT id, nombre_jugador AS name FROM jugadores WHERE id = ?', [playerId]);
  if (!player) throw fail('Jugador no encontrado', 404);
  await db.execute(
    `INSERT IGNORE INTO documentos_jugadores (jugador_id, tipo, version, estado)
     VALUES ${DOCUMENT_TYPES.map(() => '(?, ?, 1, \'Pendiente\')').join(', ')}`,
    DOCUMENT_TYPES.flatMap((document) => [playerId, document.id]),
  );
  const [rows] = await db.execute(
    `SELECT d.tipo AS id, d.estado AS status, d.version,
            d.nombre_archivo AS fileName, d.retener_hasta AS retainUntil,
            d.actualizado_en AS updatedAt
       FROM documentos_jugadores d
       INNER JOIN (
         SELECT tipo, MAX(version) AS version
           FROM documentos_jugadores WHERE jugador_id = ? GROUP BY tipo
       ) current ON current.tipo = d.tipo AND current.version = d.version
      WHERE d.jugador_id = ?`,
    [playerId, playerId],
  );
  return { player, documents: DOCUMENT_TYPES.map((document) => ({
    ...document,
    ...rows.find((row) => row.id === document.id),
  })) };
};

export const updateDocumentStatus = async ({ playerId, type, status }) => {
  const document = DOCUMENT_TYPES.find((item) => item.id === type);
  if (!document || !DOCUMENT_STATUSES.includes(status)) throw fail('El documento o estado indicado no es válido');
  const [[player]] = await db.execute('SELECT id FROM jugadores WHERE id = ?', [playerId]);
  if (!player) throw fail('Jugador no encontrado', 404);
  const [[current]] = await db.execute(
    `SELECT id FROM documentos_jugadores
      WHERE jugador_id = ? AND tipo = ? ORDER BY version DESC LIMIT 1`,
    [playerId, type],
  );
  if (current) {
    await db.execute(
      `UPDATE documentos_jugadores SET estado = ? WHERE id = ?`,
      [status, current.id],
    );
    return { playerId, type, status };
  }
  await db.execute(
    `INSERT INTO documentos_jugadores (jugador_id, tipo, version, estado)
     VALUES (?, ?, 1, ?)`,
    [playerId, type, status],
  );
  return { playerId, type, status };
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
