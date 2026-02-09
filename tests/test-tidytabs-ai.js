#!/usr/bin/env node
/**
 * TidyTabs AI Integration Tests
 * Tests all prompt templates against real Gemini API and validates parsing.
 * 
 * Usage: node tests/test-tidytabs-ai.js
 */

const API_KEY = process.env.GEMINI_API_KEY || '';
if (!API_KEY) {
  console.error('ERROR: Set GEMINI_API_KEY env var to run API tests.');
  console.error('  export GEMINI_API_KEY="your-key-here"');
  console.error('  node tests/test-tidytabs-ai.js');
  process.exit(1);
}
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-3-flash-preview';

// ==================== Extracted parsing functions ====================

const parseJSONResponse = (content) => {
	let jsonStr = content.trim();
	
	const codeBlockPatterns = [
		/```json\s*([\s\S]*?)\s*```/i,
		/```\s*([\s\S]*?)\s*```/,
		/`([\s\S]*?)`/
	];
	
	for (const pattern of codeBlockPatterns) {
		const match = content.match(pattern);
		if (match && match[1].includes('{')) {
			jsonStr = match[1].trim();
			break;
		}
	}
	
	const firstBrace = jsonStr.indexOf('{');
	const lastBrace = jsonStr.lastIndexOf('}');
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
	}
	
	jsonStr = jsonStr
		.replace(/,\s*]/g, ']')
		.replace(/,\s*}/g, '}');
	
	jsonStr = jsonStr.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
	jsonStr = jsonStr.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
	
	jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
	
	try {
		return JSON.parse(jsonStr);
	} catch (parseError) {
		const groupsMatch = jsonStr.match(/"groups"\s*:\s*\[([\s\S]*)\]/);
		if (groupsMatch) {
			try {
				const fixedJson = '{"groups":[' + groupsMatch[1] + ']}';
				return JSON.parse(fixedJson);
			} catch (e) {
				// fall through
			}
		}
		return null;
	}
};

const parseJSONResponseFixed = (content) => {
	let jsonStr = content.trim();
	
	const codeBlockPatterns = [
		/```json\s*([\s\S]*?)\s*```/i,
		/```\s*([\s\S]*?)\s*```/,
		/`([\s\S]*?)`/
	];
	
	for (const pattern of codeBlockPatterns) {
		const match = content.match(pattern);
		if (match && match[1].includes('{')) {
			jsonStr = match[1].trim();
			break;
		}
	}
	
	const firstBrace = jsonStr.indexOf('{');
	const lastBrace = jsonStr.lastIndexOf('}');
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
	}
	
	jsonStr = jsonStr
		.replace(/,\s*]/g, ']')
		.replace(/,\s*}/g, '}');
	
	// FIXED: Only replace single quotes used as JSON delimiters, not apostrophes in values
	// Match single-quoted keys: 'key': → "key":
	jsonStr = jsonStr.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
	// Match single-quoted string values: : 'value' → : "value"
	jsonStr = jsonStr.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
	
	// Quote unquoted keys
	jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
	
	try {
		return JSON.parse(jsonStr);
	} catch (parseError) {
		const groupsMatch = jsonStr.match(/"groups"\s*:\s*\[([\s\S]*)\]/);
		if (groupsMatch) {
			try {
				const fixedJson = '{"groups":[' + groupsMatch[1] + ']}';
				return JSON.parse(fixedJson);
			} catch (e) {
				// fall through
			}
		}
		return null;
	}
};

