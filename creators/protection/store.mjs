export async function event(env, campaignId, type, actorUid, payload = {}) {
  const id = crypto.randomUUID();
  await env.CREATOR_DB.prepare('INSERT INTO cp_events(id,campaign_id,event_type,actor_uid,payload_json,created_at) VALUES(?,?,?,?,?,?)')
    .bind(id, campaignId, type, actorUid, JSON.stringify(payload).slice(0, 30000), new Date().toISOString()).run();
  return id;
}

export async function campaignById(env, id) {
  const row = await env.CREATOR_DB.prepare('SELECT * FROM cp_campaigns WHERE id=?').bind(id).first();
  if (!row) return null;
  return {
    ...row,
    deliverables: JSON.parse(row.deliverables_json || '[]'),
    milestones: JSON.parse(row.milestones_json || '[]'),
    mealsIncluded: Boolean(row.meals_included),
    creatorFeeMinor: Number(row.creator_fee_minor),
    travelReimbursementMinor: Number(row.travel_reimbursement_minor),
    creatorReceivesMinor: Number(row.creator_receives_minor),
    totalPayableMinor: Number(row.total_payable_minor)
  };
}

export async function updateStatus(env, campaign, next, actorUid, type, patch = {}) {
  const stamp = new Date().toISOString();
  const providerRef = patch.providerRef ?? campaign.provider_ref ?? '';
  const creatorUid = patch.creatorUid ?? campaign.creator_uid ?? '';
  const result = await env.CREATOR_DB.prepare('UPDATE cp_campaigns SET status=?, provider_ref=?, creator_uid=?, updated_at=? WHERE id=? AND status=?')
    .bind(next, providerRef, creatorUid, stamp, campaign.id, campaign.status).run();
  if (Number(result.meta?.changes || 0) !== 1) throw Object.assign(new Error('Campaign changed; refresh and try again'), { status: 409 });
  await event(env, campaign.id, type, actorUid, { from: campaign.status, to: next, ...patch });
  return { ...campaign, status: next, provider_ref: providerRef, creator_uid: creatorUid, updated_at: stamp };
}

export async function listCampaigns(env, actor, fundedOnly = false) {
  let sql = 'SELECT id,title,destination,kind,status,creator_slots,creator_fee_minor,travel_reimbursement_minor,creator_receives_minor,total_payable_minor,accommodation_nights,meals_included,usage_rights,application_deadline,travel_start,brand_uid,creator_uid,provider,updated_at FROM cp_campaigns';
  const binds = [];
  if (actor.role === 'brand') { sql += ' WHERE brand_uid=?'; binds.push(actor.uid); }
  else if (actor.role === 'creator') {
    sql += " WHERE (status='published' OR creator_uid=?) AND (kind!='barter' OR ?=1) AND (kind='barter' OR creator_fee_minor>=?)";
    binds.push(actor.uid, actor.acceptsBarter ? 1 : 0, actor.minimumPaidCampaignMinor || 0);
  } else if (actor.role !== 'admin') { sql += " WHERE status IN ('published','funded')"; }
  if (fundedOnly) {
    const protectedStates = "('funded','in_progress','submitted','approved','disputed','release_pending','paid')";
    sql += sql.includes(' WHERE ') ? ` AND status IN ${protectedStates}` : ` WHERE status IN ${protectedStates}`;
  }
  sql += ' ORDER BY updated_at DESC LIMIT 100';
  const result = await env.CREATOR_DB.prepare(sql).bind(...binds).all();
  return (result.results || []).map(row => ({ ...row, mealsIncluded: Boolean(row.meals_included) }));
}
