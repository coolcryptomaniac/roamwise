# Kala 3D: third-party components
- **three.js r180** (MIT): `three/`, with the `examples/jsm` add-ons it imports. See THREE-LICENSE.txt.
- **TalkingHead 1.7** by Mika Suominen (MIT): `talkinghead/` (talkinghead.mjs, dynamicbones.mjs, retargeter.mjs, lipsync-en.mjs). See TALKINGHEAD-LICENSE.txt.
- **Avatar** `assets/kala3d/kala.glb`: the "mpfb.glb" example avatar from the TalkingHead repository, made with Blender + the MPFB (MakeHuman) extension and released under **CC0**. We only resized its textures to 1024px (WebP) and applied Meshopt compression with gltf-transform; geometry, skeleton and morph targets are unchanged.
- Kala is an original illustrated/3D virtual guide. It is not a likeness of any real person.
- Clothing: the avatar ships with one casual outfit (t-shirt and jeans). Kala's page flattens its print to grey shading and tints it to match each painting. Sarees and gowns would need separate clothing meshes (for example CC0 MakeHuman / MPFB assets) added in Blender.

## Avatar (updated Oct 2026)
`assets/kala3d/kala.glb` is now a MetaPerson avatar created by the site owner at metaperson.avatarsdk.com (Avatar SDK) from its stock library (original character, not a real person's likeness). It was converted from FBX to GLB, bone names de-duplicated, Oculus viseme shapes renamed `viseme_*`, sunglasses removed, and compressed (meshopt, webp). Its use is governed by the Avatar SDK terms for the owner's plan: confirm commercial-use rights before wide launch. The previous CC0 MakeHuman avatar was replaced.