const parseZenStyleResponse = (content, tabCount) => {
	const lines = content.trim().split('\n').map(line => line.trim()).filter(Boolean);
	
	if (lines.length !== tabCount) {
		console.warn(`  Zen parser: Expected ${tabCount} categories, got ${lines.length}`);
		if (lines.length < tabCount) {
			while (lines.length < tabCount) lines.push('Others');
		} else {
			lines.length = tabCount;
		}
	}
	
	const categoryMap = new Map();
	lines.forEach((category, index) => {
		const normalizedCategory = category.replace(/^[\d.\-*]+\s*/, '').trim();
		if (!categoryMap.has(normalizedCategory)) {
			categoryMap.set(normalizedCategory, []);
		}
		categoryMap.get(normalizedCategory).push(index);
	});
	
	const groups = [];
	categoryMap.forEach((tabIds, name) => {
		groups.push({ name: name || 'Others', tab_ids: tabIds });
	});
	
	return { groups };
};

// ==================== Test Data ====================

const MOCK_TABS = [
	{ id: 0, title: 'React Hooks Documentation', domain: 'react.dev', url: 'https://react.dev/reference/react/hooks' },
	{ id: 1, title: 'useState – React', domain: 'react.dev', url: 'https://react.dev/reference/react/useState' },
	{ id: 2, title: 'CSS Grid Layout - MDN', domain: 'developer.mozilla.org', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout' },
	{ id: 3, title: 'GitHub - facebook/react', domain: 'github.com', url: 'https://github.com/facebook/react' },
	{ id: 4, title: 'Stack Overflow - flexbox vs grid', domain: 'stackoverflow.com', url: 'https://stackoverflow.com/questions/flexbox-grid' },
	{ id: 5, title: "What's New in TypeScript 5.4", domain: 'devblogs.microsoft.com', url: 'https://devblogs.microsoft.com/typescript/typescript-5-4' },
	{ id: 6, title: 'YouTube - React Tutorial', domain: 'youtube.com', url: 'https://youtube.com/watch?v=abc123' },
	{ id: 7, title: 'Tailwind CSS - Utility-First', domain: 'tailwindcss.com', url: 'https://tailwindcss.com/docs/utility-first' },
];

const EXISTING_STACKS = [
	{ id: 'stack-1', name: 'React Docs' },
];

// ==================== Prompt Templates ====================

const TEMPLATES = {
	default: `**Instructions:**

Below are existing tab stack information and tabs to be grouped:

Existing tab stacks (title and ID):
{EXISTING_STACKS_LIST}

Tabs to be grouped (id, title, domain):
{TAB_DATA_LIST}

**Follow these rules to group tabs:**

# Priority: Assign tabs to existing stacks

1. If a tab's information is semantically related to an existing stack's title, add it to that stack: In the JSON output, match the tab's (tab_ids) to the existing stack's title (name) [VERY IMPORTANT];

If no semantically related existing stack is found, then consider creating a new stack

# Requirements for creating new stacks:

2. **Group by content theme**: When creating new stacks, categorize based on semantic similarity of tab titles.

3. **Group names must be specific**:
- Group names should be concise and specific, analyze tab titles and determine if they form a specific topic, group and name accordingly
- Examples: "css overflow", "javascript async issues", "xxx API collection"
- Avoid generic titles like "xxx tutorials", "xxx resources", "resource search"
- Allow more generic grouping only when refined to a single remaining tab
- **All group names must use {LANGUAGE} language**

4. **Each group must contain at least 2 tabs**. A single tab cannot form a group.

5. Conditions for creating and adding to "Others" stack:
	1. Tabs in stacks with only one tab should be added to the "Others" stack ({OTHERS_NAME})
	2. Tabs that cannot be grouped with any other tabs should be added to "Others"
	3. When existing stacks **do not contain** an "Others" stack, create one even if it has no tabs

6. Each tab can only appear in one group.

7. Output **strictly valid JSON format only**, nothing else:
Avoid the following:
* Empty elements (e.g. [5, , 7])
* Missing quotes or commas
* tab_ids containing only single tab groups (e.g. "tab_ids": [6]) [VERY IMPORTANT]
* ***No additional explanatory text, comments, or extra content in output*** [VERY IMPORTANT]

**Output example (must strictly follow):**

{
  "groups": [
    {
      "name": "Group name",
      "tab_ids": [0, 1, 2]
    },
    {
      "name": "Group name 2",
      "tab_ids": [3, 4]
    },
    {
      "name": "{OTHERS_NAME}",
      "tab_ids": [5, 6]
    }
  ]
}
`,
	zen: `Analyze the following numbered list of tab data (Title, URL, Description) and assign a concise category (1-2 words, Title Case) for EACH tab.

Existing Categories (Use these EXACT names if a tab fits):
{EXISTING_STACKS_LIST}

---
Instructions for Assignment:
1.  **Prioritize Existing:** For each tab below, determine if it clearly belongs to one of the 'Existing Categories'. Base this primarily on the URL/Domain, then Title/Description. If it fits, you MUST use the EXACT category name provided in the 'Existing Categories' list. DO NOT create a minor variation (e.g., if 'Project Docs' exists, use that, don't create 'Project Documentation').
2.  **Assign New Category (If Necessary):** Only if a tab DOES NOT fit an existing category, assign the best NEW concise category (1-2 words, Title Case).
    *   PRIORITIZE the URL/Domain (e.g., 'GitHub', 'YouTube', 'StackOverflow').
    *   Use Title/Description for specifics or generic domains.
3.  **Consistency is CRITICAL:** Use the EXACT SAME category name for all tabs belonging to the same logical group (whether assigned an existing or a new category). If multiple tabs point to 'google.com/search?q=recipes', categorize them consistently (e.g., 'Google Search' or 'Recipes', but use the same one for all).
4.  **Format:** 1-2 words, Title Case.
5.  **Language:** All category names must be in {LANGUAGE}.

---
Input Tab Data:
{TAB_DATA_LIST}

---
Instructions for Output:
1. Output ONLY the category names.
2. Provide EXACTLY ONE category name per line.
3. The number of lines in your output MUST EXACTLY MATCH the number of tabs in the Input Tab Data list above.
4. DO NOT include numbering, explanations, apologies, markdown formatting, or any surrounding text like "Output:" or backticks.
5. Just the list of categories, separated by newlines.
---

Output:`,
	domain: `Group the following browser tabs by their primary domain or website.

Existing Groups (reuse these exact names when applicable):
{EXISTING_STACKS_LIST}

Tabs to categorize:
{TAB_DATA_LIST}

**Grouping Rules:**

1. **Domain Priority**: Group tabs primarily by their base domain (e.g., all GitHub tabs together, all YouTube tabs together)
2. **Reuse Existing**: If a tab belongs to a domain that matches an existing group, use that EXACT group name
3. **Naming Convention**: Use the site's common name in Title Case (e.g., "GitHub", "Stack Overflow", "Google Docs")
4. **Minimum Group Size**: Each group must have at least 2 tabs
5. **Miscellaneous**: Tabs that don't fit any domain pattern go to "{OTHERS_NAME}"
6. **Language**: Use {LANGUAGE} for group names

**Output Format** (strict JSON, no additional text):

{
  "groups": [
    {"name": "GitHub", "tab_ids": [0, 1, 5]},
    {"name": "YouTube", "tab_ids": [2, 3]},
    {"name": "{OTHERS_NAME}", "tab_ids": [4, 6]}
  ]
}
`,
	semantic: `Analyze these browser tabs and group them by their semantic topic or theme, regardless of which website they're from.

Existing Topic Groups (reuse these exact names when applicable):
{EXISTING_STACKS_LIST}

Tabs to categorize:
{TAB_DATA_LIST}

**Grouping Rules:**

1. **Topic Over Domain**: Focus on WHAT the content is about, not WHERE it's hosted
   - A React tutorial on YouTube and a React doc on MDN should be in the same "React" group
2. **Specific Topics**: Be specific with topic names
   - Good: "React Hooks", "CSS Grid", "Python async"
   - Bad: "Programming", "Tutorials", "Learning"
3. **Reuse Existing**: If content matches an existing group's topic, use that EXACT group name
4. **Minimum 2 Tabs**: Each group needs at least 2 tabs
5. **Uncategorizable**: Tabs that don't fit any topic go to "{OTHERS_NAME}"
6. **Language**: All group names in {LANGUAGE}

**Output Format** (strict JSON only):

{
  "groups": [
    {"name": "React Hooks", "tab_ids": [0, 3, 7]},
    {"name": "CSS Layout", "tab_ids": [1, 4]},
    {"name": "{OTHERS_NAME}", "tab_ids": [2, 5, 6]}
  ]
}
`
};

// ==================== Build Prompts ====================

function buildPrompt(templateKey) {
	let template = TEMPLATES[templateKey];
	const isZen = templateKey === 'zen';
	
	let tabDataList;
	if (isZen) {
		tabDataList = MOCK_TABS.map((t, index) =>
			`${index + 1}.\nTitle: "${t.title}"\nURL: "${t.url}"\nDescription: "N/A"`
		).join('\n\n');
	} else {
		tabDataList = MOCK_TABS.map(t => `${t.id}. ${t.title} (${t.domain})`).join('\n');
	}
	
	let existingStacksList;
	if (isZen) {
		existingStacksList = EXISTING_STACKS.map(s => `- ${s.name}`).join('\n');
	} else {
		existingStacksList = EXISTING_STACKS.map((s, i) => `${i}. Stack title: ${s.name} (ID: ${s.id})`).join('\n');
	}
	
	return template
		.replace(/\{TAB_DATA_LIST\}/g, tabDataList)
		.replace(/\{EXISTING_STACKS_LIST\}/g, existingStacksList)
		.replace(/\{LANGUAGE\}/g, 'English')
		.replace(/\{OTHERS_NAME\}/g, 'Others');
}

// ==================== API Call ====================

async function callGemini(prompt, useJsonMode = false) {
	const body = {
		model: MODEL,
		messages: [{ role: 'user', content: prompt }],
		temperature: 0.3,
		max_tokens: 2048,
		stream: false
	};
	
	if (useJsonMode) {
		body.response_format = { type: 'json_object' };
	}
	
	const response = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`API ${response.status}: ${errorText.substring(0, 200)}`);
	}
	
	const data = await response.json();
	
	if (!data.choices || !data.choices[0] || !data.choices[0].message) {
		throw new Error(`Unexpected API response structure: ${JSON.stringify(data).substring(0, 200)}`);
	}
	
	return data.choices[0].message.content;
}

