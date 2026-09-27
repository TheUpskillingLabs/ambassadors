# Ambassador button

Art for Sticker Mule's 1.5" round button, 2" square at 600 dpi.

- **Send this:** `ambassador-button-1.5in-CMYK.pdf` (CMYK, FOGRA39 coated, 600 dpi). `ambassador-button-1.5in-CMYK.tif` is the same art as a TIFF.
- `ambassador-button-1.5in.png` is the RGB original, for screens.
- `ambassador-button-1.5in-print-preview.png` shows roughly how the CMYK file should print: the glows are a little darker than on screen and the background is the paper's deepest black.

## The art

- The orb mark (`brandkit/assets/orb-mark.png`) sits on ink with the orb centred on the button; the swoosh doesn't count toward the centring. THE UPSKILLING LABS runs across the top and AMBASSADOR across the bottom, all in white Geologica capitals with wide letter-spacing.
- Geometry comes from Sticker Mule's 1.5" template. The button face is 1.5" across and the cut line is 1.83". Art between the two wraps around the rolled edge.
- The layout is the 1.25" design scaled up by 1.2. The mark fits inside 13.4 mm of centre, and the lettering (about 8.8 pt, 2.2 mm caps) sits on the flat of the face, 14.7 to 16.9 mm off centre.

## The CMYK separation

- The screen teal is far brighter than ink can print. A plain profile conversion keeps its lightness and prints it pale mint. This separation keeps the colour instead: it lets the teal darken slightly so it stays saturated (the brightest teal is about C73 M6 Y36 K10).
- The red is in gamut and prints close to the screen (about M93 Y95).
- The background is a cool rich black (about C90 M62 Y45 K93), under a 300% total-ink limit.
- The lettering is paper white, with no ink.

## Rebuilding

From this folder, with Pillow, NumPy and img2pdf:

1. `python3 tools/button_art_text.py 1.5 .` draws the RGB art and a guides image. It needs the brandkit's `orb-mark.png` and `Geologica-VariableFont.ttf`, whose paths are set at the top of `tools/button_art.py` and `tools/button_art_text.py`. The script also knows the 1.25" template.
2. `python3 tools/build_cmyk.py ambassador-button-1.5in.png ambassador-button-1.5in` writes the CMYK TIFF, the PDF and the print preview. It needs the FOGRA39 profile, whose path is set at the top.
