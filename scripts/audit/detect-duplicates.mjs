
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import postcss from 'postcss';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const OUT_JSON = path.join(ROOT_DIR, 'docs/audit/duplicates.json');
const OUT_MD = path.join(ROOT_DIR, 'docs/audit/duplicates.md');

// --- Helpers ---

function getHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function normalizeJsTs(code) {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
      tokens: true
    });
    
    // Extract tokens, ignoring comments and whitespace (Babel parser tokens usually include comments if configured, 
    // but the `tokens` array in the result is what we look at. 
    // Actually, `tokens` option in parse adds a `tokens` property to the File node.
    // We want to skip 'CommentLine', 'CommentBlock'.
    // We will join the values of the tokens.
    
    return ast.tokens
      .filter(t => t.type.label !== 'eof' && !t.type.label.includes('comment')) // Babel tokens are objects with type { label: ... }
      // Wait, babel parser tokens don't include comments by default in the token stream unless we ask?
      // Actually Babel attaches comments to nodes. 
      // But if we use `tokens: true`, we get an array of tokens.
      // Let's rely on token values but we need to be careful.
      // Simpler approach for normalization: 
      // 1. Parse to ensure validity (optional but good).
      // 2. Tokenize and use token types and values, ignoring comments.
      
      // Let's check what ast.tokens contains in a small test if needed, but generally:
      // It contains { type: { label: 'name', ... }, value: 'foo', start, end ... }
      // We'll map to `t.value || t.type.label` to form a signature.
      
      .map(t => {
          // Some tokens don't have a value property (like keywords), so we use the label.
          // String literals have value.
          // We want to ignore formatting, so we don't care about line numbers or whitespace (which isn't tokenized usually).
          return t.value !== undefined ? t.value : t.type.label;
      })
      .join('|'); 
      
  } catch (e) {
    // If parsing fails (e.g. some obscure syntax), fallback to simple whitespace stripping
    // console.warn('Parse error', e.message);
    return code.replace(/\s+/g, '');
  }
}

// --- Main Analysis ---

async function runAudit() {
  console.log('Starting duplicate audit...');
  
  const allFiles = await fg('src/**/*.{ts,tsx,js,jsx,scss}', { cwd: ROOT_DIR, absolute: true });
  console.log(`Found ${allFiles.length} files.`);

  const duplicates = [];
  const shadows = [];
  const typeDups = [];
  const scssRules = new Map(); // hash -> list of { file, selector, rule }

  // 1. File content hashing (JS/TS/SCSS)
  const fileHashes = new Map(); // hash -> [files]

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    const basename = path.basename(file);
    const dir = path.dirname(file);

    // Check for zero-byte JS shadows
    if (ext === '.js' && content.trim().length === 0) {
      // Check if .ts exists
      const tsFile = path.join(dir, basename.replace('.js', '.ts'));
      const tsxFile = path.join(dir, basename.replace('.js', '.tsx'));
      if (fs.existsSync(tsFile) || fs.existsSync(tsxFile)) {
        shadows.push({
            jsFile: path.relative(ROOT_DIR, file),
            tsFile: path.relative(ROOT_DIR, fs.existsSync(tsFile) ? tsFile : tsxFile)
        });
        continue; // Don't hash empty files
      }
    }
    
    // Check for types.js vs types.ts
    if (basename === 'types.js') {
        const tsFile = path.join(dir, 'types.ts');
        if (fs.existsSync(tsFile)) {
             typeDups.push({
                jsFile: path.relative(ROOT_DIR, file),
                tsFile: path.relative(ROOT_DIR, tsFile)
            });
        }
    }

    // Normalization and Hashing
    let normalized = content;
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      normalized = normalizeJsTs(content);
    } else if (ext === '.scss') {
       // For whole file duplicates, we can just whitespace trim or normalize.
       normalized = content.replace(/\s+/g, '');
       
       // SCSS Rule analysis
       try {
           const root = postcss.parse(content);
           root.walkRules(rule => {
               // Normalize rule: selector + declarations
               // We want to detect "repeated rule sets".
               // Let's hash the body of the rule + selector.
               const decls = rule.nodes
                   .filter(n => n.type === 'decl')
                   .map(d => `${d.prop}:${d.value}`)
                   .sort()
                   .join(';');
               
               // If rule has nested rules, they will be walked separately by walkRules.
               // We focus on the declarations block for this rule.
               
               if (decls.length > 0) {
                   const ruleSignature = `${rule.selector}{${decls}}`;
                   const ruleHash = getHash(ruleSignature);
                   
                   if (!scssRules.has(ruleHash)) {
                       scssRules.set(ruleHash, []);
                   }
                   scssRules.get(ruleHash).push({
                       file: path.relative(ROOT_DIR, file),
                       selector: rule.selector,
                       line: rule.source.start.line
                   });
               }
           });
       } catch (e) {
           // Ignore SCSS parse errors
       }
    }

    const hash = getHash(normalized);
    if (!fileHashes.has(hash)) {
      fileHashes.set(hash, []);
    }
    fileHashes.get(hash).push(path.relative(ROOT_DIR, file));
  }

  // Collect File Duplicates
  for (const [hash, files] of fileHashes.entries()) {
    if (files.length > 1) {
      duplicates.push({
        type: 'exact_content',
        files: files
      });
    }
  }

  // Collect SCSS Rule Duplicates (filter for significant ones)
  const scssDuplicates = [];
  for (const [hash, occurrences] of scssRules.entries()) {
      // We only care if the same rule appears in DIFFERENT files, or maybe multiple times?
      // Ticket says: "repeated rule sets between src/styles/_elements.scss, component-level styles ... and widget styles"
      // So mainly cross-file duplication.
      
      const files = new Set(occurrences.map(o => o.file));
      if (files.size > 1) {
          scssDuplicates.push({
              ruleHash: hash,
              occurrences: occurrences
          });
      }
  }

  // --- Output Generation ---

  const reportData = {
      shadows,
      typeDups,
      fileDuplicates: duplicates,
      scssDuplicates: scssDuplicates
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(reportData, null, 2));
  console.log(`Written ${OUT_JSON}`);

  const mdReport = generateMdReport(reportData);
  fs.writeFileSync(OUT_MD, mdReport);
  console.log(`Written ${OUT_MD}`);
}

