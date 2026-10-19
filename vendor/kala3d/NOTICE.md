# Kala 3D: third-party components
- **three.js r180** (MIT): `three/`, with the `examples/jsm` add-ons it imports. See THREE-LICENSE.txt.
- **TalkingHead 1.7** by Mika Suominen (MIT): `talkinghead/` (talkinghead.mjs, dynamicbones.mjs, retargeter.mjs, lipsync-en.mjs). See TALKINGHEAD-LICENSE.txt.
- **Avatar** `assets/kala3d/kala.glb`: the "mpfb.glb" example avatar from the TalkingHead repository, made with Blender + the MPFB (MakeHuman) extension and released under **CC0**. We only resized its textures to 1024px (WebP) and applied Meshopt compression with gltf-transform; geometry, skeleton and morph targets are unchanged.
- Kala is an original illustrated/3D virtual guide. It is not a likeness of any real person.
- Clothing: the avatar ships with one casual outfit (t-shirt and jeans). Kala's page flattens its print to grey shading and tints it to match each painting. Sarees and gowns would need separate clothing meshes (for example CC0 MakeHuman / MPFB assets) added in Blender.
