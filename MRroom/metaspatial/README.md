# Metaspatial Directory

This directory contains Meta Spatial SDK project files and 3D assets.

## Structure

- `components/` - Auto-generated component definitions (created by Vite plugin)
- Individual folders for each 3D object (e.g., `cube/`, `sphere/`)
- `Main.metaspatial` - Main composition file
- `config.json` - Configuration file

## Usage

1. Place your 3D models (GLTF/GLB) in separate folders
2. The Vite plugin will automatically discover components from your TypeScript files
3. Reference these components in your `.metaspatial` files
4. The `generateGLXF` plugin will compile everything to `/public/glxf/`

## Example Object Structure

```
metaspatial/
├── cube/
│   ├── cube.gltf
│   └── textures/
├── sphere/
│   ├── sphere.glb
│   └── materials/
└── Main.metaspatial
```

## Notes

- GLTF/GLB files will be automatically optimized by the `optimizeGLTF` plugin
- Component XML definitions are generated in `components/` directory
- The watcher is enabled, so changes are detected automatically
