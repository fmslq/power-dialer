// Текст скрипта Google Apps Script. НЕ ТРОГАТЬ: дословная копия блока <script type="text/plain" id="gs"> из старого index.html.
// tests/dialer.tests.js сверяет его по хешу (защита от случайной правки).
export const GS_PLACEHOLDER='ПРИДУМАЙ-СВОЁ-СЛОВО';
export const APPS_SCRIPT=String.raw`// Power Dialer → Google Sheets (версия 2). Вставь целиком в Расширения → Apps Script.
const SECRET = 'ПРИДУМАЙ-СВОЁ-СЛОВО';
const VERSION = 4;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, code: 'secret', err: 'secret' });
    // Таблица выбирается ссылкой (d.sid), либо это таблица, к которой привязан скрипт.
    const ss = d.sid ? SpreadsheetApp.openById(d.sid) : SpreadsheetApp.getActive();
    if (!ss) return out(d.ping ? { ok: true, v: VERSION, standalone: true } : { ok: false, perm: true, code: 'other', err: 'нет таблицы: открой таблицу по ссылке в дайлере' });
    const hint = String(d.file || '').replace(/\.csv$/i, '').replace(/\s*\(\d+\)\s*$/, '').trim();
    let sh = null;
    if (d.sid) {
      const g = String(d.gid || '');
      sh = ss.getSheets().filter(s => String(s.getSheetId()) === g)[0] || ss.getSheets()[0];
    } else {
      ss.getSheets().forEach(s => {
        const n = s.getName();
        if (hint.endsWith(n) && (!sh || n.length > sh.getName().length)) sh = s;
      });
    }
    if (!sh) return out({ ok: false, perm: true, code: 'tab', err: 'нет вкладки для: ' + hint });
    const info = { doc: ss.getName(), tab: sh.getName(), gid: String(sh.getSheetId()), v: VERSION };
    if (d.ping) return out(Object.assign({ ok: true }, info));

    if (d.archive) {
      const nm = 'Deleted Power Dialer Leads';
      const a = ss.getSheetByName(nm) || ss.insertSheet(nm);
      const head = ['Deleted at', 'Source tab'].concat(d.head || []);
      const w = Math.max.apply(null, [head.length].concat((d.rows || []).map(r => r.length + 2)));
      const pad = r => { r = r.slice(); while (r.length < w) r.push(''); return r; };
      const props = PropertiesService.getScriptProperties();
      const pkey = 'ah_' + ss.getId(), hj = head.join('|');
      const lines = [];
      if (a.getLastRow() === 0 || props.getProperty(pkey) !== hj) { lines.push(pad(head)); props.setProperty(pkey, hj); }
      (d.rows || []).forEach(r => lines.push(pad([d.at || '', sh.getName()].concat(r))));
      const rg = a.getRange(a.getLastRow() + 1, 1, lines.length, w);
      rg.setNumberFormat('@');
      rg.setValues(lines);
      return out({ ok: true, n: (d.rows || []).length });
    }

    if (d.full) {
      let lc = Math.max(sh.getLastColumn(), 1);
      const h = sh.getRange(1, 1, 1, lc).getValues()[0].map(x => String(x).trim());
      ['Date Engaged', 'Result', 'Notes', 'Callback?'].forEach(n => {
        if (h.map(x => x.toLowerCase()).indexOf(n.toLowerCase()) < 0) { lc++; sh.getRange(1, lc).setValue(n); h.push(n); }
      });
      const lr = sh.getLastRow();
      const disp = lr > 1 ? sh.getRange(2, 1, lr - 1, lc).getDisplayValues() : [];
      const di = h.map(x => x.toLowerCase()).indexOf('date engaged');
      const dv = (lr > 1 && di >= 0) ? sh.getRange(2, di + 1, lr - 1, 1).getValues() : [];
      const tz = ss.getSpreadsheetTimeZone();
      const rows = [];
      disp.forEach((row, k) => {
        if (!row.some(x => x !== '')) return;
        if (di >= 0) { const v = dv[k][0]; row[di] = v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v); }
        rows.push({ r: k + 2, c: row });
      });
      return out(Object.assign({ ok: true, head: h, rows: rows }, info));
    }

    if (d.read) {
      const lc = sh.getLastColumn(), lr = sh.getLastRow();
      const h = sh.getRange(1, 1, 1, lc).getValues()[0].map(x => String(x).trim().toLowerCase());
      const ci = n => h.indexOf(n);
      const pi = ci('phone');
      if (pi < 0) return out({ ok: false, perm: true, code: 'phone', err: 'в таблице нет колонки Phone' });
      const tz = ss.getSpreadsheetTimeZone();
      const vals = lr > 1 ? sh.getRange(2, 1, lr - 1, lc).getValues() : [];
      const s = (row, i) => i < 0 ? null : String(row[i]);
      const rows = vals.map((row, k) => {
        const p = String(row[pi]).replace(/\D/g, '').slice(-10);
        if (p.length !== 10) return null;
        const di = ci('date engaged');
        let dt = di < 0 ? null : row[di];
        if (dt instanceof Date) dt = Utilities.formatDate(dt, tz, 'yyyy-MM-dd'); else if (dt !== null) dt = String(dt);
        return { r: k + 2, p: p, res: s(row, ci('result')), dt: dt, nt: s(row, ci('notes')), cb: s(row, ci('callback?')) };
      }).filter(Boolean);
      return out(Object.assign({ ok: true, rows: rows }, info));
    }

    lock.waitLock(20000);
    const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(x => String(x).trim().toLowerCase());
    const col = n => head.indexOf(n.toLowerCase()) + 1;
    const pc = col('phone');
    if (!pc) return out({ ok: false, perm: true, code: 'phone', err: 'в таблице нет колонки Phone' });
    const last = sh.getLastRow();
    const key = String(d.phone).replace(/\D/g, '').slice(-10);
    const phones = last > 1 ? sh.getRange(2, pc, last - 1, 1).getDisplayValues() : [];
    const hits = [];
    phones.forEach((r, i) => { if (String(r[0]).replace(/\D/g, '').slice(-10) === key) hits.push(i + 2); });
    if (!hits.length) return out({ ok: false, perm: true, code: 'row', err: 'номер не найден: ' + d.phone });
    let row = hits.indexOf(d.row) >= 0 ? d.row : hits[0];
    const bc = col('business');
    if (hits.length > 1 && hits.indexOf(d.row) < 0 && bc) {
      const m = hits.filter(r => String(sh.getRange(r, bc).getValue()).trim() === String(d.biz).trim());
      if (m.length) row = m[0];
    }
    const set = d.set || {};
    // сначала проверяем статус по выпадающему списку, чтобы не записывать половину данных
    const rc = col('result');
    if (rc && set.Result) {
      const rule = sh.getRange(row, rc).getDataValidation();
      if (rule && rule.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        const list = rule.getCriteriaValues()[0];
        if (list.indexOf(set.Result) < 0) {
          return out({ ok: false, perm: true, code: 'validation', err: 'нет в списке: ' + set.Result });
        }
      }
    }
    Object.keys(set).forEach(k => {
      const c = col(k);
      if (!c) return;
      let v = set[k];
      if (k.toLowerCase() === 'date engaged' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const p = v.split('-');
        v = new Date(+p[0], +p[1] - 1, +p[2]);
      }
      sh.getRange(row, c).setValue(v);
    });
    SpreadsheetApp.flush();
    return out(Object.assign({ ok: true, row: row }, info));
  } catch (err) {
    const msg = String(err && err.message || err);
    const validation = /проверк\S* данных|data validation/i.test(msg);
    return out({ ok: false, perm: validation, code: validation ? 'validation' : 'other', err: msg });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Запусти один раз (кнопка «Выполнить»), чтобы выдать скрипту доступ к таблицам.
function authorize() { return String(SpreadsheetApp.getActive() ? 'ok' : 'ok'); }

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Необязательно: запусти один раз на НОВОЙ вкладке без списка статусов, чтобы получить список с цветами.
// В твоей основной таблице список уже есть, там запускать ничего не нужно.
const COLORS = {
  'GATEKEEPER НЕ ПРОПУСТИЛ': ['#b3261e', '#ffffff'],
  'DM Pitched & Hung up': ['#c98a2b', '#000000'],
  'OWNER HUNG UP/NOT INTERESTED': ['#d9822b', '#ffffff'],
  'Автоответчик (leaved vm)': ['#f6cfc7', '#7a1f13'],
  'Автоответчик/Нет ответа': ['#f4cdb0', '#7a3a13'],
  'Автоответчик (сразу перенаправляет) или просто не перезванивать': ['#e0602a', '#ffffff'],
  'Menu (=not owner mobile number)': ['#f7e3a0', '#5a4500'],
  'Не соединяет': ['#2f5d73', '#ffffff'],
  'Номер не рабочий': ['#6b3a12', '#ffffff'],
  'Непонятная хуйня': ['#444444', '#ffffff'],
  'Call back': ['#ddd0f0', '#3d2a73'],
  'CALL BOOKED': ['#2e7d4f', '#ffffff'],
  'Follow up in future': ['#5b3a9b', '#ffffff'],
  'Not called': ['#e6e6e6', '#000000'],
  'Другое': ['#f5e06b', '#000000'],
  'CONDUCTED DISCOVERY CALL': ['#2e7d4f', '#ffffff']
};

function setupResultColumn() {
  const sh = SpreadsheetApp.getActiveSheet();
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(x => String(x).trim().toLowerCase());
  const c = head.indexOf('result') + 1;
  if (!c) throw new Error('Нет колонки Result');
  const rng = sh.getRange(2, c, Math.max(sh.getMaxRows() - 1, 1), 1);
  const names = Object.keys(COLORS);
  rng.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(names, true).setAllowInvalid(true).build());
  const rules = sh.getConditionalFormatRules().filter(r => !r.getRanges().some(x => x.getColumn() === c));
  names.forEach(n => rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(n).setBackground(COLORS[n][0]).setFontColor(COLORS[n][1]).setRanges([rng]).build()));
  sh.setConditionalFormatRules(rules);
}
`;
// getAppsScript: бывшая copyGs(). Секретное слово очищается от кавычек/слэшей/пробелов и подставляется в код.
export const cleanSecret=t=>String(t||'').replace(/['"\\\s]/g,'');
export function getAppsScript(secret){const t=cleanSecret(secret);if(!t)return null;return APPS_SCRIPT.replace(GS_PLACEHOLDER,()=>t)}
