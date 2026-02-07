import { query } from '../db/pool.js';
import { logAudit } from '../utils/audit.js';

export async function createInward(req, res) {
  const payload = req.body;
  const result = await query(
    `INSERT INTO stock_inward
      (product_name, item_category, quantity, unit, party_name, entry_date, due_date, storage_location, coating_type, remarks, image_urls, uploaded_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      payload.product_name,
      payload.item_category,
      payload.quantity,
      payload.unit,
      payload.party_name,
      payload.entry_date || new Date(),
      payload.due_date,
      payload.storage_location,
      payload.coating_type,
      payload.remarks,
      JSON.stringify(payload.image_urls || []),
      req.user.sub,
      payload.status || 'PENDING'
    ]
  );

  await logAudit({ userId: req.user.sub, action: 'CREATE_INWARD', entityType: 'STOCK_INWARD', entityId: result.rows[0].id });
  res.status(201).json(result.rows[0]);
}

export async function createOutward(req, res) {
  const payload = req.body;
  const inwardResult = await query('SELECT id, quantity FROM stock_inward WHERE id = $1', [payload.inward_id]);
  const inward = inwardResult.rows[0];
  if (!inward) {
    return res.status(404).json({ message: 'Linked inward stock not found' });
  }

  const dispatchedResult = await query('SELECT COALESCE(SUM(quantity_dispatched),0) AS total FROM stock_outward WHERE inward_id = $1', [payload.inward_id]);
  const alreadyDispatched = Number(dispatchedResult.rows[0].total || 0);
  const remaining = Number(inward.quantity) - alreadyDispatched;

  if (Number(payload.quantity_dispatched) > remaining) {
    return res.status(400).json({ message: 'Dispatch quantity exceeds remaining stock' });
  }

  const result = await query(
    `INSERT INTO stock_outward (inward_id, quantity_dispatched, party_name, dispatch_date, delivery_status, photos_before_dispatch, remarks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      payload.inward_id,
      payload.quantity_dispatched,
      payload.party_name,
      payload.dispatch_date || new Date(),
      payload.delivery_status || 'IN_TRANSIT',
      JSON.stringify(payload.photos_before_dispatch || []),
      payload.remarks,
      req.user.sub
    ]
  );

  await logAudit({ userId: req.user.sub, action: 'CREATE_OUTWARD', entityType: 'STOCK_OUTWARD', entityId: result.rows[0].id });

  const recalcResult = await query(
    `SELECT si.id, si.quantity - COALESCE(SUM(so.quantity_dispatched),0) AS remaining_quantity
     FROM stock_inward si
     LEFT JOIN stock_outward so ON so.inward_id = si.id
     WHERE si.id = $1
     GROUP BY si.id`,
    [payload.inward_id]
  );

  res.status(201).json({ outward: result.rows[0], remaining_quantity: Number(recalcResult.rows[0].remaining_quantity) });
}

export async function listStock(req, res) {
  const result = await query(
    `SELECT si.*, COALESCE(SUM(so.quantity_dispatched), 0) AS dispatched,
            si.quantity - COALESCE(SUM(so.quantity_dispatched),0) AS remaining
     FROM stock_inward si
     LEFT JOIN stock_outward so ON so.inward_id = si.id
     GROUP BY si.id
     ORDER BY si.entry_date DESC`
  );
  res.json(result.rows);
}
