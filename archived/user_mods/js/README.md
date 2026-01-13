# JavaScript Mods

JS mods require VivaldiModManager (Windows only). Enable/disable via ModManager UI.

## Included Mods

| File | Description | Source |
|------|-------------|--------|
| `globalMediaControls.js` | Media playback panel with controls, volume, PiP | Tam710562 |
| `mdNotes.js` | Markdown notes editor in sidebar | Tam710562 |
| `elementCapture.js` | Screenshot/element capture tool | Tam710562 |
| `activateTabOnHover.js` | Switch tabs on mouse hover | luetage |
| `tabScroll.js` | Mouse wheel scrolling in tab bar | luetage |
| `monochromeIcons.js` | Convert toolbar icons to monochrome | luetage |
| `colorTabs.js` | Color tab borders based on favicon | aminought |
| `chroma.min.js` | Color library (required by colorTabs) | - |
| `tidyTabs.js` | AI-powered tab grouping | PaRr0tBoY (modified) |

## AI Tab Grouping (tidyTabs.js)

**Setup:**
1. Enable `tidyTabs.js` in ModManager
2. Restart Vivaldi
3. Ctrl+Click the TidyTabs button OR run `tidyTabsSettings()` in DevTools console
4. Select your AI provider and enter API key
5. Click Save

**Supported Providers:**
| Provider | Free Tier | Get API Key |
|----------|-----------|-------------|
| Google Gemini | Yes (generous) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| OpenRouter | Yes (limited) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| OpenAI | No | [platform.openai.com](https://platform.openai.com) |
| GLM (Zhipu) | Yes | [open.bigmodel.cn](https://open.bigmodel.cn) |
| Custom | - | Any OpenAI-compatible API |

Settings are saved to localStorage and persist across restarts.

## Credits

All JS mods from [Awesome-Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi) by @PaRr0tBoY and community contributors.
