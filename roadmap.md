# Roadmap — AI-Driven Predictive Energy Management System

## Phase 1 — DONE (Oct 2026)
- [x] Black-and-blue responsive theme (#080B12 / #101725 / #2583FF / #36D9FF), Space Grotesk + DM Sans
- [x] Sidebar (desktop) + offcanvas mobile nav; 9 working pages
- [x] Overview dashboard: live simulated telemetry, forecast chart, high-load timeline, strategy comparison, demo route schematic
- [x] Data-source labelling system (Measured / Dataset-derived / Simulated / Predicted / Demo)
- [x] Placeholder-but-working pages for later-phase modules with "Not evaluated" / "Not configured" states

## Phase 2 — Google Maps route planner
- [ ] Maps JavaScript API + Routes API + Places autocomplete + Elevation API
- [ ] Interactive map, selectable routes, traffic-aware routing, elevation/gradient segments
- [ ] Real mapped intersections; per-segment predicted power demand

## Phase 3 — Prediction backend
- [ ] Python FastAPI backend: threshold baseline, Random Forest, XGBoost
- [ ] 60-second high-load classifier (90th-percentile configurable threshold), demand regressor
- [ ] Trip-grouped splits, calibration, SHAP explanations, demo-vs-trained mode switch

## Phase 4 — Full simulation & evaluation
- [ ] Digital twin run comparison UI (battery-only vs rule-based vs AI-predictive)
- [ ] Model Performance page filled from real evaluation runs
- [ ] Persistent trip history + CSV export of real runs
- [ ] Predictive decision engine vs baseline comparison