function generateMdReport(data) {
    let md = `# Duplicate Audit Report\n\n`;
    md += `Generated on: ${new Date().toISOString()}\n\n`;

    // 1. Zero-byte JS Shadows
    md += `## Zero-byte JS Shadows\n\n`;
    if (data.shadows.length === 0) {
        md += `No shadows found.\n`;
    } else {
        md += `Found ${data.shadows.length} zero-byte JS files that shadow TS files. These should be deleted as they may interfere with module resolution or are leftovers from migration.\n\n`;
        md += `| JS File (Delete) | TS File (Keep) |\n|---|---|\n`;
        data.shadows.forEach(s => {
            md += `| \`${s.jsFile}\` | \`${s.tsFile}\` |\n`;
        });
        md += `\n**Remediation**: Delete the .js files listed above.\n`;
    }
    md += `\n`;

    // 2. Type Definition Duplicates
    md += `## Duplicate Type Definitions\n\n`;
    if (data.typeDups.length === 0) {
        md += `No duplicate type definitions found.\n`;
    } else {
        md += `Found ${data.typeDups.length} instances where \`types.js\` coexists with \`types.ts\`.\n\n`;
         md += `| JS File | TS File |\n|---|---|\n`;
        data.typeDups.forEach(s => {
            md += `| \`${s.jsFile}\` | \`${s.tsFile}\` |\n`;
        });
        md += `\n**Remediation**: Merge any unique types from \`types.js\` into \`types.ts\` and delete \`types.js\`.\n`;
    }
     md += `\n`;

    // 3. File Duplicates
    md += `## Identical Modules\n\n`;
    if (data.fileDuplicates.length === 0) {
        md += `No identical modules found.\n`;
    } else {
         md += `Found ${data.fileDuplicates.length} sets of identical or near-identical files (after normalization).\n\n`;
         data.fileDuplicates.forEach((dup, idx) => {
             const featureArea = getFeatureArea(dup.files[0]);
             md += `### Group ${idx + 1} (${featureArea})\n`;
             md += `Files:\n`;
             dup.files.forEach(f => md += `- \`${f}\`\n`);
             md += `\n**Remediation**: Consolidate these files. `;
             if (featureArea === 'Hooks') md += `Move to \`src/hooks\` or delete the copy.`;
             else if (featureArea === 'Services') md += `Keep the canonical service in \`src/services\`.`;
             else if (featureArea === 'Widgets') md += `Check if this is a copy-paste widget. Refactor shared logic to \`src/components\` or \`src/hooks\`.`;
             else md += `Delete duplicate or move to shared directory.`;
             md += `\n\n`;
         });
    }

    // 4. SCSS Duplicates
    md += `## Repeated SCSS Rule Sets\n\n`;
    if (data.scssDuplicates.length === 0) {
        md += `No significant repeated SCSS rule sets found.\n`;
    } else {
        md += `Found ${data.scssDuplicates.length} CSS rule sets that appear in multiple files.\n\n`;
        // Limit output if too many
        const limit = 20;
        data.scssDuplicates.slice(0, limit).forEach((dup, idx) => {
             const rule = dup.occurrences[0];
             md += `### Rule Set ${idx + 1}\n`;
             md += `Selector: \`${rule.selector}\`\n\n`;
             md += `Occurrences:\n`;
             dup.occurrences.forEach(o => md += `- \`${o.file}\` (line ${o.line})\n`);
             
             md += `\n**Remediation**: Consider moving this style to a shared mixin in \`src/styles/_mixins.scss\` or a common class in \`src/styles/_elements.scss\`.\n\n`;
        });
        if (data.scssDuplicates.length > limit) {
            md += `... and ${data.scssDuplicates.length - limit} more.\n`;
        }
    }

    return md;
}

function getFeatureArea(filePath) {
    if (filePath.includes('src/hooks')) return 'Hooks';
    if (filePath.includes('src/services')) return 'Services';
    if (filePath.includes('src/widgets')) return 'Widgets';
    if (filePath.includes('src/components')) return 'Components';
    if (filePath.includes('src/styles')) return 'Styling';
    return 'Other';
}

runAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
