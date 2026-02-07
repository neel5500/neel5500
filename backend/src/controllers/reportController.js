import { query } from '../db/pool.js';

export async function searchStock(req, res) {
  const { party, product, coating_type, start_date, end_date, due_date, location } = req.query;
  const conditions = [];
  const params = [];

  if (party) {
    params.push(`%${party}%`);
    conditions.push(`si.party_name ILIKE $${params.length}`);
  }
  if (product) {
    params.push(`%${product}%`);
    conditions.push(`si.product_name ILIKE $${params.length}`);
  }
  if (coating_type) {
    params.push(coating_type);
    conditions.push(`si.coating_type = $${params.length}`);
  }
  if (location) {
    params.push(location);
    conditions.push(`si.storage_location = $${params.length}`);
  }
  if (start_date && end_date) {
    params.push(start_date, end_date);
    conditions.push(`si.entry_date BETWEEN $${params.length - 1} AND $${params.length}`);
  }
  if (due_date) {
    params.push(due_date);
    conditions.push(`si.due_date = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT si.*, COALESCE(SUM(so.quantity_dispatched),0) AS dispatched,
            si.quantity - COALESCE(SUM(so.quantity_dispatched),0) AS remaining
     FROM stock_inward si
     LEFT JOIN stock_outward so ON so.inward_id = si.id
     ${whereSql}
     GROUP BY si.id
     ORDER BY si.entry_date DESC`,
    params
  );

  res.json(result.rows);
}

export async function reportSummary(req, res) {
  const { type = 'daily' } = req.query;
  const bucket = type === 'monthly' ? "DATE_TRUNC('month', entry_date)" : "DATE_TRUNC('day', entry_date)";

  const inward = await query(`SELECT ${bucket} AS bucket, SUM(quantity) AS total FROM stock_inward GROUP BY bucket ORDER BY bucket DESC LIMIT 60`);
  const outward = await query(`SELECT ${bucket.replace('entry_date', 'dispatch_date')} AS bucket, SUM(quantity_dispatched) AS total FROM stock_outward GROUP BY bucket ORDER BY bucket DESC LIMIT 60`);
  const pendingJobWork = await query("SELECT * FROM stock_inward WHERE item_category = 'job_work' AND status = 'PENDING' ORDER BY due_date ASC");

  res.json({ inward: inward.rows, outward: outward.rows, pending_job_work: pendingJobWork.rows });
}
