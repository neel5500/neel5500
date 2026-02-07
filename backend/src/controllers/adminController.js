import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { logAudit } from '../utils/audit.js';

export async function createUser(req, res) {
  const { full_name, email, password, role } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, full_name, email, role, is_active, created_at`,
    [full_name, email, password_hash, role]
  );

  await logAudit({ userId: req.user.sub, action: 'CREATE_USER', entityType: 'USER', entityId: result.rows[0].id });
  res.status(201).json(result.rows[0]);
}

export async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { is_active } = req.body;

  const result = await query(
    'UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, full_name, email, role, is_active',
    [is_active, id]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ message: 'User not found' });
  }

  await logAudit({ userId: req.user.sub, action: 'UPDATE_USER_STATUS', entityType: 'USER', entityId: id, metadata: { is_active } });
  res.json(result.rows[0]);
}

export async function dashboardSummary(req, res) {
  const [stock, inwardVsOutward, overdue, lowStock, partyWise] = await Promise.all([
    query('SELECT COALESCE(SUM(quantity),0) AS total_inward FROM stock_inward'),
    query('SELECT (SELECT COALESCE(SUM(quantity),0) FROM stock_inward) AS inward, (SELECT COALESCE(SUM(quantity_dispatched),0) FROM stock_outward) AS outward'),
    query("SELECT COUNT(*)::int AS overdue_jobs FROM stock_inward WHERE due_date < CURRENT_DATE AND status = 'PENDING'"),
    query(`SELECT * FROM (
      SELECT si.id, si.product_name, si.quantity - COALESCE(SUM(so.quantity_dispatched),0) AS remaining
      FROM stock_inward si
      LEFT JOIN stock_outward so ON si.id = so.inward_id
      GROUP BY si.id
    ) q WHERE q.remaining < 10`),
    query('SELECT party_name, SUM(quantity) AS inward_qty FROM stock_inward GROUP BY party_name ORDER BY inward_qty DESC LIMIT 10')
  ]);

  res.json({
    total_inward: Number(stock.rows[0].total_inward),
    inward_outward: inwardVsOutward.rows[0],
    overdue_jobs: overdue.rows[0].overdue_jobs,
    low_stock_items: lowStock.rows,
    party_wise: partyWise.rows
  });
}

export async function listAuditLogs(req, res) {
  const result = await query(
    `SELECT al.*, u.full_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT 500`
  );
  res.json(result.rows);
}
