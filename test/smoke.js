/* 冒烟测试：在 node 中加载数据 + 引擎，模拟大量人生，验证健壮性 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = vm.createContext({ Math, console, JSON });
function load(f) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
}
['js/data/talents.js', 'js/data/items.js', 'js/data/skills.js', 'js/data/cards.js', 'js/data/relics.js', 'js/data/dungeons.js',
 'js/data/rogue_data.js', 'js/data/worlds.js', 'js/data/templates.js',
 'js/data/events_reality.js', 'js/data/events_cultivation.js',
 'js/data/events_novel.js', 'js/data/events_hidden.js', 'js/data/events_social.js', 'js/data/events_sudden.js', 'js/data/endings.js',
 'js/data/achievements.js', 'js/engine.js'].forEach(load);

const { TALENTS, ENDINGS, ACHIEVEMENTS, ALL_EVENTS, EVENTS_SUDDEN, Engine,
        ITEMS, SKILLS, CARDS, SKILL_TO_CARD, RELICS, DUNGEONS, ROGUE_MOBS, ROGUE_ELITES, ROGUE_BOSSES, ROGUE_EVENTS,
        WORLDS, TEMPLATES } = ctx;

let errors = 0;
function err(msg) { errors++; console.error('  [ERR] ' + msg); }

/* ---------- 静态检查 ---------- */
console.log('== 静态检查 ==');
console.log('天赋 ' + TALENTS.length + ' / 事件 ' + ALL_EVENTS.length + ' / 结局 ' + ENDINGS.length + ' / 成就 ' + ACHIEVEMENTS.length);

// id 唯一
function checkIds(arr, label) {
  const seen = {};
  arr.forEach(x => {
    if (!x.id) err(label + ' 存在无 id 条目');
    else if (seen[x.id]) err(label + ' id 重复: ' + x.id);
    seen[x.id] = 1;
  });
}
checkIds(TALENTS, '天赋'); checkIds(ALL_EVENTS, '事件'); checkIds(ENDINGS, '结局'); checkIds(ACHIEVEMENTS, '成就');

// kill 事件必须有 deathText（含 choices 内）
ALL_EVENTS.forEach(e => {
  if (e.effect && e.effect.kill && !e.effect.deathText) err('事件 ' + e.id + ' kill 缺 deathText');
  (e.choices || []).forEach((c, i) => {
    if (c.effect && c.effect.kill && !c.effect.deathText) err('事件 ' + e.id + ' 选项' + i + ' kill 缺 deathText');
    if (!c.text) err('事件 ' + e.id + ' 选项' + i + ' 缺 text');
  });
  if (!e.text) err('事件 ' + e.id + ' 缺 text');
  if (e.effect && e.choices) err('事件 ' + e.id + ' 同时有 effect 与 choices');
  if (!e.effect && !e.choices) err('事件 ' + e.id + ' 既无 effect 也无 choices');
});

// cond.talent 引用必须存在
const talentIds = {}; TALENTS.forEach(t => talentIds[t.id] = 1);
ALL_EVENTS.forEach(e => {
  const refs = [];
  if (e.cond && e.cond.talent) refs.push(...(Array.isArray(e.cond.talent) ? e.cond.talent : [e.cond.talent]));
  if (e.cond && e.cond.notTalent) refs.push(...(Array.isArray(e.cond.notTalent) ? e.cond.notTalent : [e.cond.notTalent]));
  refs.forEach(r => { if (!talentIds[r]) err('事件 ' + e.id + ' 引用了不存在的天赋 ' + r); });
});

// setPool 目标必须有事件
const pools = {};
ALL_EVENTS.forEach(e => { pools[e.pool || 'life'] = (pools[e.pool || 'life'] || 0) + 1; });
console.log('事件池分布: ' + JSON.stringify(pools));
ALL_EVENTS.forEach(e => {
  const sets = [];
  if (e.effect && e.effect.setPool) sets.push(e.effect.setPool);
  (e.choices || []).forEach(c => { if (c.effect && c.effect.setPool) sets.push(c.effect.setPool); });
  sets.forEach(p => { if (!pools[p]) err('事件 ' + e.id + ' setPool 到空池 ' + p); });
});

// 年龄段覆盖（life 池；仅 attr/chance/minAge/maxAge 条件视为宽松条件）
console.log('== 年龄段覆盖（life池宽条件事件数） ==');
function isLooseCond(cond) {
  if (!cond) return true;
  var hard = ['talent', 'notTalent', 'flags', 'anyFlag', 'notFlags', 'gender', 'route'];
  for (var i = 0; i < hard.length; i++) if (cond[hard[i]] !== undefined) return false;
  return true;
}
for (let a = 0; a <= 100; a += 10) {
  const n = ALL_EVENTS.filter(e =>
    (e.pool || 'life') === 'life' &&
    (!e.age || (a >= e.age[0] && a <= e.age[1])) &&
    isLooseCond(e.cond)).length;
  if (n < 8 && a !== 0 && a < 100) err('年龄段 ' + a + '-' + (a + 9) + ' 宽松事件仅 ' + n + ' 条');
  if (a === 0 && n < 3) err('出生年事件不足');
  console.log('  ' + a + 's: ' + n);
}

