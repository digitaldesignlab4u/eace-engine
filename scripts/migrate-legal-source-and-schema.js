#!/usr/bin/env node
/**
 * One-off migration (Tasks 2 & 3): adds a `legal_source_id` field to every
 * question object (derived from its existing free-text `source` string) and
 * a versioned-schema block (question_version / pool_version / review_status /
 * review_date). Also inserts the LEGAL_SOURCES registry the ids reference.
 *
 * Surgical, line-based edit (not a full re-serialize): every question object
 * in QUESTIONS/QUESTIONS_SECTOR follows the fixed two-line header
 *   id:'qN', role:'xxx',      (or sector:'xxx')
 *   source:"...",
 * so this script rewrites just those two lines and leaves everything else
 * (question text, options, alba/kai copy) byte-identical.
 *
 * Usage: node scripts/migrate-legal-source-and-schema.js
 * Idempotent: re-running on an already-migrated file is a no-op (detects
 * existing legal_source_id/question_version fields and leaves them alone).
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'eace-compliance-tasting-menu.html');
const POOL_VERSION = '2026-08';
const REVIEW_DATE = '2026-08-23';

const REG = 'Regulation (EU) 2024/1689';
const OMNIBUS = 'Regulation (EU) 2026/1744';

// ---- Article/Annex title data, sourced from the consolidated text of
// Regulation (EU) 2024/1689 and the amending Regulation (EU) 2026/1744
// (EUR-Lex CELEX 32024R1689 / 32026R1744). ----
const ARTICLE_TITLE = {
  '1': 'Subject matter', '2': 'Scope', '3': 'Definitions', '4': 'AI literacy',
  '4a': 'Processing of special categories of personal data for bias detection and correction',
  '5': 'Prohibited AI practices', '6': 'Classification rules for high-risk AI systems',
  '9': 'Risk management system', '10': 'Data and data governance', '11': 'Technical documentation',
  '12': 'Record-keeping', '13': 'Transparency and provision of information to deployers',
  '14': 'Human oversight', '15': 'Accuracy, robustness and cybersecurity',
  '16': 'Obligations of providers of high-risk AI systems', '17': 'Quality management system',
  '18': 'Documentation keeping', '19': 'Automatically generated logs',
  '20': 'Corrective actions and duty of information', '21': 'Cooperation with competent authorities',
  '22': 'Authorised representatives of providers of high-risk AI systems',
  '23': 'Obligations of importers', '24': 'Obligations of distributors',
  '25': 'Responsibilities along the AI value chain',
  '26': 'Obligations of deployers of high-risk AI systems',
  '27': 'Fundamental rights impact assessment for high-risk AI systems',
  '28': 'Notifying authorities',
  '40': 'Harmonised standards and standardisation deliverables',
  '41': 'Common specifications', '42': 'Presumption of conformity with certain requirements',
  '43': 'Conformity assessment', '44': 'Certificates', '47': 'EU declaration of conformity',
  '48': 'CE marking', '49': 'Registration',
  '50': 'Transparency obligations for providers and deployers of certain AI systems',
  '51': 'Classification of general-purpose AI models as general-purpose AI models with systemic risk',
  '52': 'Procedure', '53': 'Obligations for providers of general-purpose AI models',
  '54': 'Authorised representatives of providers of general-purpose AI models',
  '55': 'Obligations of providers of general-purpose AI models with systemic risk',
  '56': 'Codes of practice', '57': 'AI regulatory sandboxes',
  '60': 'Testing of high-risk AI systems in real world conditions outside AI regulatory sandboxes',
  '62': 'Measures for providers and deployers, in particular SMEs, including start-ups',
  '72': 'Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems',
  '73': 'Reporting of serious incidents',
  '95': 'Codes of conduct for voluntary application of specific requirements',
  '99': 'Penalties',
};

// Article 5(1) point-level short titles, grounded directly in the statutory
// text of Art. 5(1)(a)-(h) and points (ba)/(bb) inserted by the 2026 Digital
// Omnibus — distinct prohibited practices, so they get their own label
// instead of the generic Article 5 title.
const ART5_POINT_TITLE = {
  a: 'Subliminal, manipulative or deceptive techniques',
  b: 'Exploitation of vulnerabilities (age, disability, social/economic situation)',
  c: 'Social scoring',
  d: 'Individual criminal-offence risk prediction based solely on profiling',
  e: 'Untargeted scraping to create/expand facial-recognition databases',
  f: 'Emotion inference in workplace and education',
  g: 'Biometric categorisation inferring sensitive attributes',
  h: 'Real-time remote biometric identification in public spaces (law enforcement)',
  ba: 'Non-consensual intimate imagery (deepfake) generation or manipulation',
  bb: 'AI-generated child sexual abuse material (Art. 2 Directive 2011/93/EU)',
};

const ANNEX3_TITLE = {
  '2': 'Critical infrastructure',
  '3': 'Education and vocational training',
  '4': "Employment, workers' management and access to self-employment",
  '5': 'Access to and enjoyment of essential private and public services and benefits',
  '6': 'Law enforcement',
  '7': 'Migration, asylum and border control management',
  '8': 'Administration of justice and democratic processes',
};

// Provisions inserted or materially changed by the 2026 Digital Omnibus.
const AMENDED_IDS = new Set(['art4', 'art4a', 'art5_1_ba', 'art5_1_bb', 'art50_2', 'art3_14']);

function stripPrefix(s) {
  return s.replace(/^EU AI Act\s*\/\/\s*/, '').trim();
}

