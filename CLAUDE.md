@AGENTS.md

# CLAUDE.md - Developer Guide & Project Context

## Project Overview
An interactive 3D Web Portfolio ("The Cosmic Voyager") for Monthol Sukjinda (Champ), a Full-Stack Developer. The site features a seamless, single-page transition utilizing a Next.js App Router wrapper around a persistent React Three Fiber (R3F) Canvas.

## Core Commands
- **Development Server:** `npm run dev` (Runs with Next.js Turbopack)
- **Production Build:** `npm run build`
- **Linting:** `npm run lint`

## Architecture & Layering Rules
The project enforces a strict 3-Layer separation stack to maintain WebGL performance and HTML usability:
1. **Layer 1 (3D WebGL Background):** Persistent R3F Canvas (`SceneCanvas.tsx`). Handled once inside global `layout.tsx`.
2. **Layer 2 (Next.js Page Content):** Interactive 2D page children. **MUST** have CSS class `pointer-events-none` container to allow users to click through into the 3D WebGL scene.
3. **Layer 3 (UI HUD & Modals):** Floating global interface elements (`RadarHud.tsx`, `DataSlate.tsx`) with `pointer-events-auto` to capture navigation inputs.

## Technical Stack & Constraints
- **Framework:** Next.js 16.x (App Router + Turbopack)
- **Styling:** Tailwind CSS v4 (Uses inline CSS-first config via `@theme inline` inside `globals.css`)
- **3D Engine:** `@react-three/fiber` & `@react-three/drei`
- **Animation:** GSAP (For 3D Camera coordinates interpolation) & Framer Motion (For 2D HTML animations)
- **State Management:** Zustand (`src/lib/store/useAppStore.ts`)
- **Icons:** Lucide React (System UI) & `@iconify/react` (Brand & Social integrations)

---

## 🚫 Crucial Caveats & Anti-Patterns (DO NOT REVERT)

### 1. Turbopack Asset Hydration Issue
- **Problem:** Drei's `useTexture` hook causes a fatal server-side/hydration crash (`undefined` error) when parsed under Next.js Turbopack compiler.
- **Rule:** **NEVER** use `useTexture`. Always load images natively using `THREE.TextureLoader` inside a standard client-side `useEffect` hook.

### 2. Tailind Utility Classes on 3D Components
- **Problem:** Adding `className` or Tailwind interactive utilities (like `cursor-pointer`) directly onto R3F components (like `<mesh>`) breaks TypeScript compilation.
- **Rule:** Use Drei's `useCursor(hovered)` hook inside the component logic to manipulate pointer states dynamically.

### 3. Glass & Transparent Mesh Artifacts
- **Problem:** Dynamic rendering of overlay text nodes alongside transparent materials causes WebGL depth-sorting conflicts, leading to meshes unexpectedly disappearing on hover.
- **Rule:** Ensure `depthWrite={true}` is explicitly declared on text blocks and any basic/transmission materials layer dealing with overlaps.

### 4. Layout Level Server Component Restrictions
- **Problem:** Passing `{ ssr: false }` to `next/dynamic` directly inside a root server layout file throws compilation violations in Next.js 15/16.
- **Rule:** Move layout structural dependencies down to dynamic Client-Side wrappers, keeping `layout.tsx` a clean server skeleton.

---

## Code Style & Patterns
- **TypeScript:** Enforce explicit typing for Props, Vectors, and States. Avoid `any`.
- **3D Vector Mathematics:** Cache vector references locally via `useRef` or static configurations to protect garbage collection inside `useFrame` rendering loops.
- **Routing:** Use URL-Based transitions via `usePathname()` to trigger GSAP Camera motions to ensure the app state matches current route parameters natively.