// 结局兜底：必须存在无 cond 结局
if (!ENDINGS.some(e => !e.cond)) err('结局缺少无条件兜底');

// 突发事件文件：每条必须 sudden:true，且不得与普通事件重复 id
(EVENTS_SUDDEN || []).forEach(e => { if (!e.sudden) err('突发事件 ' + e.id + ' 缺 sudden:true'); });

/* ---------- v2 数据校验 ---------- */
const itemIds = {}; (ITEMS || []).forEach(i => itemIds[i.id] = 1);
const skillIds = {}; (SKILLS || []).forEach(s => skillIds[s.id] = 1);
function checkRefs(items, skills, where) {
  (items || []).forEach(id => { if (!itemIds[id]) err(where + ' 引用不存在物品 ' + id); });
  (skills || []).forEach(id => { if (!skillIds[id]) err(where + ' 引用不存在技能 ' + id); });
}
(DUNGEONS || []).forEach(d => {
  if (!d.enemies || !d.enemies.length) err('副本 ' + d.id + ' 无敌人');
  (d.enemies || []).forEach(e => checkRefs(null, e.skills, '副本' + d.id));
  if (d.reward) checkRefs(d.reward.items, d.reward.skills, '副本' + d.id + '奖励');
});
[['ROGUE_MOBS', ROGUE_MOBS], ['ROGUE_ELITES', ROGUE_ELITES], ['ROGUE_BOSSES', ROGUE_BOSSES]]
  .forEach(([nm, arr]) => (arr || []).forEach(e => checkRefs(null, e.skills, nm)));
(TEMPLATES || []).forEach(t => {
  checkRefs(t.items, t.skills, '模板' + t.id);
  (t.talents || []).forEach(id => { if (!talentIds[id]) err('模板 ' + t.id + ' 引用不存在天赋 ' + id); });
});
(WORLDS || []).forEach(w => {
  if (!w.mainline || w.mainline.length < 5) err('世界 ' + w.id + ' 主线不足 5 阶段');
  (w.mainline || []).forEach(q => { if (q.reward) checkRefs(q.reward.items, q.reward.skills, '主线' + w.id); });
});
// 事件 effect 中的物品/技能引用
ALL_EVENTS.forEach(e => {
  const effs = [];
  if (e.effect) effs.push(e.effect);
  (e.choices || []).forEach(c => { if (c.effect) effs.push(c.effect); });
  effs.forEach(ef => checkRefs(ef.items, ef.skills, '事件' + e.id));
});

// 卡牌数据
const cardIds = {};
(CARDS || []).forEach(c => {
  if (cardIds[c.id]) err('卡牌 id 重复: ' + c.id);
  cardIds[c.id] = 1;
  if (c.cost === undefined || c.cost < 0 || c.cost > 3) err('卡牌 ' + c.id + ' 费用异常');
  if (!c.dmg && !c.block && !c.heal && !c.draw && !c.str && !c.poison) err('卡牌 ' + c.id + ' 无效果');
});
for (const sid in (SKILL_TO_CARD || {})) {
  if (!skillIds[sid]) err('SKILL_TO_CARD 引用不存在技能 ' + sid);
  if (!cardIds[SKILL_TO_CARD[sid]]) err('SKILL_TO_CARD 引用不存在卡牌 ' + SKILL_TO_CARD[sid]);
}

// 成就 check 在空对象上不抛异常
ACHIEVEMENTS.forEach(a => {
  try { a.check({ attr: {}, flags: {}, talents: [], age: 0 }, { stats: {}, endings: [] }); }
  catch (ex) { err('成就 ' + a.id + ' check 在空对象上抛异常: ' + ex.message); }
});

/* ---------- 动态模拟 ---------- */
console.log('== 动态模拟 300 次人生 ==');
const endingCount = {};
const routeCount = {};
let totalAge = 0, maxAgeSeen = 0, minAgeSeen = 999;

