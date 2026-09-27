# Ambassador button

Art for Sticker Mule's 1.25" round button, 1.75" square at 600 dpi.

- **Send this:** `ambassador-button-1.25in-CMYK.pdf` (CMYK, FOGRA39 coated, 600 dpi). `ambassador-button-1.25in-CMYK.tif` is the same art as a TIFF.
- `ambassador-button-1.25in.png` is the RGB original, for screens.
- `ambassador-button-1.25in-print-preview.png` shows roughly how the CMYK file should print: the glows are a little darker than on screen and the background is the paper's deepest black.

## The art

- The orb mark (`brandkit/assets/orb-mark.png`) sits on ink with the orb centred on the button; the swoosh doesn't count toward the centring. THE UPSKILLING LABS runs across the top and AMBASSADOR across the bottom, all in white Geologica capitals with wide letter-spacing.
- Geometry comes from Sticker Mule's 1.25" template. The button edge is 1.25" across and the cut line is 1.623". Art between the two wraps around the rolled edge. The text stays on the flat of the face, from 12.25 to 14.05 mm off centre.

## The CMYK separation

- The screen teal is far brighter than ink can print. A plain profile conversion keeps its lightness and prints it pale mint (about C57 Y26). This separation keeps the colour instead: it lets the teal darken slightly so it stays saturated (the brightest teal is about C71 M6 Y35 K9).
- The red is in gamut and prints close to the screen (about M93 Y95).
- The background is a cool rich black (about C90 M62 Y45 K93), under a 300% total-ink limit.
- The lettering is paper white, with no ink.
- `tools/build_cmyk.py` redoes the separation from the RGB original: run `python3 tools/build_cmyk.py 3 _k3` from this folder (it needs Pillow, NumPy and the FOGRA39 profile, whose path is set at the top). It writes `button_cmyk_k3.tif` and proof images.
