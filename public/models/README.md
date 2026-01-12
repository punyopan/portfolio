# 3D Models Directory

Place your `.glb` or `.gltf` 3D model files here.

## How to Use

1. **Export your model** as `.glb` (recommended) or `.gltf` from Blender/other software
2. **Drop the file** into this folder (`public/models/`)
3. **Update** `src/components/CustomModel.jsx`:
   ```js
   const MODEL_PATH = "/models/your-model.glb";
   ```
4. **Import** in `Experience.jsx` and add to the carousel

## Optimization Tips

- Keep file size under 5MB for fast loading
- Use Draco compression for smaller files
- Reduce polygon count if possible (< 50k polys ideal)
- Use compressed textures (WebP/KTX2)

## Online Tools

- Convert formats: https://gltf.pmnd.rs/
- Optimize models: https://gltf-transform.dev/
- View/test models: https://gltf-viewer.donmccurdy.com/
