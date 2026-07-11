Replace the hero background photo with an interactive 3D scene of stylized car engine/vehicle parts using the brand palette (sky blue and gold on a dark background).

### What will be built
- **3D hero scene component** (`src/components/HeroEngineScene.tsx`) using React Three Fiber.
- **Scene content:** a stylized engine block made of primitive 3D shapes (cylinders, boxes, discs) with brand-colored accent parts — glowing sky-blue intake, gold alternator/belt accents, metallic dark body. Parts float gently and the whole assembly slowly rotates.
- **Interaction:** subtle mouse-driven rotation (OrbitControls with damping, no zoom) plus a fallback auto-rotation.
- **Hero integration:** update `src/components/Hero.tsx` to replace the `<img>` background with the 3D canvas, keeping the dark gradient overlay and headline text readable.
- **Fallback:** a CSS gradient background behind the canvas so the hero still looks good if WebGL fails or is disabled.
- **Performance:** canvas is lazy-loaded, pauses when not visible, and uses a lightweight material setup.

### Technical details
- Add `@react-three/fiber@^8.18` and `@react-three/drei@^9.122.0` (the React 18-compatible versions). `three` is pulled in as a peer dependency.
- Scene is rendered with `WebGLRenderer` and will work in any browser with WebGL support.
- No backend or database changes.
- Existing hero text, CTAs, SEO, and tracking stay unchanged.
- The old `hero-banner.jpg` will be replaced as the active hero background; the file may be removed or kept unused depending on asset references elsewhere.

### Verification
- Run TypeScript and production build checks.
- Verify the 3D scene renders behind the hero text on desktop and mobile viewports.
- Confirm the CTA buttons remain clickable and the gradient overlay keeps text legible.