// ==================== Validation ====================

function validateGroups(result, templateKey) {
	const errors = [];
	
	if (!result) {
		errors.push('Parse returned null');
		return errors;
	}
	
	if (!result.groups || !Array.isArray(result.groups)) {
		errors.push(`Missing or invalid "groups" array. Got: ${JSON.stringify(result).substring(0, 100)}`);
		return errors;
	}
	
	const allTabIds = new Set();
	
	for (const group of result.groups) {
		if (!group.name || typeof group.name !== 'string') {
			errors.push(`Group missing valid name: ${JSON.stringify(group)}`);
		}
		
		if (!Array.isArray(group.tab_ids)) {
			errors.push(`Group "${group.name}" has non-array tab_ids: ${typeof group.tab_ids}`);
			continue;
		}
		
		for (const id of group.tab_ids) {
			if (typeof id !== 'number') {
				errors.push(`Group "${group.name}" has non-number tab_id: ${JSON.stringify(id)} (${typeof id})`);
			}
			if (id < 0 || id >= MOCK_TABS.length) {
				errors.push(`Group "${group.name}" has out-of-range tab_id: ${id}`);
			}
			if (allTabIds.has(id)) {
				errors.push(`Duplicate tab_id ${id} in group "${group.name}"`);
			}
			allTabIds.add(id);
		}
	}
	
	// Check coverage
	const missingTabs = [];
	for (let i = 0; i < MOCK_TABS.length; i++) {
		if (!allTabIds.has(i)) missingTabs.push(i);
	}
	if (missingTabs.length > 0) {
		errors.push(`Tabs not assigned to any group: ${missingTabs.join(', ')}`);
	}
	
	return errors;
}

