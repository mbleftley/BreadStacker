# BREAD STACKER // ARCADE INTERFACE
### PREMIUM PROCEDURAL STACKING SYSTEM

[![License: MIT](https://img.shields.io/badge/License-MIT-fcd34d.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live_Deployment-Access_Interface-fbbf24.svg)](https://mbleftley.github.io/BreadStacker/)
[![System Status](https://img.shields.io/badge/System_Status-Operational-fbbf24.svg)](#)

**BREAD STACKER** is a high-fidelity, architectural arcade experience built with a precision-engineered procedural stacking engine. 

---

## 🕹️ GAMEPLAY PROFILES

### [ 🧱 ] STANDARD MODE
The classic stacking circuit. Build a sophisticated structure by perfectly timing your slice drops. 
*   **Parameters:** Falling below 50% overlap results in an immediate system failure.
*   **Goal:** Construct the tallest, most stable vertical structure possible.

### [ ⚡ ] COMBO SYSTEM (HIGH INTENSITY)
A performance-based challenge triggered by consecutive "Perfect" alignments.
*   **Parameters:** Every perfect placement adds to your combo multiplier (up to x5).
*   **Reward Logic:** Perfect hits trigger **YEAST MODE** (Dynamic Multiplier), intensifying audio-visual feedback and accelerating score gains.
*   **Objective:** Maintain maximum structural rhythm and momentum through precise timing.

---

## 🖥️ SYSTEM ARCHITECTURE & TELEMETRY

*   **Anti-Overlap Engine:** A dynamic, responsive camera system that measures relative pixel gaps between UI elements to ensure optimal framing across all viewports.
*   **Procedural Audio Engine:** High-fidelity, synthesized "Wood Block" percussion generated in real-time via the Web Audio API. Tonal frequencies scale dynamically based on combo performance.
*   **Measurement Ruler:** A scale-compensated vertical telemetry system. Font scaling and positioning adjust dynamically to the tower's zoom level for constant legibility.

---

## 🛠️ TECHNICAL SPECIFICATIONS

| Component | Specification |
| :--- | :--- |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Graphics** | HTML5 Canvas API |
| **Motion** | GSAP (Advanced Interpolation & UI) |
| **Audio** | Web Audio API (Procedural Synthesis) |
| **Styling** | Modern CSS (Absolute Responsive Anchoring) |
| **Storage** | LocalStorage (High Score Telemetry) |

---

## 🚀 DEPLOYMENT & INSTALLATION

The system requires no backend infrastructure. Simply clone the repository and execute `index.html`.

```bash
# Clone the repository
git clone https://github.com/mbleftley/BreadStacker.git

# Navigate to the project directory
cd BreadStacker

# Launch the interface
open index.html
```

---

## 🎖️ SYSTEM CREDITS
**SYSTEM ARCHITECT:** [MBLXPERIMENT](https://x.com/MBLExperiment)  
**TECHNICAL ASSISTANT:** Developed with the support of [Google's Anti-Gravity AI](https://antigravity.google/).

> [!NOTE]
> *This project was built to test high-fidelity UI responsiveness and procedural audio rhythm. All physics and measurements are optimized for arcade-style precision.*