function pickTalents() {
  const shuffled = TALENTS.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

for (let run = 0; run < 300; run++) {
  const talents = pickTalents();
  const flags = {};
  talents.forEach(t => (t.flags || []).forEach(f => flags[f] = true));
  const attr = { chr: 0, int: 0, str: 0, mny: 0, spr: 0, luk: Engine.rnd(11) };
  talents.forEach(t => { if (t.attr) for (const k in t.attr) attr[k] = (attr[k] || 0) + t.attr[k]; });
  // 随机分配 20 点
  let p = 20;
  const keys = ['chr', 'int', 'str', 'mny', 'spr'];
  while (p > 0) { const k = keys[Engine.rnd(5)]; if (attr[k] < 10) { attr[k]++; p--; } }

  const life = {
    name: '测试', gender: Math.random() < 0.5 ? 'M' : 'F',
    age: -1, attr, talents, flags, fired: {}, pool: 'life', route: '',
    history: [], moments: [], dead: false, deathText: ''
  };

  let guard = 0;
  try {
    while (!life.dead && guard++ < 600) {
      life.age++;
      if (life.age > 0 && Engine.mortality(life)) { life.deathText = '自然死亡'; break; }
      const ev = Engine.pickEvent(life);
      if (!ev) { /* 平淡年 */ }
      else {
        life.fired[ev.id] = life.age;
        // text 函数可执行性
        const txt = typeof ev.text === 'function' ? ev.text(life) : ev.text;
        if (typeof txt !== 'string') err('事件 ' + ev.id + ' text 未返回字符串');
        let res;
        if (ev.choices) {
          const avail = ev.choices.filter(c => !c.cond || Engine.condPass(c.cond, life));
          const ch = (avail.length ? avail : ev.choices)[Engine.rnd((avail.length ? avail : ev.choices).length)];
          if (typeof ch.result === 'function') ch.result(life);
          res = Engine.applyEffect(life, ch.effect);
        } else {
          res = Engine.applyEffect(life, ev.effect);
        }
        if (res.killed) { life.deathText = res.deathText; break; }
      }
      const bd = Engine.checkBodyDeath(life);
      if (bd) { life.deathText = bd; break; }
      if (life.age >= 500) { life.deathText = '上限'; break; }
    }
  } catch (ex) {
    err('模拟第 ' + run + ' 次人生异常: ' + ex.message + '\n' + ex.stack.split('\n')[1]);
    continue;
  }

  // 结局
  let best = null;
  ENDINGS.forEach(e => {
    if (e.cond && !Engine.condPass(e.cond, life)) return;
    if (!best || (e.priority || 0) > (best.priority || 0)) best = e;
  });
  if (!best) { err('第 ' + run + ' 次人生无结局可匹配 (age=' + life.age + ')'); continue; }
  endingCount[best.id] = (endingCount[best.id] || 0) + 1;
  if (life.route) routeCount[life.route] = (routeCount[life.route] || 0) + 1;
  totalAge += life.age;
  if (life.age > maxAgeSeen) maxAgeSeen = life.age;
  if (life.age < minAgeSeen) minAgeSeen = life.age;

  // 成就 check 全量跑一遍
  ACHIEVEMENTS.forEach(a => {
    try { a.check(life, { stats: { lives: 1 }, endings: [] }); }
    catch (ex) { err('成就 ' + a.id + ' check 抛异常: ' + ex.message); }
  });
}

console.log('平均享年 ' + (totalAge / 300).toFixed(1) + ' / 最短 ' + minAgeSeen + ' / 最长 ' + maxAgeSeen);
console.log('结局分布（前15）:');
Object.entries(endingCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([id, n]) => console.log('  ' + id + ': ' + n));
console.log('路线分布: ' + JSON.stringify(routeCount));

/* 定向验证：直接修仙界开局（box_opened 已置位），验证修仙线可达飞升 */
console.log('== 定向验证：修仙线 ==');
let ascended = 0, tribFail = 0, opened = 0;
for (let run = 0; run < 60; run++) {
  const life = {
    name: '修士', gender: 'M', age: 99,
    attr: { chr: 8, int: 45, str: 65, mny: 5, spr: 15, luk: 25 },
    talents: [], flags: { box_opened: true, immortal_body: true }, fired: {}, pool: 'xiuxian', route: 'xiuxian',
    history: [], moments: [], dead: false, deathText: ''
  };
  let guard = 0;
  while (!life.dead && guard++ < 600) {
    life.age++;
    if (life.age > 0 && Engine.mortality(life)) { life.deathText = '自然死亡'; break; }
    const ev = Engine.pickEvent(life);
    if (ev) {
      life.fired[ev.id] = life.age;
      let res;
      if (ev.choices) {
        const avail = ev.choices.filter(c => !c.cond || Engine.condPass(c.cond, life));
        const ch = (avail.length ? avail : ev.choices)[0];
        res = Engine.applyEffect(life, ch.effect);
      } else res = Engine.applyEffect(life, ev.effect);
      if (res.killed) { life.deathText = res.deathText; break; }
    }
    if (Engine.checkBodyDeath(life)) { life.deathText = '病死'; break; }
    if (life.age >= 500) break;
  }
  if (life.flags.ascended) ascended++;
  if (life.flags.tribulation_failed) tribFail++;
  if (life.flags.box_opened) opened++;
}
console.log('60 次修仙人生: 开盒 ' + opened + ' / 渡劫失败 ' + tribFail + ' / 飞升 ' + ascended);
if (opened === 0) err('修仙线从未开盒！');
if (ascended === 0) err('修仙线从未飞升（60次高属性局），检查渡劫条件');

console.log('');
if (errors === 0) console.log('==== 全部通过 ====');
else { console.log('==== 发现 ' + errors + ' 个问题 ===='); process.exit(1); }
