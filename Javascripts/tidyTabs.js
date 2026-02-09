(function() {
	'use strict';

	// ==================== Configuration ====================
	// Right-click the TidyTabs button → Settings to configure API provider and key
	
	const DEBUG = false;
	const STORAGE_KEY = 'tidyTabs_config';
	const safeStorage = {
		getItem(key) {
			try { return localStorage.getItem(key); } catch (e) { return null; }
		},
		setItem(key, value) {
			try { localStorage.setItem(key, value); } catch (e) { }
		}
	};
	const modState = {
		listeners: [],
		observers: [],
		timeouts: [],
		intervals: [],
		chromeListeners: [],
		addEventListener(target, event, handler, options) {
			target.addEventListener(event, handler, options);
			this.listeners.push({ target, event, handler, options });
		},
		addObserver(target, callback, options) {
			const observer = new MutationObserver(callback);
			observer.observe(target, options);
			this.observers.push(observer);
			return observer;
		},
		setTimeout(callback, delay) {
			const id = setTimeout(callback, delay);
			this.timeouts.push(id);
			return id;
		},
		setInterval(callback, delay) {
			const id = setInterval(callback, delay);
			this.intervals.push(id);
			return id;
		},
		addChromeListener(api, event, handler) {
			api[event].addListener(handler);
			this.chromeListeners.push({ api, event, handler });
		},
		cleanup() {
			this.listeners.forEach(({ target, event, handler, options }) => {
				target.removeEventListener(event, handler, options);
			});
			this.observers.forEach(obs => {
				obs.disconnect();
			});
			this.timeouts.forEach(id => {
				clearTimeout(id);
			});
			this.intervals.forEach(id => {
				clearInterval(id);
			});
			this.chromeListeners.forEach(({ api, event, handler }) => {
				api[event].removeListener(handler);
			});
			this.listeners = [];
			this.observers = [];
			this.timeouts = [];
			this.intervals = [];
			this.chromeListeners = [];
		}
	};
	
	// ==================== Prompt Templates ====================
	// Variables: {TAB_DATA_LIST}, {EXISTING_STACKS_LIST}, {LANGUAGE}, {OTHERS_NAME}
	
	const PROMPT_TEMPLATES = {
		default: {
			name: 'Default (JSON Output)',
			description: 'Original TidyTabs prompt with JSON output format',
			template: `**Instructions:**

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
`
		},
		
		zen: {
			name: 'Zen Browser Style',
			description: 'Strict consistency, prioritizes existing categories, line-based output',
			template: `Analyze the following numbered list of tab data (Title, URL, Description) and assign a concise category (1-2 words, Title Case) for EACH tab.

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

Output:`
		},
		
		domain: {
			name: 'Domain-Focused',
			description: 'Groups primarily by website/domain, good for browsing sessions',
			template: `Group the following browser tabs by their primary domain or website.

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
`
		},
		
		semantic: {
			name: 'Semantic Topics',
			description: 'Groups by content topic/theme regardless of domain',
			template: `Analyze these browser tabs and group them by their semantic topic or theme, regardless of which website they're from.

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
		},
		
		custom: {
			name: 'Custom Prompt',
			description: 'Your own custom prompt template',
			template: '' // Will be populated from CONFIG.customPrompt
		}
	};
	
	const DEFAULT_CONFIG = {
		// API Provider: 'gemini', 'openai', 'glm', 'openrouter', 'custom'
		provider: 'gemini',
		
		// API configurations per provider
		api: {
			gemini: {
				url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
				key: '',
				model: 'gemini-3-flash-preview'
			},
			openai: {
				url: 'https://api.openai.com/v1/chat/completions',
				key: '',
				model: 'gpt-4o-mini'
			},
			glm: {
				url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
				key: '',
				model: 'glm-4.5-flash'
			},
			openrouter: {
				url: 'https://openrouter.ai/api/v1/chat/completions',
				key: '',
				model: 'google/gemini-2.0-flash-exp:free'
			},
			custom: {
				url: '',
				key: '',
				model: ''
			}
		},
		
		// Shared API settings
		temperature: 0.3,
		maxTokens: 2048,
		
		// Auto-stack enabled workspaces (empty array = disabled for all)
		autoStackWorkspaces: [],
		
		// Feature toggles
		enableAIGrouping: true,
		maxTabsForAI: 50,
		
		// Delays
		delays: {
			init: 500,
			mutation: 50,
			workspaceSwitch: 100,
			retry: 500,
			reattach: 500,
			debounce: 150,
			autoStack: 1000
		},
		
		// Prompt settings
		selectedTemplate: 'default',
		customPrompt: ''
	};
	
	// Load config from localStorage or use defaults
	const loadConfig = () => {
		try {
			const saved = safeStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...DEFAULT_CONFIG, ...parsed, api: { ...DEFAULT_CONFIG.api, ...parsed.api } };
			}
		} catch (e) {
			console.error('TidyTabs: Error loading config', e);
		}
		return { ...DEFAULT_CONFIG };
	};
	
	// Save config to localStorage
	const saveConfig = (config) => {
		try {
			safeStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (e) {
			console.error('TidyTabs: Error saving config', e);
		}
	};
	
	let CONFIG = loadConfig();
	
	// Helper to get current API settings
	const getApiConfig = () => {
		const provider = CONFIG.provider || 'gemini';
		return CONFIG.api[provider] || CONFIG.api.gemini;
	};
	
	// Legacy compatibility: map old glm config to new structure
	const CONFIG_COMPAT = {
		get glm() {
			const api = getApiConfig();
			return {
				url: api.url,
				key: api.key,
				model: api.model,
				temperature: CONFIG.temperature,
				maxTokens: CONFIG.maxTokens
			};
		}
	};
	
	// ==================== Settings UI ====================
	
	const getTemplateOptions = () => {
		return Object.entries(PROMPT_TEMPLATES).map(([key, tmpl]) => ({
			key,
			name: tmpl.name,
			description: tmpl.description
		}));
	};

	const getCurrentTemplateContent = () => {
		const templateKey = CONFIG.selectedTemplate || 'default';
		if (templateKey === 'custom') {
			return CONFIG.customPrompt || '';
		}
		return PROMPT_TEMPLATES[templateKey]?.template || PROMPT_TEMPLATES.default.template;
	};
	
	const showSettingsDialog = () => {
		const existing = document.getElementById('tidytabs-settings-dialog');
		if (existing) existing.remove();
		
		const api = getApiConfig();
		const templateOptions = getTemplateOptions();
		const dialog = document.createElement('div');
		dialog.id = 'tidytabs-settings-dialog';
		dialog.innerHTML = `
			<style>
				#tidytabs-settings-dialog {
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: var(--colorBg, #1e1e1e);
					color: var(--colorFg, #fff);
					border: 1px solid var(--colorBorder, #444);
					border-radius: 8px;
					padding: 20px;
					z-index: 999999;
					min-width: 500px;
					max-width: 700px;
					max-height: 85vh;
					overflow-y: auto;
					box-shadow: 0 4px 20px rgba(0,0,0,0.5);
					font-family: system-ui, -apple-system, sans-serif;
				}
				#tidytabs-settings-dialog h2 {
					margin: 0 0 15px 0;
					font-size: 16px;
				}
				#tidytabs-settings-dialog .tabs {
					display: flex;
					gap: 0;
					border-bottom: 1px solid var(--colorBorder, #444);
					margin-bottom: 15px;
				}
				#tidytabs-settings-dialog .tab-btn {
					padding: 10px 20px;
					background: transparent;
					border: none;
					color: var(--colorFg, #fff);
					opacity: 0.6;
					cursor: pointer;
					font-size: 13px;
					border-bottom: 2px solid transparent;
					margin-bottom: -1px;
				}
				#tidytabs-settings-dialog .tab-btn.active {
					opacity: 1;
					border-bottom-color: var(--colorAccentBg, #0078d4);
				}
				#tidytabs-settings-dialog .tab-content {
					display: none;
				}
				#tidytabs-settings-dialog .tab-content.active {
					display: block;
				}
				#tidytabs-settings-dialog label {
					display: block;
					margin: 10px 0 5px;
					font-size: 12px;
					opacity: 0.8;
				}
				#tidytabs-settings-dialog select,
				#tidytabs-settings-dialog input,
				#tidytabs-settings-dialog textarea {
					width: 100%;
					padding: 10px 12px;
					border: 1px solid var(--colorBorder, #444);
					border-radius: 4px;
					background: var(--colorBgDark, #2d2d2d);
					color: var(--colorFg, #fff);
					font-size: 13px;
					font-family: system-ui, -apple-system, sans-serif;
					box-sizing: border-box;
					line-height: 1.5;
				}
				#tidytabs-settings-dialog select {
					height: 42px !important;
					min-height: 42px !important;
					padding: 0 30px 0 12px !important;
					line-height: 42px !important;
					appearance: none;
					-webkit-appearance: none;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: right 10px center;
				}
				#tidytabs-settings-dialog textarea {
					font-family: 'Consolas', 'Monaco', monospace;
					font-size: 11px;
					line-height: 1.4;
					resize: vertical;
				}
				#tidytabs-settings-dialog .buttons {
					margin-top: 20px;
					display: flex;
					gap: 10px;
					justify-content: flex-end;
				}
				#tidytabs-settings-dialog button {
					padding: 8px 16px;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 13px;
				}
				#tidytabs-settings-dialog .btn-primary {
					background: var(--colorAccentBg, #0078d4);
					color: white;
				}
				#tidytabs-settings-dialog .btn-secondary {
					background: var(--colorBgDark, #3d3d3d);
					color: var(--colorFg, #fff);
				}
				#tidytabs-settings-dialog .btn-small {
					padding: 4px 10px;
					font-size: 11px;
				}
				#tidytabs-settings-dialog .hint {
					font-size: 11px;
					opacity: 0.6;
					margin-top: 4px;
				}
				#tidytabs-settings-dialog .template-desc {
					font-size: 11px;
					opacity: 0.7;
					margin: 5px 0 10px;
					font-style: italic;
				}
				#tidytabs-settings-dialog .prompt-actions {
					display: flex;
					gap: 8px;
					margin-top: 8px;
				}
				#tidytabs-settings-dialog .variables-hint {
					font-size: 10px;
					opacity: 0.5;
					margin-top: 8px;
					padding: 8px;
					background: var(--colorBgDark, #2d2d2d);
					border-radius: 4px;
				}
				#tidytabs-settings-dialog .variables-hint code {
					background: rgba(255,255,255,0.1);
					padding: 1px 4px;
					border-radius: 2px;
				}
			</style>
			<h2>TidyTabs Settings</h2>
			
			<div class="tabs">
				<button class="tab-btn active" data-tab="api">API</button>
				<button class="tab-btn" data-tab="prompts">Prompts</button>
			</div>
			
			<!-- API Tab -->
			<div class="tab-content active" id="tab-api">
				<label>AI Provider</label>
				<select id="tt-provider">
					<option value="gemini" ${CONFIG.provider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
					<option value="openai" ${CONFIG.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
					<option value="openrouter" ${CONFIG.provider === 'openrouter' ? 'selected' : ''}>OpenRouter (free tier available)</option>
					<option value="glm" ${CONFIG.provider === 'glm' ? 'selected' : ''}>GLM (Zhipu AI)</option>
					<option value="custom" ${CONFIG.provider === 'custom' ? 'selected' : ''}>Custom OpenAI-compatible</option>
				</select>
				
				<label>API Key</label>
				<input type="password" id="tt-apikey" value="${api.key || ''}" placeholder="Enter your API key">
				<div class="hint">
					Get free key: 
					<a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--colorAccentFg, #4fc3f7)">Gemini</a> |
					<a href="https://openrouter.ai/keys" target="_blank" style="color: var(--colorAccentFg, #4fc3f7)">OpenRouter</a>
				</div>
				
				<label>Model</label>
				<input type="text" id="tt-model" value="${api.model || ''}" placeholder="e.g., gemini-2.0-flash">
				
				<div id="tt-custom-url" style="display: ${CONFIG.provider === 'custom' ? 'block' : 'none'}">
					<label>API URL</label>
					<input type="text" id="tt-url" value="${api.url || ''}" placeholder="https://api.example.com/v1/chat/completions">
				</div>
			</div>
			
			<!-- Prompts Tab -->
			<div class="tab-content" id="tab-prompts">
				<label>Prompt Template</label>
				<select id="tt-template">
					${templateOptions.map(opt => `
						<option value="${opt.key}" ${CONFIG.selectedTemplate === opt.key ? 'selected' : ''}>${opt.name}</option>
					`).join('')}
				</select>
				<div class="template-desc" id="tt-template-desc">
					${PROMPT_TEMPLATES[CONFIG.selectedTemplate || 'default']?.description || ''}
				</div>
				
				<label>Prompt Content <span style="opacity: 0.5">(editable for Custom template)</span></label>
				<textarea id="tt-prompt-content" rows="15" ${CONFIG.selectedTemplate !== 'custom' ? 'readonly' : ''}>${getCurrentTemplateContent()}</textarea>
				
				<div class="prompt-actions">
					<button class="btn-secondary btn-small" id="tt-copy-to-custom">Copy to Custom</button>
					<button class="btn-secondary btn-small" id="tt-reset-prompt">Reset to Default</button>
					<button class="btn-secondary btn-small" id="tt-import-rules">Import Tab Groups Rules</button>
				</div>
				
				<div class="variables-hint">
					<strong>Available variables:</strong><br>
					<code>{TAB_DATA_LIST}</code> - List of tabs to categorize<br>
					<code>{EXISTING_STACKS_LIST}</code> - Current tab stacks<br>
					<code>{LANGUAGE}</code> - Browser UI language<br>
					<code>{OTHERS_NAME}</code> - "Others" in current language
				</div>
			</div>
			
			<div class="buttons">
				<button class="btn-secondary" id="tt-cancel">Cancel</button>
				<button class="btn-primary" id="tt-save">Save</button>
			</div>
		`;
		
		document.body.appendChild(dialog);
		
		// Tab switching
		dialog.querySelectorAll('.tab-btn').forEach(btn => {
			modState.addEventListener(btn, 'click', () => {
				dialog.querySelectorAll('.tab-btn').forEach(b => {
					b.classList.remove('active');
				});
				dialog.querySelectorAll('.tab-content').forEach(c => {
					c.classList.remove('active');
				});
				btn.classList.add('active');
				document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
			});
		});
		
		// API Tab elements
		const providerSelect = document.getElementById('tt-provider');
		const apikeyInput = document.getElementById('tt-apikey');
		const modelInput = document.getElementById('tt-model');
		const urlInput = document.getElementById('tt-url');
		const customUrlDiv = document.getElementById('tt-custom-url');
		
		// Prompts Tab elements
		const templateSelect = document.getElementById('tt-template');
		const templateDesc = document.getElementById('tt-template-desc');
		const promptContent = document.getElementById('tt-prompt-content');
		
		modState.addEventListener(providerSelect, 'change', () => {
			const provider = providerSelect.value;
			customUrlDiv.style.display = provider === 'custom' ? 'block' : 'none';
			const providerConfig = CONFIG.api[provider] || DEFAULT_CONFIG.api[provider];
			apikeyInput.value = providerConfig.key || '';
			modelInput.value = providerConfig.model || '';
			if (urlInput) urlInput.value = providerConfig.url || '';
		});
		
		modState.addEventListener(templateSelect, 'change', () => {
			const key = templateSelect.value;
			const tmpl = PROMPT_TEMPLATES[key];
			templateDesc.textContent = tmpl?.description || '';
			
			if (key === 'custom') {
				promptContent.value = CONFIG.customPrompt || '';
				promptContent.removeAttribute('readonly');
			} else {
				promptContent.value = tmpl?.template || '';
				promptContent.setAttribute('readonly', 'readonly');
			}
		});
		
		modState.addEventListener(document.getElementById('tt-copy-to-custom'), 'click', () => {
			CONFIG.customPrompt = promptContent.value;
			templateSelect.value = 'custom';
			templateSelect.dispatchEvent(new Event('change'));
			promptContent.removeAttribute('readonly');
		});
		
		modState.addEventListener(document.getElementById('tt-reset-prompt'), 'click', () => {
			const key = templateSelect.value;
			if (key === 'custom') {
				CONFIG.customPrompt = '';
				promptContent.value = '';
			} else {
				promptContent.value = PROMPT_TEMPLATES[key]?.template || '';
			}
		});
		
		modState.addEventListener(document.getElementById('tt-import-rules'), 'click', () => {
			showImportRulesDialog();
		});
		
		modState.addEventListener(document.getElementById('tt-cancel'), 'click', () => dialog.remove());
		
		modState.addEventListener(document.getElementById('tt-save'), 'click', () => {
			const provider = providerSelect.value;
			CONFIG.provider = provider;
			CONFIG.api[provider] = {
				url: provider === 'custom' ? urlInput.value : DEFAULT_CONFIG.api[provider].url,
				key: apikeyInput.value,
				model: modelInput.value || DEFAULT_CONFIG.api[provider].model
			};
			
			CONFIG.selectedTemplate = templateSelect.value;
			if (templateSelect.value === 'custom') {
				CONFIG.customPrompt = promptContent.value;
			}
			
			saveConfig(CONFIG);
			dialog.remove();
			showNotification('Settings saved!', 'info');
		});
	};
	
	const showImportRulesDialog = () => {
		const existing = document.getElementById('tidytabs-import-dialog');
		if (existing) existing.remove();
		
		const dialog = document.createElement('div');
		dialog.id = 'tidytabs-import-dialog';
		dialog.innerHTML = `
			<style>
				#tidytabs-import-dialog {
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: var(--colorBg, #1e1e1e);
					color: var(--colorFg, #fff);
					border: 1px solid var(--colorBorder, #444);
					border-radius: 8px;
					padding: 20px;
					z-index: 1000000;
					min-width: 500px;
					max-width: 600px;
					box-shadow: 0 4px 20px rgba(0,0,0,0.5);
					font-family: system-ui, -apple-system, sans-serif;
				}
				#tidytabs-import-dialog h3 {
					margin: 0 0 10px 0;
					font-size: 14px;
				}
				#tidytabs-import-dialog textarea {
					width: 100%;
					height: 200px;
					padding: 8px;
					border: 1px solid var(--colorBorder, #444);
					border-radius: 4px;
					background: var(--colorBgDark, #2d2d2d);
					color: var(--colorFg, #fff);
					font-family: 'Consolas', 'Monaco', monospace;
					font-size: 11px;
					box-sizing: border-box;
					resize: vertical;
				}
				#tidytabs-import-dialog .hint {
					font-size: 11px;
					opacity: 0.6;
					margin: 8px 0;
				}
				#tidytabs-import-dialog .buttons {
					margin-top: 15px;
					display: flex;
					gap: 10px;
					justify-content: flex-end;
				}
				#tidytabs-import-dialog button {
					padding: 8px 16px;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 13px;
				}
				#tidytabs-import-dialog .btn-primary {
					background: var(--colorAccentBg, #0078d4);
					color: white;
				}
				#tidytabs-import-dialog .btn-secondary {
					background: var(--colorBgDark, #3d3d3d);
					color: var(--colorFg, #fff);
				}
			</style>
			<h3>Import Tab Groups Rules</h3>
			<div class="hint">
				Paste your Tab Groups extension JSON rules below. They will be converted into predefined categories for the AI prompt.
			</div>
			<textarea id="tt-rules-json" placeholder='{"rule-xxx": {"groupName": "...", "urlMatches": [...]}}'></textarea>
			<div class="buttons">
				<button class="btn-secondary" id="tt-import-cancel">Cancel</button>
				<button class="btn-primary" id="tt-import-convert">Convert & Apply</button>
			</div>
		`;
		
		document.body.appendChild(dialog);
		
		modState.addEventListener(document.getElementById('tt-import-cancel'), 'click', () => dialog.remove());
		
		modState.addEventListener(document.getElementById('tt-import-convert'), 'click', () => {
			const rulesJson = document.getElementById('tt-rules-json').value.trim();
			if (!rulesJson) {
				showNotification('Please paste your Tab Groups rules JSON', 'error');
				return;
			}
			
			try {
				const rules = JSON.parse(rulesJson);
				const prompt = convertRulesToPrompt(rules);
				
				CONFIG.customPrompt = prompt;
				CONFIG.selectedTemplate = 'custom';
				saveConfig(CONFIG);
				
				dialog.remove();
				
				const promptContent = document.getElementById('tt-prompt-content');
				const templateSelect = document.getElementById('tt-template');
				if (promptContent && templateSelect) {
					templateSelect.value = 'custom';
					promptContent.value = prompt;
					promptContent.removeAttribute('readonly');
					document.getElementById('tt-template-desc').textContent = PROMPT_TEMPLATES.custom.description;
				}
				
				showNotification('Rules imported! Custom prompt created.', 'info');
			} catch (e) {
				console.error('Error parsing rules:', e);
				showNotification('Invalid JSON format. Check console for details.', 'error');
			}
		});
	};
	
	const convertRulesToPrompt = (rules) => {
		const categories = [];
		
		Object.entries(rules).forEach(([key, rule]) => {
			if (key === 'meta' || !rule.enabled || !rule.groupName) return;
			
			const patterns = [];
			
			if (rule.urlMatches) {
				rule.urlMatches.forEach(match => {
					if (match.method === 'includes' && match.target === 'hostname') {
						patterns.push(`hostname contains "${match.value}"`);
					} else if (match.method === 'startsWith') {
						patterns.push(`URL starts with "${match.value}"`);
					} else if (match.method === 'endsWith' && match.target === 'hostname') {
						patterns.push(`hostname ends with "${match.value}"`);
					}
				});
			}
			
			if (rule.titleMatches) {
				rule.titleMatches.forEach(match => {
					if (match.method === 'includes') {
						patterns.push(`title contains "${match.value}"`);
					}
				});
			}
			
			if (patterns.length > 0) {
				categories.push({
					name: rule.groupName,
					patterns: patterns.slice(0, 5)
				});
			}
		});
		
		const categoryList = categories.map(c => 
			`- "${c.name}": ${c.patterns.join(', ')}`
		).join('\n');
		
		return `You are a tab categorization assistant. Categorize the following browser tabs into groups.

**PREDEFINED CATEGORIES (use these exact names when a tab matches):**
${categoryList}

**EXISTING TAB STACKS (reuse these exact names if applicable):**
{EXISTING_STACKS_LIST}

**TABS TO CATEGORIZE:**
{TAB_DATA_LIST}

**RULES:**
1. If a tab matches a predefined category's patterns, use that EXACT category name
2. If a tab matches an existing stack, use that EXACT stack name  
3. If no match, create a specific new category (1-2 words, Title Case)
4. Each group must have at least 2 tabs
5. Ungroupable tabs go to "{OTHERS_NAME}"
6. Use {LANGUAGE} for all category names

**OUTPUT FORMAT (strict JSON only):**
{
  "groups": [
    {"name": "Category Name", "tab_ids": [0, 1, 2]},
    {"name": "{OTHERS_NAME}", "tab_ids": [3]}
  ]
}
`;
	};
	
	// Expose settings dialog globally
	window.tidyTabsSettings = showSettingsDialog;

	// Selectors
	const SELECTORS = {
		TAB_STRIP: '.tab-strip',
		SEPARATOR: '.tab-strip .separator',
		TAB_WRAPPER: '.tab-wrapper',
		TAB_POSITION: '.tab-position',
		STACK_COUNTER: '.stack-counter',
		TAB_STACK: '.svg-tab-stack',
		SUBSTACK: '.tab-position.is-substack, .tab-position.is-stack'
	};

	const CLASSES = {
		BUTTON: 'tidy-tabs-below-button',
		LOADING: 'tidy-loading-icon',
		PINNED: 'is-pinned'
	};

	// Language mappings
	const LANGUAGE_MAP = {
		'zh': '中文', 'zh-CN': '中文', 'zh-TW': '中文',
		'en': 'English', 'en-US': 'English', 'en-GB': 'English',
		'ja': '日本語', 'ja-JP': '日本語',
		'ko': '한국어', 'ko-KR': '한국어',
		'es': 'Español', 'fr': 'Français', 'de': 'Deutsch',
		'ru': 'Русский', 'pt': 'Português', 'it': 'Italiano',
		'ar': 'العربية', 'hi': 'हिन्दी'
	};

	const OTHERS_NAMES = ['其它', 'Others', 'その他', 'Other', 'Outros', 'Andere', 'Autres'];

	// Debounce timer
	let debounceTimer = null;

	// ==================== Utility Functions ====================

	// Get browser UI language
	const getBrowserLanguage = () => {
		return chrome.i18n.getUILanguage() || navigator.language || 'zh-CN';
	};

	// Convert language code to natural language name
	const getLanguageName = (langCode) => {
		if (LANGUAGE_MAP[langCode]) return LANGUAGE_MAP[langCode];
		
		const mainLang = langCode.split('-')[0];
		return LANGUAGE_MAP[mainLang] || 'English';
	};

	// Get "Others" group name in current language
	const getOthersName = () => {
		const langName = getLanguageName(getBrowserLanguage());
		const mapping = {
			'中文': '其它',
			'English': 'Others',
			'日本語': 'その他'
		};
		return mapping[langName] || 'Others';
	};

	// Get URL fragments using Vivaldi API or fallback
	const getUrlFragments = (url) => {
		try {
			if (typeof vivaldi !== 'undefined' && vivaldi.utilities?.getUrlFragments) {
				return vivaldi.utilities.getUrlFragments(url);
			}
		} catch (e) {
			// Fallback
		}
		
		try {
			const urlObj = new URL(url);
			const hostname = urlObj.hostname;
			const parts = hostname.split('.');
			const tld = parts.length > 1 ? parts[parts.length - 1] : '';
			
			return {
				hostForSecurityDisplay: hostname,
				tld: tld
			};
		} catch (e) {
			return {
				hostForSecurityDisplay: '',
				tld: ''
			};
		}
	};

	// Get base domain from URL
	const getBaseDomain = (url) => {
		const {hostForSecurityDisplay, tld} = getUrlFragments(url);
		const match = hostForSecurityDisplay.match(`([^.]+\\.${tld})$`);
		return match ? match[1] : hostForSecurityDisplay;
	};

	// Get hostname from URL
	const getHostname = (url) => {
		const {hostForSecurityDisplay} = getUrlFragments(url);
		return hostForSecurityDisplay;
	};

	// Get tab details by ID
	const getTab = async (tabId) => {
		return new Promise((resolve) => {
			chrome.tabs.get(tabId, function(tab) {
				if (chrome.runtime.lastError) {
					console.error('Error getting tab:', chrome.runtime.lastError);
					resolve(null);
					return;
				}
				
				if (tab.vivExtData) {
					try {
						tab.vivExtData = JSON.parse(tab.vivExtData);
					} catch (e) {
						console.error('Error parsing vivExtData:', e);
					}
				}
				resolve(tab);
			});
		});
	};

	// Get workspace name by ID
	const getWorkspaceName = async (workspaceId) => {
		if (!workspaceId) {
			return '<default_workspace>';
		}
		
		return new Promise((resolve) => {
			if (typeof vivaldi !== 'undefined' && vivaldi.prefs) {
				vivaldi.prefs.get('vivaldi.workspaces.list', (workspaceList) => {
					const workspace = workspaceList.find(item => item.id === workspaceId);
					resolve(workspace ? workspace.name : '<unknown_workspace>');
				});
			} else {
				resolve('<unknown_workspace>');
			}
		});
	};

	// Check if workspace allows auto-stacking
	const isAutoStackAllowed = async (workspaceId) => {
		if (CONFIG.autoStackWorkspaces.length === 0) {
			return false;
		}
		
		const workspaceName = await getWorkspaceName(workspaceId);
		return CONFIG.autoStackWorkspaces.includes(workspaceName);
	};

	// Get all tabs in specified workspace
	const getTabsByWorkspace = async (workspaceId) => {
		return new Promise((resolve) => {
			chrome.tabs.query({ currentWindow: true }, async function(tabs) {
				if (chrome.runtime.lastError) {
					console.error('Error querying tabs:', chrome.runtime.lastError);
					resolve([]);
					return;
				}
				
				const validTabs = [];
				for (const tab of tabs) {
					if (tab.id === -1 || !tab.vivExtData) continue;
					
					try {
						const vivExtData = JSON.parse(tab.vivExtData);
						
						if (vivExtData.workspaceId === workspaceId) {
							if (!tab.pinned && !vivExtData.panelId) {
								validTabs.push({
									...tab,
									vivExtData: vivExtData
								});
							}
						}
					} catch (e) {
						console.error('Error parsing vivExtData:', e);
					}
				}
				
				resolve(validTabs);
			});
		});
	};

	// Add tab to stack
	const addTabToStack = async (tabId, stackId, stackName) => {
		const tab = await getTab(tabId);
		
		if (!tab || !tab.vivExtData) {
			console.warn('Tab has no vivExtData:', tabId);
			return;
		}
		
		const vivExtData = tab.vivExtData;
		
		if (stackName) {
			vivExtData.fixedGroupTitle = stackName;
		}
		vivExtData.group = stackId;
		
		return new Promise((resolve) => {
			chrome.tabs.update(tabId, { 
				vivExtData: JSON.stringify(vivExtData) 
			}, function() {
				if (chrome.runtime.lastError) {
					console.error('Error updating tab:', chrome.runtime.lastError);
				} else {
			DEBUG && console.log(`Added tab ${tabId} to stack ${stackId} (${stackName})`);
				}
				resolve();
			});
		});
	};

	// Show notification
	const showNotification = (message, type = 'error') => {
		if (typeof chrome !== 'undefined' && chrome.notifications) {
			chrome.notifications.create({
				type: 'basic',
				iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><text y="32" font-size="32">⚠️</text></svg>',
				title: 'TidyTabs',
				message: message,
				priority: type === 'error' ? 2 : 1
			});
		} else {
			console.error(`[TidyTabs] ${message}`);
			alert(`TidyTabs: ${message}`);
		}
	};

	// ==================== AI Grouping ====================

	const getSelectedTemplate = () => {
		const templateKey = CONFIG.selectedTemplate || 'default';
		if (templateKey === 'custom' && CONFIG.customPrompt) {
			return CONFIG.customPrompt;
		}
		return PROMPT_TEMPLATES[templateKey]?.template || PROMPT_TEMPLATES.default.template;
	};

	const isZenStyleTemplate = () => {
		const templateKey = CONFIG.selectedTemplate || 'default';
		return templateKey === 'zen';
	};

	const buildPromptFromTemplate = (tabs, existingStacks, languageName) => {
		const template = getSelectedTemplate();
		const othersName = getOthersName();
		
		const tabsInfo = tabs.map((tab, index) => ({
			id: index,
			title: tab.title || 'Untitled',
			domain: getHostname(tab.url),
			url: tab.url
		}));

		const isZen = isZenStyleTemplate();
		
		let tabDataList;
		if (isZen) {
			tabDataList = tabsInfo.map((t, index) =>
				`${index + 1}.\nTitle: "${t.title}"\nURL: "${t.url}"\nDescription: "N/A"`
			).join('\n\n');
		} else {
			tabDataList = tabsInfo.map(t => `${t.id}. ${t.title} (${t.domain})`).join('\n');
		}

		let existingStacksList;
		if (isZen) {
			existingStacksList = Array.isArray(existingStacks) && existingStacks.length > 0
				? existingStacks.map(s => `- ${s.name || 'Unnamed'}`).join('\n')
				: 'None';
		} else {
			existingStacksList = Array.isArray(existingStacks) && existingStacks.length > 0
				? existingStacks.map((s, i) => `${i}. Stack title: ${s.name || 'Unnamed stack'} (ID: ${s.id})`).join('\n')
				: 'None';
		}

		return template
			.replace(/\{TAB_DATA_LIST\}/g, tabDataList)
			.replace(/\{EXISTING_STACKS_LIST\}/g, existingStacksList)
			.replace(/\{LANGUAGE\}/g, languageName)
			.replace(/\{OTHERS_NAME\}/g, othersName);
	};

	const buildAIPrompt = (tabs, existingStacks, languageName) => {
		return buildPromptFromTemplate(tabs, existingStacks, languageName);
	};

	const parseAIResponse = (content, tabs) => {
		if (isZenStyleTemplate()) {
			return parseZenStyleResponse(content, tabs);
		}
		return parseJSONResponse(content);
	};

	const parseJSONResponse = (content) => {
	DEBUG && console.log('Raw AI response:', content);
		
		let jsonStr = content.trim();
		
		// Try to extract from markdown code blocks (various formats)
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
		
		// Extract JSON object from surrounding text
		const firstBrace = jsonStr.indexOf('{');
		const lastBrace = jsonStr.lastIndexOf('}');
		if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
			jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
		}
		
		// Fix common JSON issues
		jsonStr = jsonStr
			.replace(/,\s*]/g, ']')
			.replace(/,\s*}/g, '}');
		
		// Replace single quotes used as JSON delimiters (not apostrophes in values)
		jsonStr = jsonStr.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
		jsonStr = jsonStr.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
		
		// Quote unquoted keys: {foo: or , bar: patterns (but NOT {"foo": which is already valid)
		jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3');
		
	DEBUG && console.log('Cleaned JSON string:', jsonStr);
		
		try {
			return JSON.parse(jsonStr);
		} catch (parseError) {
			console.error('JSON parse error:', parseError);
			console.error('Failed JSON string:', jsonStr);
			
			// Last resort: try to extract groups array manually
			const groupsMatch = jsonStr.match(/"groups"\s*:\s*\[([\s\S]*)\]/);
			if (groupsMatch) {
				try {
					const fixedJson = '{"groups":[' + groupsMatch[1] + ']}';
		DEBUG && console.log('Attempting manual fix:', fixedJson);
					return JSON.parse(fixedJson);
				} catch (e) {
					console.error('Manual fix also failed:', e);
				}
			}
			
			showNotification('AI returned invalid JSON. Check DevTools console (F12) for details.');
			return null;
		}
	};

	const parseZenStyleResponse = (content, tabs) => {
		const rawLines = content.trim().split('\n').map(line => line.trim());
		const lines = rawLines.filter(line => line.length > 0 && !/^(output|categories|---)/i.test(line));
		
	DEBUG && console.log('Zen-style response lines:', lines);
		
		if (lines.length !== tabs.length) {
			console.warn(`Zen parser: Expected ${tabs.length} categories, got ${lines.length}`);
			if (lines.length < tabs.length) {
				while (lines.length < tabs.length) {
					lines.push(getOthersName());
				}
			} else {
				lines.length = tabs.length;
			}
		}
		
		const categoryMap = new Map();
		lines.forEach((category, index) => {
			const normalizedCategory = category.replace(/^[\d.\-)\]]+\s*/, '').trim();
			if (!categoryMap.has(normalizedCategory)) {
				categoryMap.set(normalizedCategory, []);
			}
			categoryMap.get(normalizedCategory).push(index);
		});
		
		const groups = [];
		categoryMap.forEach((tabIds, name) => {
			groups.push({
				name: name || getOthersName(),
				tab_ids: tabIds
			});
		});
		
	DEBUG && console.log('Zen-style parsed groups:', groups);
		return { groups };
	};

	// Validate AI grouping result
	const validateAIGroups = (result) => {
		if (!result.groups || !Array.isArray(result.groups)) {
			console.error('Invalid response format: missing or invalid groups array');
			showNotification('AI returned incorrect data format: missing groups array');
			return false;
		}
		
		for (const group of result.groups) {
			if (!group.name || typeof group.name !== 'string') {
				console.error('Invalid group: missing or invalid name', group);
				showNotification('AI returned group missing valid name');
				return false;
			}
			
			if (!Array.isArray(group.tab_ids)) {
				console.error('Invalid group: tab_ids is not an array', group);
				showNotification('AI returned group where tab_ids is not an array');
				return false;
			}
			
			// Check for single-tab groups (excluding "Others")
			if (group.tab_ids.length === 1 && !OTHERS_NAMES.includes(group.name)) {
				console.warn('Warning: Group has only one tab:', group);
			}
		}
		
		return true;
	};

	// Map AI results to internal format
	const mapAIResultsToGroups = (aiResult, tabs, existingStacks) => {
		const initialGroups = aiResult.groups.map(group => {
			const existingStack = existingStacks.find(s => s.name === group.name);
			
			return {
				name: group.name,
				tabs: group.tab_ids.map(id => tabs[id]).filter(t => t),
				stackId: existingStack ? existingStack.id : crypto.randomUUID(),
				isExisting: !!existingStack
			};
		});

		// Apply smart filtering rules
		const filteredGroups = initialGroups.filter(group => {
			// Rule 1: Keep existing stacks even with single tab
			if (group.isExisting) return true;
			
			// Rule 2: New stacks must have at least 2 tabs
			return group.tabs.length > 1;
		});

	DEBUG && console.log('AI grouping result after smart filtering:', filteredGroups);
		return filteredGroups;
	};

	// Handle orphan tabs (tabs not in any group)
	const handleOrphanTabs = (groupedTabs, tabs, existingStacks, languageName) => {
		const groupedTabIds = new Set();
		groupedTabs.forEach(group => {
			group.tabs.forEach(tab => {
				groupedTabIds.add(tab.id);
			});
		});

		const orphanTabs = tabs.filter(tab => !groupedTabIds.has(tab.id));

		if (orphanTabs.length === 0) {
			DEBUG && console.log('No orphan tabs found, all tabs are grouped');
			return;
		}

		DEBUG && console.log(`Found ${orphanTabs.length} orphan tabs:`, orphanTabs.map(t => t.title));
		
		// Check if "Others" group exists in AI results
		let othersGroup = groupedTabs.find(g => OTHERS_NAMES.includes(g.name));
		
		if (othersGroup) {
			// Case A: AI successfully created a multi-tab "Others" group
			DEBUG && console.log('Adding orphan tabs to existing "Others" group from AI result');
			othersGroup.tabs.push(...orphanTabs);
		} else {
			// Case B: Check original existing stacks for "Others"
			const existingOthersStack = existingStacks.find(s => OTHERS_NAMES.includes(s.name));
			
			if (existingOthersStack) {
				DEBUG && console.log('Adding orphan tabs to EXISTING "Others" stack from original list');
				groupedTabs.push({
					name: existingOthersStack.name,
					tabs: orphanTabs,
					stackId: existingOthersStack.id,
					isExisting: true
				});
			} else if (orphanTabs.length > 1) {
				// No "Others" found and multiple orphans, create new
				const othersName = getOthersName();
				DEBUG && console.log(`Creating new "Others" group with ${orphanTabs.length} tabs`);
				groupedTabs.push({
					name: othersName,
					tabs: orphanTabs,
					stackId: crypto.randomUUID(),
					isExisting: false
				});
			} else {
				// Only 1 orphan and no "Others" stack, don't create
				DEBUG && console.log('Only 1 orphan tab found and no "Others" stack, not creating group');
			}
		}
	};

	// Retry config for transient API errors
	const RETRY_CONFIG = {
		maxRetries: 2,
		baseDelayMs: 1500,
		retryableStatuses: [429, 500, 502, 503, 504],
	};

	// Human-readable API error messages
	const getApiErrorMessage = (status, errorBody) => {
		switch (status) {
			case 401: return 'Invalid API key. Check your key in TidyTabs settings.';
			case 403: return 'API key lacks permission. Check that the Gemini API is enabled for your key.';
			case 404: return 'Model not found. Check your model name in settings (e.g. gemini-3-flash-preview).';
			case 429: return 'Rate limited — too many requests. Wait a minute and try again.';
			case 500: return 'Gemini server error. This is on Google\'s side — try again shortly.';
			case 502: return 'Gemini gateway error. Google\'s servers are having issues — try again shortly.';
			case 503: return 'Gemini is temporarily overloaded. This usually resolves in a few seconds — retrying automatically.';
			case 504: return 'Gemini request timed out. Try again or use a smaller tab set.';
			default: {
				if (status >= 400 && status < 500) return `Client error (${status}). Check your API configuration.`;
				if (status >= 500) return `Server error (${status}). Google's API is having issues — try again later.`;
				return `Unexpected error (${status}).`;
			}
		}
	};

	const callApiWithRetry = async (apiConfig, requestBody) => {
		let lastError = null;
		const providerName = CONFIG.provider || 'AI';

		for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
			try {
				if (attempt > 0) {
					const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1);
					DEBUG && console.log(`[TidyTabs] Retry ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms...`);
					showNotification(`Retrying ${providerName} API (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`, 'info');
					await new Promise(r => modState.setTimeout(r, delay));
				}

				const response = await fetch(apiConfig.url, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${apiConfig.key}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(requestBody)
				});

				if (!response.ok) {
					const errorText = await response.text();
					const friendlyMsg = getApiErrorMessage(response.status, errorText);
					console.error(`[TidyTabs] API ${response.status}: ${friendlyMsg}`);
					DEBUG && console.error('[TidyTabs] Raw error body:', errorText);

					if (RETRY_CONFIG.retryableStatuses.includes(response.status) && attempt < RETRY_CONFIG.maxRetries) {
						lastError = new Error(friendlyMsg);
						continue;
					}
					throw new Error(friendlyMsg);
				}

				const data = await response.json();
				DEBUG && console.log('[TidyTabs] API full response:', data);

				if (!data.choices || !data.choices[0] || !data.choices[0].message) {
					throw new Error('Unexpected API response structure — missing choices[0].message');
				}

				if (attempt > 0) {
					showNotification(`${providerName} API succeeded on retry ${attempt}.`, 'info');
				}

				return data.choices[0].message.content;

			} catch (error) {
				lastError = error;
				// Network errors (fetch rejects) are retryable
				if (error.name === 'TypeError' && attempt < RETRY_CONFIG.maxRetries) {
					console.error(`[TidyTabs] Network error (attempt ${attempt + 1}):`, error.message);
					continue;
				}
				if (attempt >= RETRY_CONFIG.maxRetries) break;
			}
		}

		throw lastError || new Error(`${providerName} API failed after ${RETRY_CONFIG.maxRetries + 1} attempts`);
	};

	const getAIGrouping = async (tabs, existingStacks = []) => {
		const apiConfig = getApiConfig();
		
		if (!apiConfig.key) {
			console.error('API key not configured');
			showNotification('API Key not configured. Right-click TidyTabs button → Settings to add one.');
			return null;
		}
		
		if (tabs.length > CONFIG.maxTabsForAI) {
			console.warn(`Too many tabs (${tabs.length}), limiting to ${CONFIG.maxTabsForAI}`);
			tabs = tabs.slice(0, CONFIG.maxTabsForAI);
		}
		
		const browserLang = getBrowserLanguage();
		const languageName = getLanguageName(browserLang);
		
		DEBUG && console.log(`Browser language: ${browserLang} (${languageName})`);
		
		const prompt = buildAIPrompt(tabs, existingStacks, languageName);

		try {
			const providerName = CONFIG.provider || 'AI';
			DEBUG && console.log(`Calling ${providerName} API for intelligent grouping...`);
			
			const requestBody = {
				model: apiConfig.model,
				messages: [{ role: 'user', content: prompt }],
				temperature: CONFIG.temperature,
				max_tokens: CONFIG.maxTokens,
				stream: false
			};
			
			if (!isZenStyleTemplate()) {
				requestBody.response_format = { type: 'json_object' };
			}
			
			const content = await callApiWithRetry(apiConfig, requestBody);
			DEBUG && console.log('API content:', content);
			
			const result = parseAIResponse(content, tabs);
			if (!result) return null;
			
			if (!validateAIGroups(result)) return null;
			
			const groupedTabs = mapAIResultsToGroups(result, tabs, existingStacks);
			
			handleOrphanTabs(groupedTabs, tabs, existingStacks, languageName);
			
			DEBUG && console.log('AI grouping result (final):', groupedTabs);
			
			if (groupedTabs.length === 0) {
				console.warn('No valid groups created (all groups have less than 2 tabs)');
				showNotification('AI grouping failed: all groups have less than 2 tabs');
				return null;
			}
			
			return groupedTabs;
			
		} catch (error) {
			const providerName = CONFIG.provider || 'AI';
			console.error(`[TidyTabs] ${providerName} API failed:`, error);
			showNotification(`${providerName}: ${error.message}`);
			return null;
		}
	};

	// Group by domain (fallback method)
	const groupByDomain = (tabs) => {
		const tabsByHost = {};
		
		tabs.forEach(tab => {
			const hostname = getHostname(tab.url);
			if (!tabsByHost[hostname]) {
				tabsByHost[hostname] = [];
			}
			tabsByHost[hostname].push(tab);
		});
		
		// Only return groups with multiple tabs
		return Object.entries(tabsByHost)
			.filter(([_, tabs]) => tabs.length > 1)
			.map(([hostname, tabs]) => {
				const baseDomain = getBaseDomain(tabs[0].url).split('.')[0];
				const name = baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1);
				
				return {
					name: name,
					tabs: tabs,
					stackId: crypto.randomUUID(),
					isExisting: false
				};
			});
	};

	// ==================== Tab Stack Operations ====================

	// Create tab stacks from groups
	const createTabStacks = async (groups) => {
		for (const group of groups) {
			const stackId = group.stackId || crypto.randomUUID();
			const stackName = group.name;
			
			DEBUG && console.log(`${group.isExisting ? 'Adding to existing' : 'Creating'} stack "${stackName}" with ${group.tabs.length} tabs`);
			
			// Sort by index
			group.tabs.sort((a, b) => a.index - b.index);
			
			// Use first tab's position as target
			const targetIndex = group.tabs[0].index;
			
			// Move all tabs to adjacent positions and add to stack
			for (let i = 0; i < group.tabs.length; i++) {
				const tab = group.tabs[i];
				const moveIndex = targetIndex + i;
				
				// Move tab first
				await new Promise((resolve) => {
					chrome.tabs.move(tab.id, { index: moveIndex }, function() {
						if (chrome.runtime.lastError) {
							console.error('Error moving tab:', chrome.runtime.lastError);
						}
						resolve();
					});
				});
				
				// Then add to stack
				await addTabToStack(tab.id, stackId, stackName);
			}
		}
	};

	// Detect existing stacks from DOM
	const detectExistingStacks = async (nextElement) => {
		const existingStacks = [];

		while (nextElement) {
			if (nextElement.tagName !== 'SPAN') {
				nextElement = nextElement.nextElementSibling;
				continue;
			}

			const isStack =
				nextElement.querySelector(SELECTORS.STACK_COUNTER) !== null ||
				nextElement.querySelector(SELECTORS.TAB_STACK) !== null ||
				nextElement.querySelector(SELECTORS.SUBSTACK) !== null;

			if (isStack) {
				DEBUG && console.log('Found existing tab stack DOM:', nextElement.outerHTML.slice(0, 200));

				const stackWrapper = nextElement.querySelector(SELECTORS.TAB_WRAPPER);
				const stackTabId = stackWrapper?.getAttribute('data-id')?.replace('tab-', '');

				if (stackTabId) {
					const allTabs = await new Promise(resolve => {
						chrome.tabs.query({ currentWindow: true }, tabs => resolve(tabs));
					});

					const stackTab = allTabs.find(t => {
						try {
							const data = JSON.parse(t.vivExtData || '{}');
							return data && data.group && t.vivExtData.includes(stackTabId.slice(0, 8));
						} catch {
							return false;
						}
					});

					if (stackTab) {
						const viv = JSON.parse(stackTab.vivExtData);
						existingStacks.push({
							id: viv.group,
							name: viv.fixedGroupTitle || stackTab.title || 'Unnamed stack',
							tabId: stackTab.id
						});
					DEBUG && console.log(`Detected existing stack: ${viv.fixedGroupTitle || stackTab.title} (ID: ${viv.group})`);
					} else {
						console.warn('No matching chrome tab found for DOM id:', stackTabId);
					}
				}
			}

			nextElement = nextElement.nextElementSibling;
		}

		return existingStacks;
	};

	// Collect tabs from separator onwards
	const collectTabsFromSeparator = (separator) => {
		const tabsInfo = [];
		let nextElement = separator.nextElementSibling;

		while (nextElement) {
			if (nextElement.tagName === 'SPAN') {
				const tabWrapper = nextElement.querySelector(SELECTORS.TAB_WRAPPER);
				const tabPosition = nextElement.querySelector(SELECTORS.TAB_POSITION);

				const isStack =
					nextElement.querySelector(SELECTORS.STACK_COUNTER) !== null ||
					nextElement.querySelector(SELECTORS.TAB_STACK) !== null ||
					nextElement.querySelector(SELECTORS.SUBSTACK) !== null;

				// Skip stacks, collect unpinned tabs
				if (!isStack && tabPosition && !tabPosition.classList.contains(CLASSES.PINNED)) {
					const tabId = tabWrapper?.getAttribute('data-id');
					
					if (tabId) {
						const numericId = parseInt(tabId.replace('tab-', ''));
						if (!isNaN(numericId)) {
							tabsInfo.push({ id: numericId });
						}
					}
				}
			}
			nextElement = nextElement.nextElementSibling;
		}

		return tabsInfo;
	};

	// ==================== UI Components ====================

	const createTidyButton = () => {
		const button = document.createElement('div');
		button.className = CLASSES.BUTTON;
		button.textContent = 'Tidy';
		return button;
	};

	// Create loading icon
	const createLoadingIcon = () => {
		const container = document.createElement('div');
		container.className = CLASSES.LOADING;
		container.innerHTML = `<svg width="28" height="28" style="padding:8px" fill="hsl(228, 97%, 42%)" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="RadialGradient8932"><stop offset="0%" stop-color="currentColor"/><stop offset="100%" stop-color="currentColor" stop-opacity=".25"/></linearGradient></defs><style>@keyframes spin8932{to{transform:rotate(360deg)}}</style><circle cx="10" cy="10" r="8" stroke-width="2" style="transform-origin:50% 50%;stroke:url(#RadialGradient8932);fill:none;animation:spin8932 .5s infinite linear"/></svg>`;
		return container;
	};

	// Show loading state
	const showLoading = (separator) => {
		if (separator.querySelector(`.${CLASSES.LOADING}`)) return;
		
		const loadingIcon = createLoadingIcon();
		separator.appendChild(loadingIcon);
	};

	// Hide loading state
	const hideLoading = (separator) => {
		const loadingIcon = separator.querySelector(`.${CLASSES.LOADING}`);
		if (loadingIcon) {
			loadingIcon.remove();
		}
	};

	// Debounced button attachment
	const scheduleAttachButtons = (delay = CONFIG.delays.debounce) => {
		if (debounceTimer !== null) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = modState.setTimeout(() => {
			attachButtons();
			debounceTimer = null;
		}, delay);
	};

	// Attach Tidy buttons to all separators
	const attachButtons = () => {
		const separators = document.querySelectorAll(SELECTORS.SEPARATOR);

		separators.forEach(separator => {
			if (separator.querySelector(`.${CLASSES.BUTTON}`)) {
				return;
			}

			const button = createTidyButton();
			separator.appendChild(button);

			modState.addEventListener(button, 'click', function(e) {
				e.stopPropagation();
				if (e.ctrlKey || e.metaKey) {
					showSettingsDialog();
				} else {
					tidyTabsBelow(separator);
				}
			});
			
			modState.addEventListener(button, 'contextmenu', function(e) {
				e.preventDefault();
				e.stopPropagation();
				showContextMenu(e.clientX, e.clientY, separator);
			});
		});
	};
	
	const showContextMenu = (x, y, separator) => {
		const existing = document.getElementById('tidytabs-context-menu');
		if (existing) existing.remove();
		
		const menu = document.createElement('div');
		menu.id = 'tidytabs-context-menu';
		menu.innerHTML = `
			<style>
				#tidytabs-context-menu {
					position: fixed;
					background: var(--colorBgAlphaHeavy, var(--colorBg, #252525));
					backdrop-filter: blur(20px);
					-webkit-backdrop-filter: blur(20px);
					border: 1px solid var(--colorBorder, rgba(255,255,255,0.1));
					border-radius: var(--radius, 8px);
					padding: 6px;
					z-index: 999999;
					min-width: 180px;
					box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
					font-family: system-ui, -apple-system, sans-serif;
					font-size: 12px;
				}
				#tidytabs-context-menu .menu-item {
					padding: 8px 12px;
					cursor: pointer;
					color: var(--colorFg, #fff);
					display: flex;
					align-items: center;
					gap: 10px;
					border-radius: calc(var(--radius, 8px) - 2px);
					transition: background 0.15s ease;
				}
				#tidytabs-context-menu .menu-item:hover {
					background: var(--colorAccentBg, var(--colorHighlightBg, rgba(255,255,255,0.1)));
					color: var(--colorAccentFg, var(--colorFg, #fff));
				}
				#tidytabs-context-menu .menu-item .icon {
					width: 18px;
					text-align: center;
					font-size: 14px;
					opacity: 0.9;
				}
				#tidytabs-context-menu .menu-item .label {
					flex: 1;
				}
				#tidytabs-context-menu .menu-item .shortcut {
					font-size: 10px;
					opacity: 0.5;
					margin-left: auto;
				}
				#tidytabs-context-menu .menu-separator {
					height: 1px;
					background: var(--colorBorder, rgba(255,255,255,0.1));
					margin: 6px 8px;
				}
			</style>
			<div class="menu-item" data-action="tidy">
				<span class="icon">📑</span>
				<span class="label">Tidy by Domain</span>
			</div>
			<div class="menu-item" data-action="tidy-ai">
				<span class="icon">✨</span>
				<span class="label">Tidy with AI</span>
			</div>
			<div class="menu-separator"></div>
			<div class="menu-item" data-action="settings">
				<span class="icon">⚙️</span>
				<span class="label">Settings</span>
				<span class="shortcut">Ctrl+Click</span>
			</div>
		`;
		
		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;
		document.body.appendChild(menu);
		
		const closeMenu = () => menu.remove();
		
		menu.querySelectorAll('.menu-item').forEach(item => {
			modState.addEventListener(item, 'click', () => {
				const action = item.dataset.action;
				closeMenu();
				
				if (action === 'tidy') {
					tidyTabsBelow(separator, false);
				} else if (action === 'tidy-ai') {
					tidyTabsBelow(separator, true);
				} else if (action === 'settings') {
					showSettingsDialog();
				}
			});
		});
		
		modState.setTimeout(() => {
			modState.addEventListener(document, 'click', closeMenu, { once: true });
		}, 0);
	};

	// ==================== Core Functionality ====================

	// Auto-stack workspace tabs
	const autoStackWorkspace = async (workspaceId) => {
		const allowed = await isAutoStackAllowed(workspaceId);
		
		if (!allowed) return;
		
		const workspaceName = await getWorkspaceName(workspaceId);
		DEBUG && console.log(`Auto-stacking workspace: ${workspaceName}`);
		
		const tabs = await getTabsByWorkspace(workspaceId);
		
		if (tabs.length < 2) {
			DEBUG && console.log('Not enough tabs in workspace');
			return;
		}
		
		let groups;
		
		if (CONFIG.enableAIGrouping && getApiConfig().key) {
			groups = await getAIGrouping(tabs);
			
			if (!groups) {
				DEBUG && console.log('AI grouping failed, falling back to domain grouping');
				groups = groupByDomain(tabs);
			}
		} else {
			groups = groupByDomain(tabs);
		}
		
		if (groups.length === 0) {
			DEBUG && console.log('No groups to create');
			return;
		}
		
		await createTabStacks(groups);
		DEBUG && console.log('Auto-stacking completed!');
	};

	const tidyTabsBelow = async (separator, forceAI = null) => {
		const existingStacks = await detectExistingStacks(separator.nextElementSibling);
		const tabsInfo = collectTabsFromSeparator(separator);

		DEBUG && console.log('Tabs found:', tabsInfo.length);
		DEBUG && console.log('Existing stacks found:', existingStacks.length);

		if (tabsInfo.length < 2 && existingStacks.length === 0) {
			DEBUG && console.log('Not enough tabs to group (need at least 2) and no existing stacks');
			return;
		}

		showLoading(separator);

		try {
			const tabs = await Promise.all(tabsInfo.map(info => getTab(info.id)));

			const validTabs = tabs.filter(t => t !== null);
			
			DEBUG && console.log('Valid tabs:', validTabs.length);

			if (validTabs.length < 1 && existingStacks.length === 0) {
				DEBUG && console.log('No valid tabs or existing stacks');
				return;
			}

			let groups;
			const useAI = forceAI !== null ? forceAI : (CONFIG.enableAIGrouping && getApiConfig().key);
			
			if (useAI && getApiConfig().key) {
				DEBUG && console.log('Using AI grouping...');
				groups = await getAIGrouping(validTabs, existingStacks);
				
				if (!groups) {
					DEBUG && console.log('AI grouping failed, falling back to domain grouping');
					groups = groupByDomain(validTabs);
				}
			} else if (useAI && !getApiConfig().key) {
				showNotification('AI requested but no API key configured. Right-click → Settings to add one.');
				groups = groupByDomain(validTabs);
			} else {
				DEBUG && console.log('Using domain grouping...');
				groups = groupByDomain(validTabs);
			}

			if (groups.length === 0) {
				DEBUG && console.log('No groups to create');
				return;
			}

			await createTabStacks(groups);
			DEBUG && console.log('Tab stacking completed!');
		} finally {
			hideLoading(separator);
			scheduleAttachButtons(CONFIG.delays.reattach);
		}
	};

	// ==================== Event Listeners ====================

	// Setup auto-stacking listener
	const setupAutoStackListener = () => {
		if (!chrome.webNavigation) return;

		modState.addChromeListener(chrome.webNavigation, 'onCommitted', async (details) => {
			if (details.tabId !== -1 && details.frameType === 'outermost_frame') {
				const tab = await getTab(details.tabId);
				
				if (tab && !tab.pinned && tab.vivExtData && !tab.vivExtData.panelId) {
					const workspaceId = tab.vivExtData.workspaceId;
					
					modState.setTimeout(() => {
						autoStackWorkspace(workspaceId);
					}, CONFIG.delays.autoStack);
				}
			}
		});
		
		DEBUG && console.log('Auto-stacking listener registered');
	};

	// Setup mutation observer for tab strip changes
	const observeTabStrip = () => {
		const tabStrip = document.querySelector(SELECTORS.TAB_STRIP);
		
		if (!tabStrip) {
			modState.setTimeout(observeTabStrip, CONFIG.delays.retry);
			return;
		}

		modState.addObserver(tabStrip, function(mutations) {
			let hasTabChange = false;
			let hasWorkspaceSwitch = false;

			for (const mutation of mutations) {
				// Check for new tab elements
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
							hasTabChange = true;
							break;
						}
					}
				}

				// Check for workspace switch
				if (mutation.type === 'attributes' && mutation.attributeName === 'aria-owns') {
					hasWorkspaceSwitch = true;
				}

				if (hasTabChange && hasWorkspaceSwitch) break;
			}

			if (hasTabChange || hasWorkspaceSwitch) {
				const delay = hasWorkspaceSwitch ? CONFIG.delays.workspaceSwitch : CONFIG.delays.mutation;
				scheduleAttachButtons(delay);
			}
		}, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-owns']
		});
	};

	// ==================== Initialization ====================

	const init = () => {
		DEBUG && console.log('Initializing TidyTabs extension');
		DEBUG && console.log('AI grouping:', CONFIG.enableAIGrouping ? 'enabled' : 'disabled');
		DEBUG && console.log('Auto-stack workspaces:', CONFIG.autoStackWorkspaces);

		modState.setTimeout(attachButtons, CONFIG.delays.init);
		observeTabStrip();
		setupAutoStackListener();
	};

	// Start when DOM is ready
	if (document.readyState === 'loading') {
		modState.addEventListener(document, 'DOMContentLoaded', init);
	} else {
		init();
	}

	window.addEventListener('beforeunload', () => modState.cleanup());
})();
