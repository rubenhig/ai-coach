import {
  Activity as ActivityIcon,
  Anchor,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  Mountain,
  PersonStanding,
  Snowflake,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Activity, ActivityType } from './types'

export type { Activity, ActivityType }

export type TypeConfig = {
  label: string
  icon: LucideIcon
  color: string
  gradient: string
  badgeClass: string
  isRun: boolean
  isCycling: boolean
  isSwim: boolean
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  // --- Carrera ---
  Run: {
    label: 'Carrera',
    icon: PersonStanding,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-500/5',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-200',
    isRun: true, isCycling: false, isSwim: false,
  },
  TrailRun: {
    label: 'Trail',
    icon: Mountain,
    color: 'text-green-600',
    gradient: 'from-green-600/20 to-green-600/5',
    badgeClass: 'bg-green-500/10 text-green-700 border-green-200',
    isRun: true, isCycling: false, isSwim: false,
  },
  VirtualRun: {
    label: 'Carrera virtual',
    icon: PersonStanding,
    color: 'text-blue-400',
    gradient: 'from-blue-400/20 to-blue-400/5',
    badgeClass: 'bg-blue-400/10 text-blue-500 border-blue-200',
    isRun: true, isCycling: false, isSwim: false,
  },

  // --- Ciclismo ---
  Ride: {
    label: 'Ciclismo',
    icon: Bike,
    color: 'text-strava',
    gradient: 'from-orange-500/20 to-orange-500/5',
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-200',
    isRun: false, isCycling: true, isSwim: false,
  },
  MountainBikeRide: {
    label: 'MTB',
    icon: Bike,
    color: 'text-amber-700',
    gradient: 'from-amber-700/20 to-amber-700/5',
    badgeClass: 'bg-amber-700/10 text-amber-800 border-amber-300',
    isRun: false, isCycling: true, isSwim: false,
  },
  GravelRide: {
    label: 'Gravel',
    icon: Bike,
    color: 'text-stone-500',
    gradient: 'from-stone-500/20 to-stone-500/5',
    badgeClass: 'bg-stone-500/10 text-stone-600 border-stone-200',
    isRun: false, isCycling: true, isSwim: false,
  },
  VirtualRide: {
    label: 'Rodillo',
    icon: Zap,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-purple-500/5',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-200',
    isRun: false, isCycling: true, isSwim: false,
  },
  EBikeRide: {
    label: 'E-Bike',
    icon: Zap,
    color: 'text-yellow-500',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
    badgeClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    isRun: false, isCycling: true, isSwim: false,
  },
  Handcycle: {
    label: 'Handbike',
    icon: Bike,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/20 to-indigo-500/5',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    isRun: false, isCycling: true, isSwim: false,
  },
  Velomobile: {
    label: 'Velomóvil',
    icon: Bike,
    color: 'text-indigo-400',
    gradient: 'from-indigo-400/20 to-indigo-400/5',
    badgeClass: 'bg-indigo-400/10 text-indigo-500 border-indigo-200',
    isRun: false, isCycling: true, isSwim: false,
  },

  // --- A pie ---
  Walk: {
    label: 'Caminata',
    icon: Footprints,
    color: 'text-teal-600',
    gradient: 'from-teal-500/20 to-teal-500/5',
    badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Hike: {
    label: 'Senderismo',
    icon: Mountain,
    color: 'text-amber-600',
    gradient: 'from-amber-500/20 to-amber-500/5',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  RockClimbing: {
    label: 'Escalada',
    icon: Mountain,
    color: 'text-orange-700',
    gradient: 'from-orange-700/20 to-orange-700/5',
    badgeClass: 'bg-orange-700/10 text-orange-800 border-orange-300',
    isRun: false, isCycling: false, isSwim: false,
  },

  // --- Agua ---
  Swim: {
    label: 'Natación',
    icon: Waves,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    isRun: false, isCycling: false, isSwim: true,
  },
  Rowing: {
    label: 'Remo',
    icon: Anchor,
    color: 'text-cyan-700',
    gradient: 'from-cyan-700/20 to-cyan-700/5',
    badgeClass: 'bg-cyan-700/10 text-cyan-800 border-cyan-300',
    isRun: false, isCycling: false, isSwim: false,
  },
  Canoeing: {
    label: 'Piragüismo',
    icon: Anchor,
    color: 'text-sky-600',
    gradient: 'from-sky-600/20 to-sky-600/5',
    badgeClass: 'bg-sky-600/10 text-sky-700 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Kayaking: {
    label: 'Kayak',
    icon: Anchor,
    color: 'text-sky-500',
    gradient: 'from-sky-500/20 to-sky-500/5',
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  StandUpPaddling: {
    label: 'Paddle surf',
    icon: Anchor,
    color: 'text-sky-400',
    gradient: 'from-sky-400/20 to-sky-400/5',
    badgeClass: 'bg-sky-400/10 text-sky-500 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Surfing: {
    label: 'Surf',
    icon: Waves,
    color: 'text-blue-600',
    gradient: 'from-blue-600/20 to-blue-600/5',
    badgeClass: 'bg-blue-600/10 text-blue-700 border-blue-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Kitesurf: {
    label: 'Kitesurf',
    icon: Wind,
    color: 'text-blue-400',
    gradient: 'from-blue-400/20 to-blue-400/5',
    badgeClass: 'bg-blue-400/10 text-blue-500 border-blue-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Windsurf: {
    label: 'Windsurf',
    icon: Wind,
    color: 'text-cyan-600',
    gradient: 'from-cyan-600/20 to-cyan-600/5',
    badgeClass: 'bg-cyan-600/10 text-cyan-700 border-cyan-200',
    isRun: false, isCycling: false, isSwim: false,
  },

  // --- Nieve ---
  AlpineSki: {
    label: 'Esquí alpino',
    icon: Snowflake,
    color: 'text-sky-300',
    gradient: 'from-sky-300/20 to-sky-300/5',
    badgeClass: 'bg-sky-300/10 text-sky-500 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  BackcountrySki: {
    label: 'Esquí de travesía',
    icon: Snowflake,
    color: 'text-sky-400',
    gradient: 'from-sky-400/20 to-sky-400/5',
    badgeClass: 'bg-sky-400/10 text-sky-500 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  NordicSki: {
    label: 'Esquí nórdico',
    icon: Snowflake,
    color: 'text-sky-500',
    gradient: 'from-sky-500/20 to-sky-500/5',
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Snowboard: {
    label: 'Snowboard',
    icon: Snowflake,
    color: 'text-indigo-300',
    gradient: 'from-indigo-300/20 to-indigo-300/5',
    badgeClass: 'bg-indigo-300/10 text-indigo-500 border-indigo-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Snowshoe: {
    label: 'Raquetas de nieve',
    icon: Snowflake,
    color: 'text-slate-400',
    gradient: 'from-slate-400/20 to-slate-400/5',
    badgeClass: 'bg-slate-400/10 text-slate-500 border-slate-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  IceSkate: {
    label: 'Patinaje sobre hielo',
    icon: Snowflake,
    color: 'text-blue-300',
    gradient: 'from-blue-300/20 to-blue-300/5',
    badgeClass: 'bg-blue-300/10 text-blue-400 border-blue-200',
    isRun: false, isCycling: false, isSwim: false,
  },

  // --- Fitness ---
  WeightTraining: {
    label: 'Gimnasio',
    icon: Dumbbell,
    color: 'text-rose-500',
    gradient: 'from-rose-500/20 to-rose-500/5',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Crossfit: {
    label: 'Crossfit',
    icon: Flame,
    color: 'text-red-500',
    gradient: 'from-red-500/20 to-red-500/5',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Workout: {
    label: 'Entrenamiento',
    icon: Dumbbell,
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-violet-500/5',
    badgeClass: 'bg-violet-500/10 text-violet-600 border-violet-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Elliptical: {
    label: 'Elíptica',
    icon: ActivityIcon,
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-pink-500/5',
    badgeClass: 'bg-pink-500/10 text-pink-600 border-pink-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  StairStepper: {
    label: 'Escaladora',
    icon: ActivityIcon,
    color: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/20 to-fuchsia-500/5',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Yoga: {
    label: 'Yoga',
    icon: ActivityIcon,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  InlineSkate: {
    label: 'Patinaje',
    icon: Zap,
    color: 'text-lime-500',
    gradient: 'from-lime-500/20 to-lime-500/5',
    badgeClass: 'bg-lime-500/10 text-lime-600 border-lime-200',
    isRun: false, isCycling: false, isSwim: false,
  },

  // --- Deportes de equipo / raqueta ---
  Soccer: {
    label: 'Fútbol',
    icon: ActivityIcon,
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-green-500/5',
    badgeClass: 'bg-green-500/10 text-green-600 border-green-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Tennis: {
    label: 'Tenis',
    icon: ActivityIcon,
    color: 'text-yellow-600',
    gradient: 'from-yellow-600/20 to-yellow-600/5',
    badgeClass: 'bg-yellow-600/10 text-yellow-700 border-yellow-200',
    isRun: false, isCycling: false, isSwim: false,
  },
  Golf: {
    label: 'Golf',
    icon: ActivityIcon,
    color: 'text-emerald-700',
    gradient: 'from-emerald-700/20 to-emerald-700/5',
    badgeClass: 'bg-emerald-700/10 text-emerald-800 border-emerald-300',
    isRun: false, isCycling: false, isSwim: false,
  },
}

const FALLBACK_CONFIG: TypeConfig = {
  label: 'Actividad',
  icon: ActivityIcon,
  color: 'text-muted-foreground',
  gradient: 'from-muted/40 to-muted/10',
  badgeClass: 'bg-muted text-muted-foreground border-border',
  isRun: false, isCycling: false, isSwim: false,
}

export function getTypeConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] ?? FALLBACK_CONFIG
}

export function formatDistance(meters: number): string {
  const km = meters / 1000
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatPace(meters: number, seconds: number): string {
  const secsPerKm = seconds / (meters / 1000)
  const m = Math.floor(secsPerKm / 60)
  const s = Math.round(secsPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

export function formatSwimPace(meters: number, seconds: number): string {
  const secsPer100m = (seconds / meters) * 100
  const m = Math.floor(secsPer100m / 60)
  const s = Math.round(secsPer100m % 60)
  return `${m}:${String(s).padStart(2, '0')} /100m`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `Hoy, ${timeStr}`
  if (diffDays === 1) return `Ayer, ${timeStr}`
  if (diffDays < 7) {
    const day = date.toLocaleDateString('es-ES', { weekday: 'short' })
    return `${day.charAt(0).toUpperCase() + day.slice(1)}, ${timeStr}`
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