// ==================== Parse Edge Case Tests ====================

function testParseEdgeCases() {
	console.log('\n' + '='.repeat(60));
	console.log('PARSE EDGE CASE TESTS');
	console.log('='.repeat(60));
	
	const tests = [
		{
			name: 'Valid JSON (clean)',
			input: '{"groups": [{"name": "React", "tab_ids": [0, 1]}, {"name": "Others", "tab_ids": [2]}]}',
			expectSuccess: true
		},
		{
			name: 'Markdown code block',
			input: '```json\n{"groups": [{"name": "React", "tab_ids": [0, 1]}]}\n```',
			expectSuccess: true
		},
		{
			name: 'Trailing comma in array',
			input: '{"groups": [{"name": "React", "tab_ids": [0, 1, ]}]}',
			expectSuccess: true
		},
		{
			name: 'Trailing comma in object',
			input: '{"groups": [{"name": "React", "tab_ids": [0, 1], }]}',
			expectSuccess: true
		},
		{
			name: 'Unquoted keys',
			input: '{groups: [{name: "React", tab_ids: [0, 1]}]}',
			expectSuccess: true
		},
		{
			name: 'Single-quoted keys and values',
			input: "{\"groups\": [{\"name\": 'React Hooks', \"tab_ids\": [0, 1]}]}",
			expectSuccess: true
		},
		{
			name: 'APOSTROPHE BUG: Name with apostrophe',
			input: '{"groups": [{"name": "React\'s Hooks", "tab_ids": [0, 1]}]}',
			expectSuccess: true,
			expectSuccessFixed: true
		},
		{
			name: 'Surrounding text before JSON',
			input: 'Here is the grouping:\n{"groups": [{"name": "React", "tab_ids": [0, 1]}]}',
			expectSuccess: true
		},
		{
			name: 'Mixed: unquoted keys + code block',
			input: '```\n{groups: [{name: "CSS", tab_ids: [2, 3]}]}\n```',
			expectSuccess: true
		},
		{
			name: 'Colon in group name value',
			input: '{"groups": [{"name": "CSS: Grid Layout", "tab_ids": [0, 1]}]}',
			expectSuccess: true
		},
		{
			name: 'URL in value (https:)',
			input: '{"groups": [{"name": "React", "tab_ids": [0, 1], "source": "https://react.dev"}]}',
			expectSuccess: true
		}
	];
	
	let passed = 0;
	let failed = 0;
	
	for (const test of tests) {
		const result = parseJSONResponse(test.input);
		const success = result !== null;
		const expected = test.expectSuccess;
		const status = success === expected ? 'PASS' : 'FAIL';
		
		if (status === 'PASS') {
			console.log(`  [${status}] ${test.name}`);
			passed++;
		} else {
			console.log(`  [${status}] ${test.name}`);
			console.log(`         Expected parse ${expected ? 'success' : 'failure'}, got ${success ? 'success' : 'failure'}`);
			if (result) console.log(`         Parsed: ${JSON.stringify(result).substring(0, 100)}`);
			failed++;
		}
		
		// Also test fixed version if applicable
		if (test.expectSuccessFixed !== undefined) {
			const fixedResult = parseJSONResponseFixed(test.input);
			const fixedSuccess = fixedResult !== null;
			const fixedStatus = fixedSuccess === test.expectSuccessFixed ? 'PASS' : 'FAIL';
			console.log(`  [${fixedStatus}] ${test.name} (FIXED parser) ${fixedSuccess ? '- parsed OK' : '- parse failed'}`);
			if (fixedStatus === 'PASS') passed++;
			else failed++;
		}
	}
	
	console.log(`\n  Results: ${passed} passed, ${failed} failed`);
	return failed === 0;
}