// Derives a normalised legal_source_id + display label from a free-text
// `source` string, taking the FIRST Article/Annex reference mentioned as the
// primary one (e.g. "Art. 6(1), Annex I" -> art6_1).
function extractPrimaryRef(raw) {
  const s = stripPrefix(raw);
  const artRe = /Art(?:icle|icles|s|\.)?\.?\s*(\d+[a-z]?)((?:\([0-9a-z]+\))*)/;
  const annexRe = /Annex\s+([IVX]+)((?:\([0-9a-z]+\))*)/;

  const artM = s.match(artRe);
  const annexM = s.match(annexRe);
  const artIdx = artM ? s.indexOf(artM[0]) : -1;
  const annexIdx = annexM ? s.indexOf(annexM[0]) : -1;

  if (artIdx === -1 && annexIdx === -1) {
    if (/Reg\.\s*\(EU\)\s*2026\/1744/.test(s)) return { id: 'reg_2026_1744', label: OMNIBUS };
    if (/Use-case classification/i.test(s)) return { id: 'use_case_classification', label: 'Use-case classification methodology' };
    if (/Whole-act method/i.test(s)) return { id: 'whole_act_method', label: 'Whole-Act interpretive method' };
    throw new Error('No article/annex reference found in source: ' + raw);
  }

  if (annexIdx !== -1 && (artIdx === -1 || annexIdx < artIdx)) {
    const roman = annexM[1];
    const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
    const num = romanMap[roman] || roman;
    const parts = (annexM[2].match(/\(([0-9a-z]+)\)/g) || []).map((x) => x.slice(1, -1));
    let id = 'annex' + num;
    let label = 'Annex ' + roman;
    parts.forEach((p) => { id += '_' + p; label += '(' + p + ')'; });
    return { id, label };
  }

  const artNum = artM[1];
  const parts = (artM[2].match(/\(([0-9a-z]+)\)/g) || []).map((x) => x.slice(1, -1));
  let id = 'art' + artNum;
  let label = 'Article ' + artNum;
  parts.forEach((p) => { id += '_' + p; label += '(' + p + ')'; });
  return { id, label };
}

function buildRegistryEntry(id, label) {
  if (id === 'reg_2026_1744') {
    return { article: null, title: 'Digital Omnibus on AI — amending Regulation (EU) 2024/1689', regulation: OMNIBUS, amended_by: null };
  }
  if (id === 'use_case_classification') {
    return { article: null, title: 'Use-case classification methodology (Annex III / Art. 6)', regulation: REG, amended_by: null };
  }
  if (id === 'whole_act_method') {
    return { article: null, title: 'Whole-Act interpretive method', regulation: REG, amended_by: null };
  }

  if (id.startsWith('annex3')) {
    const parts = id.split('_');
    const item = parts[1];
    const title = (item && ANNEX3_TITLE[item]) || 'High-risk AI systems referred to in Article 6(2)';
    return { article: label, title, regulation: REG, amended_by: null };
  }

  const parts = id.split('_'); // e.g. ['art5','1','ba']
  const artNum = parts[0].slice(3);
  const lastPart = parts[parts.length - 1];
  let title;
  if (artNum === '5' && parts.length > 1 && ART5_POINT_TITLE[lastPart]) {
    title = ART5_POINT_TITLE[lastPart];
  } else {
    title = ARTICLE_TITLE[artNum];
  }
  if (!title) throw new Error('No title known for article ' + artNum + ' (id ' + id + ')');

  return { article: label, title, regulation: REG, amended_by: AMENDED_IDS.has(id) ? OMNIBUS : null };
}

