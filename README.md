# Piano Tutor AI

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B%20Modules-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-630ed4.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![UI: CSS3](https://img.shields.io/badge/CSS3-Flexbox%20%7C%20Grid-264de4.svg)](https://www.w3.org/TR/css/)

> An interactive web-based piano learning platform combining real-time sound synthesis (Web Audio API) with generative AI conversational tutoring (compatible with Azure OpenAI, OpenAI, and Google Gemini endpoints).

---

## 1. Project Overview

**Piano Tutor AI** is a lightweight, responsive single-page web application (SPA) created to deliver self-paced musical instruction. It bridges the gap between theoretical knowledge and practical musical application by providing an integrated dual workspace: a conversational AI tutor on one side and a fully functional interactive virtual keyboard on the other.

Users can ask musical questions, learn scales, understand chords, and immediately verify pitch and finger placement using interactive mouse clicks or computer keyboard key-mappings without needing third-party audio plugins or server-side runtimes.

---

## 2. Objectives

- **Democratize Musical Education:** Provide accessible, zero-cost, barrier-free piano instruction directly in the web browser.
- **Unify Theory and Practice:** Enable learners to read tutor guidance and practice tactile note-playing simultaneously in an integrated interface.
- **Dynamic & Secure AI Connectivity:** Decouple sensitive API credentials from the codebase through a hierarchical three-tier configuration management system (`localStorage` > `env.json` > Manual User Modal).
- **Zero Heavy Dependencies:** Deliver smooth audio synthesis, fluid animations, and layout transitions using pure vanilla standards (HTML5, CSS3, Modern JavaScript Modules).

---

## 3. Technologies & Tools

### Core Stack
- **HTML5:** Semantic architecture, accessible forms, modal dialogs, and keyboard input hints (`<kbd>`).
- **CSS3:** Custom properties (CSS variables), Flexbox, CSS Grid layouts, glassmorphism (`backdrop-filter`), keyframe animations (`fadeIn`, `slideUp`), and responsive media queries.
- **JavaScript (ES6+ Modules):** Native ES modules (`import`/`export`), IIFE encapsulation, asynchronous fetch handling, and event listeners.
- **Web Audio API:** Real-time polyphonic and monophonic sound generation using native `AudioContext`, `OscillatorNode` (triangle waveforms), and `GainNode` envelope shaping (attack and exponential decay).

### External Typography & Icons
- **Google Fonts:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) for typography.
- **Google Fonts:** [Material Symbols Outlined](https://fonts.google.com/icons) for contextual interface iconography.

### API & Protocol Integrations
- **Supported AI Interfaces:** Azure OpenAI Responses API, OpenAI Chat Completions API (`/v1/chat/completions`), and Google Gemini REST API endpoints.

---

## 4. Project Structure

```plaintext
Pianotutor/
│
├── .gitattributes          # Git line-ending normalization rules
├── .gitignore              # Ignores sensitive environment configuration (env.json)
├── env.json                # Local / deployment template for default API credentials
├── index.html              # Main application entry point and DOM layout
│
├── css/
│   └── style.css           # Complete design system, layouts, themes, and modal styling
│
└── js/
    ├── config.js           # Configuration manager (storage, env fetching, priority logic)
    ├── api.js              # AI integration service (HTTP client, multi-provider parsing)
    └── script.js           # Main UI controller, audio synthesizer, and chat logic
```

### Key Files Description

| File | Purpose |
| :--- | :--- |
| [`index.html`](index.html) | Defines the Single Page Application structure: Top navigation bar, Welcome Hero section, Studio workspace (Chat Panel & Virtual Piano Panel), and the API Settings Modal. |
| [`css/style.css`](css/style.css) | Central stylesheet featuring design tokens, responsive breakpoints (desktop, tablet, mobile), piano key skeuomorphism, and modal transition states. |
| [`js/config.js`](js/config.js) | Encapsulates `ConfigManager`: handles API credential validation, URL protocol sanitization, listener subscriptions, and priority evaluation. |
| [`js/api.js`](js/api.js) | Implements `ApiService`: communicates with configured LLM endpoints, wraps system prompts, and sanitizes API keys to prevent credential leakage in error traces. |
| [`js/script.js`](js/script.js) | Main application controller: binds keyboard/click audio events, manages UI view switches (*Both*, *Only Chat*, *Only Piano*), and drives chat state. |
| [`env.json`](env.json) | Configuration file for default API endpoint credentials (excluded from version control). |

---

## 5. Methodology & Architecture

### System Architecture

The following diagram illustrates the flow of data, state management, and user interaction within the application:

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|                                                                                   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|   |   Studio View Modes   |   |   Chat Panel (Tutor)  |   |   Virtual Piano   |   |
|   |  (Both / Chat / Piano)|   |  Prompt Input / Fast  |   |   Mouse & QWERTY  |   |
|   |                       |   |       Replies         |   |      Keyboard     |   |
|   +-----------+-----------+   +-----------+-----------+   +---------+---------+   |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
                v                           v                         v
+-------------------------------+   +-------------------+   +-----------------------+
|        script.js (UI)         |   |    api.js (AI)    |   |    Web Audio API      |
|  - View switching             |   |  - System prompt  |   |  - AudioContext       |
|  - DOM message rendering      |-->|  - Multi-provider |   |  - Triangle wave osc. |
|  - Modal open/save controls   |   |    payload parser |   |  - Exponential decay  |
+---------------+---------------+   +---------+---------+   +-----------------------+
                |                             |
                v                             v
+-------------------------------+   +-------------------+
|      config.js (Manager)      |   |   External LLM    |
|  - Priority 1: localStorage   |   | (Azure OpenAI /   |
|  - Priority 2: env.json       |   |  OpenAI / Gemini) |
|  - Priority 3: Manual Modal   |   +-------------------+
+-------------------------------+
```

### Configuration Priority Logic

Piano Tutor AI enforces a strict three-tier configuration hierarchy:

1. **Priority 1 — `localStorage`:** Checked first on startup. If valid user credentials exist in the browser, they take immediate precedence.
2. **Priority 2 — `env.json`:** If `localStorage` is empty, the application attempts to fetch `./env.json`. If valid credentials are found, they are utilized.
3. **Priority 3 — Manual Configuration:** If neither source yields valid credentials, outbound API calls are held, and the user is prompted to provide their credentials via the Settings Modal.

---

## 6. Implementation Details

### 1. Web Audio Sound Synthesis
Unlike apps relying on large `.mp3`/`.wav` sample libraries, Piano Tutor AI synthesizes sounds directly using the browser's native audio engine:
- **Oscillator Type:** `triangle`, producing a mellow, harmonic-rich acoustic timbre suitable for piano tones.
- **Frequencies Supported:** Equal temperament chromatic range from $C_4$ ($261.63\text{ Hz}$) to $C_5$ ($523.25\text{ Hz}$).
- **Envelope Dynamics:** Dynamic gain curve with a rapid $15\text{ ms}$ attack ramp up to $0.22$ volume, followed by an exponential decay to near-silence ($0.0001$) over $850\text{ ms}$.

### 2. Multi-Provider AI Response Parser
[`js/api.js`](js/api.js) contains adaptable parsers capable of interpreting payloads across major LLM service formats:
- **Azure OpenAI Responses API:** Detects `data.output` array filtering for `output_text`.
- **OpenAI Standard:** Detects `data.choices[0].message.content`.
- **Google Gemini REST:** Detects `data.candidates[0].content.parts[].text`.

### 3. Security & Key Sanitization
- API keys stored in `localStorage` or inputted into the modal are masked by default via `type="password"`.
- Error messages returned from network calls or HTTP exceptions are scrubbed with regex replacement to guarantee that secret keys are replaced with `[CHAVE_PROTEGIDA]` before display in the UI or console.

---

## 7. Results & Key Features

- **Interactive Virtual Piano:** Full one-octave diatonic and chromatic keyboard ($C_4$ through $C_5$) with responsive pressed states and note readout.
- **PC Keyboard Mapping:** Bindings mapped to natural home-row ergonomics:
  - White keys: `A` ($C$), `S` ($D$), `D` ($E$), `F` ($F$), `G` ($G$), `H` ($A$), `J` ($B$).
  - Black keys: `W` ($C^\sharp$), `E` ($D^\sharp$), `T` ($F^\sharp$), `Y` ($G^\sharp$), `U` ($A^\sharp$).
- **One-Click Scale Playback:** Built-in automation button that sequences through the C Major diatonic scale with precise timing intervals.
- **Workspace Views:** Flexible layout switcher offering:
  - **Chat + Piano:** Dual-panel desktop view for simultaneous practice and inquiry.
  - **Only Chat:** Distraction-free conversational mode.
  - **Only Piano:** Expanded performance mode with enlarged keys.
- **Dynamic Settings Dialog:** Real-time API configuration modal with live active-source indicator and credential validation.

---

## 8. How to Run the Project

Since this project uses native **ES Modules** and fetches `./env.json`, it must be served through a local HTTP server rather than loaded directly via the `file://` protocol.

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
- Any local HTTP server utility (such as Python, Node.js, or VS Code Live Server).

### Step-by-Step Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/naarah4849-stack/Pianotutor.git
   cd Pianotutor
   ```

2. **Configure API Credentials (Optional):**
   You can either configure your API key through the user interface or create an `env.json` file in the root folder:
   ```json
   {
     "apiKey": "your-api-key-here",
     "endpoint": "https://api.openai.com/v1/chat/completions",
     "model": "gpt-4o-mini"
   }
   ```

3. **Start a local HTTP server:**

   *Using Python 3:*
   ```bash
   python -m http.server 8000
   ```

   *Using Node.js (`npx`):*
   ```bash
   npx serve .
   ```

   *Using VS Code:*
   Right-click `index.html` and select **Open with Live Server**.

4. **Access the application:**
   Open your browser and navigate to:
   ```text
   http://localhost:8000
   ```

---

## 9. Future Improvements

- [ ] **Multi-Octave Range Expansion:** Add octave shifting controls ($C_2$ to $C_7$) for advanced repertoire practice.
- [ ] **Polyphonic Chords via Keyboard:** Enhance simultaneous keypress detection to synthesize full harmonic triads cleanly.
- [ ] **MIDI Hardware Support:** Integrate the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) to allow physical USB/Bluetooth MIDI keyboards to control the virtual tutor.
- [ ] **Interactive Sheet Music Rendering:** Integrate VexFlow or OpenSheetMusicDisplay to display real-time musical notation above the piano keys.
- [ ] **Practice Evaluation Engine:** Implement an automated pitch-comparison mechanism where the tutor listens to user practice via microphone input.

---

## 10. Author & Acknowledgments

- **Author:** [Naara Alves](https://github.com/naarah4849-stack)
- **Repository:** [https://github.com/naarah4849-stack/Pianotutor](https://github.com/naarah4849-stack/Pianotutor)
- **Design Inspiration:** Modern ed-tech interactive tools with inclusive and minimalist design patterns.
