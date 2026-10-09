# Admin "Home" screen: a pure 3D showpiece

## What changes
- Rename the "Sales Dashboard" tab to **Home**. It stays the first screen when you open admin.
- Remove every number from it: no sales, globes, goal, money owed, estimates, totals, slider or "Full report" box. All numbers stay on Reports.
- Keep the time spiral as a calm, living art piece:
  - Spiral of glowing bars slowly spinning, gently rising and falling like a wave
  - Colors drift between your brand blue and gold
  - Soft floating sparks and a subtle MMAR glow in the center
  - Drag to spin, pinch to zoom; tapping does nothing in particular
- A small greeting overlay: "Good afternoon, Mike" with today's date. Nothing else.
- Fits a phone screen and a computer screen.

## Technical details
- Rewrite `TimeSpiral3D.tsx` as a decorative scene: drop data loading, realtime, orbs, slider, picked-day panel and HTML labels. Bar heights come from an animated sine wave instead of revenue. Add a small particle field using `Points`.
- `AdminDashboard.tsx`: tab label "Home", icon `Home`; `onOpenReports` prop removed.
- Camera distance chosen by screen width as now. Check screenshots on desktop and a 390px phone.
