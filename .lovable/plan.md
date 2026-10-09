# Home screen: driver's-seat GT500 night street run

Replace the spiral on the admin Home screen with a self-driving, first-person scene. You sit in the driver's seat of a Shelby GT500 racing down endless night city streets.

## What you'll see
- **Cockpit:** a dark steering wheel with a Shelby-style center badge, dash with glowing gauges (speedo and tach needles that move), hood with twin racing stripes ahead of you, and A-pillars framing the view.
- **The street:** wet, reflective asphalt with lane lines rushing past. Buildings with lit windows, streetlights, neon signs in brand blue and gold, and the occasional car taillights you pass.
- **Motion:** gentle curves, the wheel turns with the road, slight camera sway, and streetlight glow sweeping across the cockpit. Speed builds and eases in a loop. It never ends because the city keeps regenerating ahead.
- **Greeting stays:** "Good afternoon, Mike" and today's date in the corner.
- No controls and no numbers. Works on phone and computer.

Sound is off (browsers block autoplay). I can add a tap-for-engine-sound button later if you want.

## Technical details
- Rewrite `TimeSpiral3D.tsx` into `StreetRun3D.tsx` (R3F). Camera is fixed inside the cockpit group, and the world scrolls toward the camera. Reusable building, light and traffic chunks are recycled once they pass behind (no growing memory).
- The cockpit, buildings and road are built from simple shapes with canvas-drawn textures for the windows, gauges and asphalt. No downloaded car model, so it can't fail to load. Single-pass light bloom via `@react-three/postprocessing` (pinned to the React 19 compatible version).
- Built for phones: instanced windows and lights, capped pixel ratio, under 100 draw calls.
- `AdminDashboard.tsx` lazy-loads `StreetRun3D` on the Home tab and `TimeSpiral3D.tsx` is removed. Check screenshots on desktop and a 390px phone.