function jsStr(v) {
  if (v === null) return 'null';
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function serializeRegistry(registry) {
  const ids = Object.keys(registry).sort();
  const lines = ids.map((id) => {
    const e = registry[id];
    return `  ${id}: { article: ${e.article === null ? 'null' : jsStr(e.article)}, title: ${jsStr(e.title)}, regulation: ${jsStr(e.regulation)}, amended_by: ${e.amended_by === null ? 'null' : jsStr(e.amended_by)} }`;
  });
  return (
    '// ---- Legal Source Registry ----\n' +
    '// Canonical lookup for every legal_source_id referenced by QUESTIONS /\n' +
    '// QUESTIONS_SECTOR, so the app can render a consistent short label\n' +
    '// (e.g. "Article 14 — Human oversight") without re-parsing the free-text\n' +
    "// `source` string on every question. Sourced from the consolidated text of\n" +
    '// Regulation (EU) 2024/1689 and the amending Regulation (EU) 2026/1744\n' +
    '// (EUR-Lex CELEX 32024R1689 / 32026R1744). Generated by\n' +
    '// scripts/migrate-legal-source-and-schema.js — do not hand-edit; re-run\n' +
    '// the migration if new source strings are added to the question pools.\n' +
    'const LEGAL_SOURCES = {\n' +
    lines.join(',\n') +
    '\n};\n'
  );
}

function migrateQuestionBlock(html, arrayVarName) {
  const startMarker = `const ${arrayVarName} = [`;
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find ' + startMarker);

  // Find the matching closing "];" for this array by bracket counting.
  let depth = 0;
  let i = startIdx + startMarker.length - 1; // at the '['
  let endIdx = -1;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of ' + arrayVarName);

  const before = html.slice(0, startIdx);
  const arrayBody = html.slice(startIdx, endIdx + 1);
  const after = html.slice(endIdx + 1);

  const registryAdditions = {};
  let count = 0;

  const idHeaderRe = /^(\s*id:'(?:q|s)\d+', (?:role|sector):'[a-z]+',)\s*$/;
  const sourceLineRe = /^(\s*source:")([^"]*)(",)\s*$/;

  const lines = arrayBody.split('\n');
  const out = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const idMatch = line.match(idHeaderRe);
    if (idMatch) {
      const nextLine = lines[li + 1];
      const srcMatch = nextLine && nextLine.match(sourceLineRe);
      if (!srcMatch) throw new Error('Expected source line after: ' + line);

      const indent = line.match(/^\s*/)[0];
      const sourceText = srcMatch[2];
      const ref = extractPrimaryRef(sourceText);
      if (!registryAdditions[ref.id]) {
        registryAdditions[ref.id] = buildRegistryEntry(ref.id, ref.label);
      }

      out.push(line);
      out.push(`${indent}question_version:1, pool_version:${jsStr(POOL_VERSION)}, review_status:'legally_reviewed', review_date:${jsStr(REVIEW_DATE)},`);
      out.push(`${srcMatch[1]}${srcMatch[2]}${srcMatch[3]} legal_source_id:${jsStr(ref.id)},`);
      li++; // consumed the source line
      count++;
      continue;
    }
    out.push(line);
  }

  return { html: before + out.join('\n') + after, registryAdditions, count };
}

function main() {
  let html = fs.readFileSync(TARGET, 'utf8');

  if (html.includes('legal_source_id:')) {
    console.log('Already migrated (legal_source_id present) — nothing to do.');
    return;
  }

  const registry = {};

  const q1 = migrateQuestionBlock(html, 'QUESTIONS');
  html = q1.html;
  Object.assign(registry, q1.registryAdditions);
  console.log(`QUESTIONS: migrated ${q1.count} questions, ${Object.keys(q1.registryAdditions).length} new legal_source_id(s)`);

  const q2 = migrateQuestionBlock(html, 'QUESTIONS_SECTOR');
  html = q2.html;
  Object.assign(registry, q2.registryAdditions);
  console.log(`QUESTIONS_SECTOR: migrated ${q2.count} questions, ${Object.keys(q2.registryAdditions).length} new legal_source_id(s)`);

  console.log(`Total questions migrated: ${q1.count + q2.count}`);
  console.log(`Total unique legal_source_id entries: ${Object.keys(registry).length}`);

  // Insert the LEGAL_SOURCES registry immediately before QUESTIONS.
  const registryBlock = serializeRegistry(registry) + '\n';
  const insertMarker = 'const QUESTIONS = [';
  const insertIdx = html.indexOf(insertMarker);
  html = html.slice(0, insertIdx) + registryBlock + html.slice(insertIdx);

  fs.writeFileSync(TARGET, html);
  console.log('Wrote ' + TARGET);
}

main();
