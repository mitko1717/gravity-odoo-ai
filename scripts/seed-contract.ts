import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

interface RuleSpec {
  name: string;
  model: string;
  preDomain: string;
  domain: string;
  codeFile: string;
}

const RULES: RuleSpec[] = [
  {
    name: 'Gravity: замовлення підтверджено → рахунок на передоплату',
    model: 'sale.order',
    preDomain: "[('state', '!=', 'sale')]",
    domain: "[('state', '=', 'sale')]",
    codeFile: 'odoo/contract/order-confirmed.py',
  },
  {
    name: 'Gravity: передоплату отримано → PM запускає закупівлі',
    model: 'account.move',
    preDomain: "[('payment_state', 'not in', ['paid', 'in_payment'])]",
    domain: "[('move_type', '=', 'out_invoice'), ('payment_state', 'in', ['paid', 'in_payment'])]",
    codeFile: 'odoo/contract/prepayment-paid.py',
  },
];

const odoo = OdooClient.fromEnv();

for (const rule of RULES) {
  const [modelId] = await odoo.search('ir.model', [['model', '=', rule.model]]);
  if (modelId === undefined) throw new Error(`model not found: ${rule.model}`);

  const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', rule.name]], {
    name: rule.name,
    model_id: modelId,
    trigger: 'on_write',
    filter_pre_domain: rule.preDomain,
    filter_domain: rule.domain,
  });

  await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${rule.name} (code)`]], {
    name: `${rule.name} (code)`,
    model_id: modelId,
    state: 'code',
    usage: 'base_automation',
    base_automation_id: automationId,
    code: await readFile(rule.codeFile, 'utf8'),
  });

  console.log(`${rule.name} -> ${automationId}`);
}
