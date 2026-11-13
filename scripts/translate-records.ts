import { OdooClient, OdooError } from '../src/odoo-client.js';
import { NAMED_MODELS, NAME_PAIRS, RENAME_PAIRS, type RenamePair } from './translate-map.js';

// Renames existing Odoo records from Ukrainian to English names (exact match) before seeds run with English names.
// Usage: npm run translate:records        (dry run)
//        npm run translate:records -- --apply

const APPLY = process.argv.includes('--apply');
const odoo = OdooClient.fromEnv();

let renamed = 0;
let missing = 0;

const namedPairs: RenamePair[] = NAME_PAIRS.flatMap(([uk, en]) =>
  NAMED_MODELS.map(([model, field]): RenamePair => [model, field, uk, en]),
);

for (const [model, field, uk, en] of [...RENAME_PAIRS, ...namedPairs]) {
  let ids: number[];

  try {
    ids = await odoo.search(model, [[field, '=', uk]]);
  } catch (error) {
    if (!(error instanceof OdooError)) throw error;
    console.log(`${model}: skipped (${error.status})`);
    continue;
  }

  if (ids.length === 0) {
    missing++;
    continue;
  }

  console.log(`${model} ${ids.join(',')}: «${uk}» → «${en}»`);
  renamed += ids.length;

  if (APPLY) await odoo.write(model, ids, { [field]: en });
}

// The bot remembers each task's stage name to detect changes; translate them too, or every task looks "changed".
const BOT_STATE_KEY = 'gravity_bot.state';
const stageNames = new Map(RENAME_PAIRS.filter(([model]) => model === 'project.task.type').map(([, , uk, en]) => [uk, en]));
const [stateParam] = await odoo.searchRead<{ id: number; value: string }>('ir.config_parameter', [['key', '=', BOT_STATE_KEY]], ['id', 'value']);

if (stateParam !== undefined) {
  const state = JSON.parse(stateParam.value) as { taskStages?: Record<string, string> };
  const taskStages = state.taskStages ?? {};
  let changedStages = 0;

  for (const [taskId, stage] of Object.entries(taskStages)) {
    const translated = stageNames.get(stage);
    if (translated === undefined) continue;

    taskStages[taskId] = translated;
    changedStages++;
  }

  console.log(`bot state: ${changedStages} task stages to translate`);

  if (APPLY) await odoo.write('ir.config_parameter', [stateParam.id], { value: JSON.stringify(state, null, 2) });
}

console.log(`records: ${renamed}, pairs not found: ${missing}`);
console.log(APPLY ? 'applied' : 'dry run: add -- --apply to write');