// ==================== Main Test Runner ====================

async function runTemplateTest(templateKey, useJsonMode = false) {
	const label = `${templateKey}${useJsonMode ? ' (json_mode)' : ''}`;
	console.log(`\n--- Testing template: ${label} ---`);
	
	try {
		const prompt = buildPrompt(templateKey);
		console.log(`  Prompt length: ${prompt.length} chars`);
		
		const content = await callGemini(prompt, useJsonMode && templateKey !== 'zen');
		console.log(`  Response length: ${content.length} chars`);
		console.log(`  Raw response:\n    ${content.substring(0, 300).replace(/\n/g, '\n    ')}`);
		
		let result;
		if (templateKey === 'zen') {
			result = parseZenStyleResponse(content, MOCK_TABS.length);
		} else {
			result = parseJSONResponse(content);
		}
		
		if (!result) {
			console.log(`  [FAIL] Parse returned null`);
			return false;
		}
		
		console.log(`  Parsed groups: ${result.groups.length}`);
		for (const g of result.groups) {
			console.log(`    - "${g.name}": tabs [${g.tab_ids.join(', ')}]`);
		}
		
		const errors = validateGroups(result, templateKey);
		if (errors.length > 0) {
			console.log(`  [WARN] Validation issues:`);
			errors.forEach(e => console.log(`    - ${e}`));
		} else {
			console.log(`  [PASS] Validation OK`);
		}
		
		return errors.filter(e => !e.startsWith('Tabs not assigned')).length === 0;
	} catch (error) {
		console.log(`  [FAIL] ${error.message}`);
		return false;
	}
}

