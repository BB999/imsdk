# MR Room - Immersive Web Application

A production-ready Mixed Reality application built with **IWSDK (Immersive Web SDK)**, **React**, **Vite**, and **Zustand** for state management. This project demonstrates best practices for building WebXR applications with Hot Module Replacement (HMR) support.

## Features

- ✅ **Hand Tracking** - Native hand tracking support for Quest devices
- ✅ **Hit Test** - AR surface detection for placing objects in real world
- ✅ **Physics Simulation** - Havok-powered physics engine
- ✅ **Grabbable Objects** - Interact with 3D objects using hands or controllers
- ✅ **Spatial UI** - UIKitML-based spatial user interface
- ✅ **State Management** - Zustand for reliable XR session state management
- ✅ **Hot Module Replacement** - Fast development with Vite HMR
- ✅ **Scene Understanding** - Environment mesh and surface detection
- ✅ **WebXR Emulation** - Test VR experiences in desktop browser using IWER

## Tech Stack

- **IWSDK Core** - Immersive Web SDK v0.1.0
- **React** - v18.3 with TypeScript
- **Vite** - v7.1 for blazing fast builds
- **Zustand** - v5.0 for state management
- **Three.js** (super-three) - v0.177 for 3D rendering
- **TypeScript** - v5.5 for type safety

## Project Structure

```
MRroom/
├── src/
│   ├── components/          # React components
│   ├── stores/
│   │   └── xrStore.ts      # Zustand XR state store
│   ├── systems/
│   │   ├── HitTestSystem.ts       # Hit testing implementation
│   │   ├── InteractionSystem.ts   # Object interaction system
│   │   └── PanelSystem.ts         # UI panel management
│   ├── App.tsx             # Main React component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── ui/
│   └── control-panel.uikitml      # Spatial UI definition
├── public/
│   ├── textures/           # Texture assets
│   ├── audio/              # Audio files
│   ├── models/             # 3D models
│   └── glxf/               # Generated GLXF files (auto-generated)
├── metaspatial/            # Meta Spatial SDK project files
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Getting Started

### Prerequisites

- **Node.js** >= 20.19.0
- **npm** or **yarn**
- **HTTPS** (automatically handled by `vite-plugin-mkcert`)

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

## Development

### Hot Module Replacement (HMR)

This project is optimized for HMR to maintain XR session state when possible:

- **UI changes** - Instant updates without XR session restart
- **Logic changes** - Fast refresh for event handlers
- **State management** - Zustand preserves state across HMR
- **Core changes** - XR session will restart (unavoidable with WebXR API)

### State Management with Zustand

The `xrStore.ts` handles all XR-related state:

```typescript
import { useXRStore } from "./stores/xrStore";

// In React components
const { world, xrState, enterXR, exitXR } = useXRStore();

// In IWSDK systems
useXRStore.getState().selectObject(id);
```

### Adding New Systems

1. Create a new system file in `src/systems/`
2. Define components and queries using IWSDK ECS API
3. Register the system in `App.tsx`:

```typescript
newWorld
  .registerSystem(PanelSystem)
  .registerSystem(HitTestSystem)
  .registerSystem(YourNewSystem);  // Add here
```

### Working with Hit Test

The `HitTestSystem` provides real-time surface detection:

```typescript
// Access hit test results from store
const { hitTestResults, reticleVisible } = useXRStore();

// Get last hit position in a system
const hitTestSystem = world.getSystem(HitTestSystem);
const position = hitTestSystem.getLastHitPosition();
```

### Creating Interactive Objects

Use the `Interactive` component to make objects interactable:

```typescript
import { Interactive } from "./systems/InteractionSystem";

// Add to an entity
Interactive.add(entity, {
  id: "my-object",
  highlightColor: 0x00ff00,
});
```

## Configuration

### Vite Plugins

- **injectIWER** - WebXR emulation for desktop browsers
- **discoverComponents** - Auto-discover IWSDK components
- **generateGLXF** - Compile Meta Spatial files
- **compileUIKit** - Build UIKitML files
- **optimizeGLTF** - Optimize 3D models
- **react** - React Fast Refresh

### XR Features

Configured in `App.tsx`:

```typescript
xr: {
  sessionMode: SessionMode.ImmersiveVR,
  features: {
    handTracking: { required: true },
    layers: { required: true },
    'hit-test': { required: false, optional: true },
  },
},
features: {
  locomotion: { useWorker: true },
  grabbing: true,
  physics: true,
  sceneUnderstanding: true,
}
```

## Troubleshooting

### XR Session Not Starting

- Ensure you're using HTTPS (handled automatically by mkcert)
- Check browser console for WebXR API errors
- Verify hand tracking is supported on your device

### HMR Not Working

- Check that `import.meta.hot` is available
- Ensure you're in development mode (`npm run dev`)
- Try restarting the dev server

### Hit Test Not Detecting Surfaces

- Verify `sceneUnderstanding: true` is enabled
- Check that `'hit-test'` feature is requested
- Ensure you're in an XR session (not browser mode)

## Browser Support

- **Meta Quest 2/3/Pro** - Full support
- **Desktop (with IWER)** - Emulation mode for development
- **Other WebXR devices** - Should work but untested

## Performance Tips

- Use `useWorker: true` for locomotion
- Optimize GLTF models using the built-in plugin
- Limit polygon count for grabbable objects
- Use LOD (Level of Detail) for complex scenes

## License

MIT

## Contributing

Contributions are welcome! Please follow the existing code structure and TypeScript conventions.

## Resources

- [IWSDK Documentation](https://immersive-web.github.io/webxr/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [WebXR API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Meta Quest Development](https://developer.oculus.com/)

---

Built with ❤️ using IWSDK and React
