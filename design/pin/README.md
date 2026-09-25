# Ambassador pin

Earned by ambassadors who apply, are accepted, and finish onboarding.

`pin-front.svg` is starter production art traced from the orb mark (`brandkit/assets/orb-mark.png`) by `build_pin.py`. It is 1:1 in millimetres, and every colour is a filled shape with raised metal between the colours. Send the factory this file (or a refined version of it). Use Blender for mockups only.

![Front](pin-front.svg)

## The spec

| | Choice | Why |
| --- | --- | --- |
| Type | **Hard enamel** | Flat, polished, and scratch-resistant, so it reads as earned. Soft enamel is cheaper but looks like merch. |
| Size | **1.25 in (31.75 mm)** wide, die-cut to the mark (31.75 × 30.5 mm) | The swoosh breaks out of the orb at both ends, like the NASA meatball it pays homage to, so the outline follows it. At 1 in, the swoosh tail gets too thin. |
| Metal | **Polished nickel** (silver) | Bright lines outline the orb against ink. Polished gold works the same way. Black nickel is quieter and closest to the mark on ink. Dyed black and antique finishes are soft enamel only. |
| Colours | **4**: ink, teal, bright teal (swoosh), red | Recommended range is 8 or fewer, and fewer holds up better. The orb's gradients become flat fields, because enamel can't do gradients. |
| Lines | 0.4 mm metal between colours, 0.6 mm rim | Factory minimum is 0.2 to 0.3 mm. 0.4 mm survives polishing. |
| Smallest enamel cell | 0.3 mm | Smaller cells can't be filled, so the build script drops them. |
| Back | **2 posts** + locking clutches | A round pin with an arrow has an orientation. Single posts spin, and rubber clutches loosen. |
| Backstamp | THE UPSKILLING LABS · AMBASSADOR · year | Keeps text off the front, where 5 pt is the floor. The year makes each cohort's pin distinct. Costs about $50 once. |
| Card | Backing card: "Earned, not given." [PLACEHOLDER] | The card makes it a moment and not a freebie. |

Pantone codes in the SVG (`data-pantone`) are nearest matches from the brand kit: Black 6 C, 320 C, 3125 C, and 485 C. Confirm them against a physical **Solid Coated** guide, not a screen. Enamel reds usually come out darker than the chip.

## Moving the orb onto the pin

- **Gradients become flat fields.** The mark is teal above, fading to ink through the middle, and red below. Each field is cut where its colour falls to 30% of full, which leaves a teal cap, an ink band carrying the swoosh, and a red lobe. The swoosh uses the bright end of its own gradient, so it stays brighter than the teal cap as it does in the mark.
- **Sharp tips become metal.** Enamel can't fill a point, so the swoosh's tips end in raised metal.
- **The swoosh breaks out of the orb.** The tip clears the orb at the upper right and the tail at the left, so the metal outline follows the mark's silhouette.
- If you want the gradient back, print it: a UV- or offset-printed metal pin reproduces the mark as is, with the plating showing as a rim. A translucent enamel over textured metal gives a glow but not a teal-to-red blend.

## Blender (mockups only)

The factory redraws from vector art, never from a render. Your render is for approval, the site, and the backing card.

1. **Scene:** Properties → Scene → Units: Metric, Unit Scale 0.001, Length Millimeters.
2. **Import:** File → Import → SVG, then load `pin-front.svg`. Blender imports paths as curves and ignores fills, strokes, and gradients. That's why every colour here is a closed filled path: nothing has to be outlined first. Check the scale against the 31.75 mm width, then apply scale (Ctrl A).
3. **Metal body:** extrude the `metal` outline 0.6 mm (Curve → Geometry → Extrude). Pins are about 1.2 to 1.5 mm thick overall. Add bevel depth 0.05 mm with resolution 4 so polished edges catch the light.
4. **Enamel:** extrude each `enamel-*` curve to sit **flush** with the metal top, which is what makes it hard enamel. For a soft-enamel comparison, set them 0.2 mm lower.
5. **Materials (Principled BSDF):**
   - **Metal:** Metallic 1, Roughness 0.12, base #C9CED2.
   - **Enamel:** Metallic 0, Roughness 0.05, Coat 1. Use the hex values from the SVG.
6. **Lighting:** an HDRI studio environment plus one large soft area light. Use a Filmic or AgX view transform, so the red doesn't clip.
7. **Posts:** two 1 mm cylinders about 8 mm long, 8 to 10 mm from centre on the horizontal axis. The backstamp is text converted to a curve (Alt C), extruded 0.1 mm into the back.

## Ordering

- Ask for a **digital proof with Pantone codes**. For the first order, also ask for a **physical pre-production sample**.
- Typical order: 50 to 100 minimum, 7 to 10 business days of production after the proof, and 3 to 5 weeks door to door.
- Order the next cohort's pins when you confirm that cohort.

## Changing the art

Edit the constants at the top of `build_pin.py` (size, line width, colours) and run:

```sh
pip install shapely && python3 design/pin/build_pin.py
```

Sources: [Wizard Pins guide](https://wizardpins.com/pages/enamel-pin-guide) · [CreatePins: why a pin can't be made](https://createpins.com/blog/why-cant-my-enamel-pin-be-made/) · [CreatePins size guide](https://createpins.com/blog/enamel-pin-design-size-guide/) · [Vograce size chart](https://vograce.com/blogs/news/pin-size-chart-guide) · [Hard vs soft (Stadri)](https://www.stadriemblems.com/blog/soft-enamel-pins-vs-hard-enamel-pins/) · [Gradients (EnamelPinCustom)](https://www.enamelpincustom.com/can-enamel-pins-have-gradient-colors/) · [Pin backs (PinPros)](https://www.pinprosplus.com/post/enamel-pins-5-tips-to-keep-them-from-falling-off) · [Blender SVG import](https://docs.blender.org/manual/en/latest/files/import_export/svg_curve.html) · [Pantone and proofs (CreatePins)](https://createpins.com/blog/enamel-pin-colors-guide/)