async function main() {
	console.log('TidyTabs AI Integration Tests');
	console.log('='.repeat(60));
	console.log(`API: ${API_URL}`);
	console.log(`Model: ${MODEL}`);
	console.log(`Tabs: ${MOCK_TABS.length} mock tabs`);
	console.log(`Existing stacks: ${EXISTING_STACKS.length}`);
	
	// Phase 1: Parse edge cases (no API needed)
	const parseOk = testParseEdgeCases();
	
	// Phase 2: API tests - run sequentially to avoid rate limits
	console.log('\n' + '='.repeat(60));
	console.log('API TEMPLATE TESTS');
	console.log('='.repeat(60));
	
	const templateResults = {};
	
	for (const key of ['default', 'domain', 'semantic', 'zen']) {
		templateResults[key] = await runTemplateTest(key);
		// Rate limit pause
		await new Promise(r => setTimeout(r, 3000));
	}
	
	// Phase 3: Test with json_mode
	console.log('\n' + '='.repeat(60));
	console.log('JSON MODE TESTS (response_format)');
	console.log('='.repeat(60));
	
	for (const key of ['default', 'domain']) {
		templateResults[`${key}_jsonmode`] = await runTemplateTest(key, true);
		await new Promise(r => setTimeout(r, 3000));
	}
	
	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('SUMMARY');
	console.log('='.repeat(60));
	
	let totalPass = 0;
	let totalFail = 0;
	
	for (const [key, ok] of Object.entries(templateResults)) {
		console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${key}`);
		if (ok) totalPass++;
		else totalFail++;
	}
	
	console.log(`\n  Parse tests: ${parseOk ? 'PASS' : 'FAIL'}`);
	console.log(`  API tests: ${totalPass} passed, ${totalFail} failed`);
	console.log(`  Overall: ${parseOk && totalFail === 0 ? 'ALL PASS' : 'SOME FAILURES'}`);
	
	process.exit(totalFail > 0 || !parseOk ? 1 : 0);
}

main().catch(e => {
	console.error('Fatal:', e);
	process.exit(2);
});
