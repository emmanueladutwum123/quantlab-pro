# QuantLab Pro

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)

**Institutional-grade quantitative finance calculator**  
Black-Scholes · Avellaneda-Stoikov HFT · Kelly Criterion · GARCH · Hurst Exponent · OU Process · Ghana Cocoa Derivatives

[**Live Web App**](https://emmanueladutwum123.github.io/quantlab-pro) · [**Download on Android**](#install) · [**View on App Store**](#install)

</div>

---

## What It Does

QuantLab Pro brings professional-grade financial mathematics to your pocket. Every model runs entirely client-side — no API calls, no server, instant results as you move the sliders.

### 📐 Options Pricing Lab
| Feature | Detail |
|---------|--------|
| Black-Scholes Pricer | Call & put prices with intrinsic/time value breakdown |
| Full Greeks | Δ Delta · Γ Gamma · Θ Theta · ν Vega · ρ Rho (call & put) |
| IV Solver | Newton-Raphson implied volatility from market price |
| Put-Call Parity | Real-time parity error check |
| Moneyness | ITM / ATM / OTM classification with d1, d2 display |

### ⚡ HFT Market Making Simulator (Avellaneda-Stoikov)
| Feature | Detail |
|---------|--------|
| Optimal Quotes | Reservation price + optimal bid/ask spread in bps |
| Inventory Skew | Quote adjustment based on signed inventory position |
| Order Flow | Arrival rates λ_bid, λ_ask via exponential decay |
| Monte Carlo | 150-path P&L simulation with Sharpe, max drawdown, win rate |
| Interpretation | Plain-English explanation of every model output |

### 📊 MT5 Trading Tools
| Tool | What it computes |
|------|-----------------|
| Position Size | Lots, units, risk $ from stop-loss pips — all 5 M3 instruments |
| Kelly Criterion | Full & fractional Kelly, expected value, edge/loss ratio |
| Risk/Reward | R:R ratio, break-even win rate, expected value per pip |
| Drawdown Recovery | Required gain %, estimated trades to recover |

### 🌿 Ghana Cocoa Derivatives Research Lab
| Tool | Detail |
|------|--------|
| Futures Fair Value | Cost-of-carry model: F = S·e^(r+u−y)T, basis & arbitrage detection |
| Options on Cocoa | Black-Scholes on cocoa futures, per-contract pricing (10t) |
| Optimal Hedge Ratio | OLS regression h* with R², hedging effectiveness %, contract count |

### 🔬 Quant Toolkit
| Model | Detail |
|-------|--------|
| Hurst Exponent | R/S analysis — trend (H>0.6) / random walk / mean-reversion (H<0.4) |
| GARCH(1,1) | σ²_t = ω + αε²_{t-1} + βσ²_{t-1} · persistence · long-run vol · conditional vol sparkline |
| Ornstein-Uhlenbeck | θ (speed), μ (mean), σ (diffusion), half-life, z-score trading signal |
| Performance Ratios | Sharpe · Sortino · Calmar · Max Drawdown · VaR 95% · CVaR/ES 95% |

---

## Architecture

```
src/
├── math/                     Pure TypeScript — zero external dependencies
│   ├── blackScholes.ts        BS pricer · Greeks · normCDF/PDF · IV Newton-Raphson
│   ├── avellanedaStoikov.ts   A-S optimal quotes · inventory risk · Monte Carlo
│   ├── mt5Tools.ts            Kelly · position sizing · margin · R:R · drawdown
│   └── quantTools.ts          Hurst · GARCH · OU · Sharpe/Sortino/Calmar · VaR · Cocoa futures
├── screens/
│   ├── HomeScreen.tsx         Module grid + feature index
│   ├── OptionsScreen.tsx      BS pricer / Greeks / IV solver
│   ├── HFTScreen.tsx          A-S quotes / Monte Carlo P&L
│   ├── MT5Screen.tsx          4 trading tools
│   ├── CocoaScreen.tsx        3 cocoa derivative tools
│   └── QuantScreen.tsx        4 quant models
├── components/
│   ├── Card.tsx               Card · MetricRow · Badge shared components
│   └── SliderInput.tsx        Reusable labelled slider
└── theme/
    └── index.ts               Deep navy dark theme tokens
```

**All math is implemented from first principles** — no `mathjs`, no finance libraries. The Black-Scholes normCDF uses the Abramowitz & Stegun polynomial approximation; the IV solver is Newton-Raphson; GARCH uses iterative variance updating; Hurst uses multi-lag R/S regression.

---

## Install

### Run locally (web or mobile)
```bash
git clone https://github.com/emmanueladutwum123/quantlab-pro.git
cd quantlab-pro
npm install
npx expo start
# Press W → opens in browser
# Scan QR code → opens in Expo Go on your phone
```

### Build for Android (Play Store)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas submit --platform android
```

### Build for iOS (App Store)
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Deploy web to GitHub Pages
Push to `master` — GitHub Actions automatically exports and deploys via `.github/workflows/deploy-web.yml`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52 + React Native 0.76 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v7 — bottom tabs |
| UI | Custom dark theme components (no UI library dependency) |
| Charts | Inline bar/sparkline renders (native Views) |
| Sliders | `@react-native-community/slider` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Gradient | `expo-linear-gradient` |
| Build | EAS Build (cloud) |
| Web deploy | GitHub Actions → GitHub Pages |

---

## Background

This app was built alongside my **M3 Ultra Alpha** algorithmic trading system — a live multi-asset MT5 strategy running on EURUSD, GBPUSD, USDJPY, US30, and USTEC. The tools here are the exact calculations the strategy depends on:

- The **Kalman Filter** and **OU z-score** are live signal generators in M3
- The **Kelly Criterion** drives M3's position sizing logic  
- The **GARCH(1,1)** gates entries by volatility regime
- The **Hurst Exponent** classifies whether to use momentum or mean-reversion entries
- The **Black-Scholes** and **hedge ratio** tools extend into Ghana Cocoa derivatives research

---

## Author

**Emmanuel Adutwum** — Software Engineer · ML Engineer · Quantitative Researcher  
[Portfolio](https://emmanueladutwum123.github.io) · [LinkedIn](https://www.linkedin.com/in/emmanuel-adutwum/) · [GitHub](https://github.com/emmanueladutwum123)

> *"Mathematics should be accessible to everyone who needs to make financial decisions."*
