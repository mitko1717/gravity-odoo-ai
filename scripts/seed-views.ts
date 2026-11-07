import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Lead form tab «Gravity / AI» with the website and AI fields.

const VIEW_NAME = 'crm.lead.form.gravity.ai';

const ARCH = `
<xpath expr="//notebook" position="inside">
  <page string="Gravity / AI" name="gravity_ai">
    <group>
      <group string="Дані з форми">
        <field name="x_object_type"/>
        <field name="x_city"/>
        <field name="x_area_m2"/>
        <field name="x_service"/>
        <field name="x_budget_text"/>
      </group>
      <group string="AI-аналіз (рекомендація)">
        <field name="x_ai_status"/>
        <field name="x_ai_client_type"/>
        <field name="x_ai_priority"/>
        <field name="x_ai_services"/>
        <field name="x_ai_budget_usd"/>
        <field name="x_ai_timeline"/>
        <field name="x_ai_missing"/>
        <field name="x_ai_next_action"/>
      </group>
    </group>
    <group string="AI: опис і чернетка відповіді">
      <field name="x_ai_summary"/>
      <field name="x_ai_reply_draft"/>
      <field name="x_ai_raw" groups="base.group_no_one"/>
    </group>
  </page>
</xpath>`;

const odoo = OdooClient.fromEnv();
const [baseView] = await odoo.searchRead<{ res_id: number }>(
  'ir.model.data',
  [['module', '=', 'crm'], ['name', '=', 'crm_lead_view_form']],
  ['res_id'],
);

if (!baseView) throw new Error('crm.crm_lead_view_form not found');

const viewId = await ensureRecord(odoo, 'ir.ui.view', [['name', '=', VIEW_NAME]], {
  name: VIEW_NAME,
  model: 'crm.lead',
  type: 'form',
  inherit_id: baseView.res_id,
  arch_db: ARCH,
});

console.log(`view ${VIEW_NAME} -> ${viewId}`);
