# MR Room - Simple Mixed Reality Application

A simple Mixed Reality application built with **React**, **Vite**, and **Three.js** using the WebXR API. This project demonstrates basic AR functionality with object placement and interaction.

## Features

- ✅ **WebXR AR Support** - Immersive AR sessions using WebXR API
- ✅ **Hit Test** - Real-world surface detection for object placement
- ✅ **Object Placement** - Tap to place 3D objects (cubes, spheres, cylinders)
- ✅ **Object Interaction** - Click/tap to select and highlight objects
- ✅ **State Management** - Zustand for XR session state
- ✅ **Fast Development** - Vite HMR support

## Tech Stack

- **React** - v18.3 with TypeScript
- **Vite** - v7.1 for fast builds
- **Three.js** - v0.170 for 3D rendering
- **Zustand** - v5.0 for state management
- **TypeScript** - v5.5 for type safety

## Project Structure

```
MRroom/
├── src/
│   ├── core/
│   │   ├── HitTestManager.ts      # Hit test & object placement
│   │   └── InteractionManager.ts  # Object interaction & selection
│   ├── stores/
│   │   └── xrStore.ts             # Zustand XR state store
│   ├── App.tsx                    # Main React component
│   ├── main.tsx                   # Application entry point
│   └── vite-env.d.ts              # Vite type definitions
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

## Getting Started

### Prerequisites

- **Node.js** >= 20.19.0
- **npm** or **yarn**
- **HTTPS** (automatically handled by `vite-plugin-mkcert`)
- **WebXR-compatible device** (Meta Quest, ARCore devices, etc.)

### Installation

```bash
# Navigate to project directory
cd MRroom

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `https://localhost:8081`

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## How to Use

1. **Open the app** on a WebXR-compatible device (Meta Quest, ARCore phone, etc.)
2. **Click "Enter AR"** to start the AR session
3. **Point your device** at a surface (floor, wall, table)
4. **Wait for the green reticle** (ring) to appear on the detected surface
5. **Tap the screen** or **press the trigger** to place an object
6. **Tap objects** to select/deselect them (they will highlight)

### Object Types

Objects are placed in rotation:
1. **Red Cube** (first tap)
2. **Green Sphere** (second tap)
3. **Blue Cylinder** (third tap)
4. Repeats...

## Development

### State Management with Zustand

The `xrStore.ts` handles all XR-related state:

```typescript
import { useXRStore } from "./stores/xrStore";

// In React components
const { renderer, scene, camera, reticleVisible } = useXRStore();

// Access from managers
useXRStore.getState().setReticleVisible(true);
```

### Core Managers

#### HitTestManager

Handles WebXR hit testing and object placement:

```typescript
const hitTestManager = new HitTestManager(renderer, scene);
hitTestManager.onSessionStart(session); // Initialize on XR session start
hitTestManager.update(frame); // Update each frame
```

#### InteractionManager

Manages object selection and highlighting:

```typescript
const interactionManager = new InteractionManager(renderer, scene, camera);
interactionManager.update(); // Update each frame
```

### WebXR Session Flow

1. User clicks "Enter AR" button
2. Request `immersive-ar` session with `hit-test` feature
3. Initialize hit test source when session starts
4. Each frame:
   - Perform hit test
   - Update reticle position
   - Check for user input (select event)
   - Place objects on tap
   - Handle object interactions

## Configuration

### WebXR Features

Configured in `App.tsx`:

```typescript
const session = await navigator.xr.requestSession("immersive-ar", {
  requiredFeatures: ["hit-test"],
  optionalFeatures: ["dom-overlay"],
});
```

### Camera Settings

```typescript
const camera = new THREE.PerspectiveCamera(
  75,                                    // FOV
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1,                                   // Near plane
  1000                                   // Far plane
);
camera.position.set(0, 1.6, 3); // Initial position
```

## Troubleshooting

### AR Session Not Starting

- Ensure you're using **HTTPS** (handled automatically by mkcert)
- Check browser console for WebXR API errors
- Verify your device supports WebXR (check `navigator.xr`)
- Try reloading the page

### Hit Test Not Working

- Make sure you're pointing at a detectable surface
- Some surfaces (reflective, transparent) may not be detected
- Try pointing at the floor or a solid wall
- Check console for hit test errors

### Reticle Not Appearing

- Ensure the XR session is active
- Check that hit-test feature was granted
- Point at different surfaces
- Check console for errors

## Browser Support

- **Meta Quest 2/3/Pro** - Full support via Meta Browser
- **ARCore devices** - Full support via Chrome
- **ARKit devices (iOS)** - WebXR Viewer app required
- **Desktop** - No AR support (will show "Enter AR" button but won't work)

## Performance Tips

- Limit the number of placed objects (each object adds to render time)
- Use simple geometries for better performance
- Optimize materials (avoid complex shaders)
- Keep polygon count low

## License

MIT

## Contributing

Contributions are welcome! Please follow the existing code structure and TypeScript conventions.

## Resources

- [WebXR API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Three.js Documentation](https://threejs.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Meta Quest Development](https://developer.oculus.com/)

---

Built with Three.js and React
