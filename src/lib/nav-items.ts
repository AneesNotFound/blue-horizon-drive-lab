import {
  LayoutDashboard,
  Map,
  BrainCircuit,
  Zap,
  Activity,
  TrafficCone,
  Gauge,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  shortTitle: string;
  url: string;
  icon: LucideIcon;
  phase: 1 | 2;
};

export const navItems: NavItem[] = [
  { title: "Overview Dashboard", shortTitle: "Overview", url: "/", icon: LayoutDashboard, phase: 1 },
  { title: "Route Planner", shortTitle: "Route Planner", url: "/route-planner", icon: Map, phase: 1 },
  { title: "AI Prediction Centre", shortTitle: "Prediction", url: "/prediction-centre", icon: BrainCircuit, phase: 1 },
  { title: "Energy Management", shortTitle: "Energy", url: "/energy-management", icon: Zap, phase: 1 },
  { title: "Digital Twin Simulation", shortTitle: "Digital Twin", url: "/digital-twin", icon: Activity, phase: 1 },
  { title: "Traffic & Intersection Analysis", shortTitle: "Traffic", url: "/traffic-analysis", icon: TrafficCone, phase: 1 },
  { title: "Model Performance", shortTitle: "Model Performance", url: "/model-performance", icon: Gauge, phase: 1 },
  { title: "Trip History", shortTitle: "Trip History", url: "/trip-history", icon: History, phase: 1 },
  { title: "Settings & Data Sources", shortTitle: "Settings", url: "/settings", icon: Settings, phase: 1 },
];
