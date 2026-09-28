# Ambassador button

Art for Sticker Mule's 1.5" round button, 2" square at 600 dpi.

- **Send this:** `ambassador-button-1.5in-CMYK.pdf`. It's CMYK, separated for GRACoL 2013 (the US coated-press standard) with the profile embedded, at 600 dpi. `ambassador-button-1.5in-CMYK.tif` is the same art as a TIFF.
- `ambassador-button-1.5in.png` is the RGB original, for screens.
- `ambassador-button-1.5in-print-preview.png` shows roughly how the CMYK file should print. The glows are a little softer than on screen, and the background is as dark as the paper allows.

## The art

- The orb mark (`brandkit/assets/orb-mark.png`) sits on ink with the orb centred on the button; the swoosh doesn't count toward the centring. THE UPSKILLING LABS runs across the top and AMBASSADOR across the bottom, all in white Geologica capitals with wide letter-spacing.
- Geometry comes from Sticker Mule's 1.5" template. The button face is 1.5" across and the cut line is 1.83". Art between the two wraps around the rolled edge.
- The layout is the 1.25" design scaled up by 1.2. The mark fits inside 13.4 mm of centre, and the lettering (about 8.8 pt, 2.2 mm caps) sits on the flat of the face, 14.7 to 16.9 mm off centre.
- The ink background carries the same fine grain as the mark, at the same average colour, so there's no seam where the two meet.

## The CMYK separation

- **Closest colour match.** Every colour in the art gets the CMYK build that prints nearest to it by CIEDE2000, the standard measure of how different two colours look.
  - The search starts from the profile's own separation, then adjusts cyan, magenta and yellow one level at a time until nothing gets closer.
  - Black stays where the profile puts it, so the plates stay smooth and the art's grain doesn't turn into ink noise.
  - Colours are compared relative to the paper. The screen's white is matched by paper white, and the screen's near-black by the paper's deepest black.
- **Why GRACoL 2013.** Sticker Mule is a US printer and doesn't publish a profile. GRACoL 2013 is the usual US reference for coated print, and the file carries the profile so a colour-managed workflow reads it correctly.
- **How close it is.** On a GRACoL press the button averages 0.1 ΔE2000 from the RGB, well under what anyone can see.
  - Every colour CMYK can print, the ink background included, lands within about 0.1.
  - The previous FOGRA39 file averaged about 1.1, or 1.8 if printed as GRACoL.
  - If the printer reads this file as FOGRA39 instead, it still averages about 1.1.
- **Where it can't match.** The bright teal of the glows is outside what CMYK ink can print.
  - The glow's main teal (#01D6D4) stays about 6 ΔE2000 away. The few pure-cyan hot spots at its core (#00FFFF, 0.03% of the button) are about 13 away.
  - These print as the brightest teal CMYK can make: cyan and yellow only on bare paper, about C57–66 Y24–30. That teal is softer and a little darker than the screen.
  - The brightest glow red is about 3 off.
  - The printed black is also not as deep as a screen's.
- **Inks.**
  - The red prints at about M92 Y92.
  - The background is a cool rich black, about C93 M63 Y44 K91, under a 300% total-ink limit.
  - The lettering is paper white, with no ink.

## Rebuilding

From this folder, with Pillow, NumPy, img2pdf and LittleCMS 2 (`liblcms2`; `brew install little-cms2` on a Mac):

1. `python3 tools/button_art_text.py 1.5 .` draws the RGB art and a guides image. Add a role word and a file stem to make another role's button, for example `python3 tools/button_art_text.py 1.5 . "SUPPORTING MEMBER" supporting-member`.
   - It needs the brandkit's `orb-mark.png` and `Geologica-VariableFont.ttf`, whose paths are set at the top of `tools/button_art.py` and `tools/button_art_text.py`.
   - The script also knows the 1.25" template.
2. `python3 tools/build_cmyk.py ambassador-button-1.5in.png ambassador-button-1.5in [profile.icc]` writes the CMYK TIFF, the PDF and the print preview.
   - It takes about 20 seconds.
   - The default profile is GRACoL 2013, from https://www.color.org/registry/profiles/GRACoL2013_CRPC6.icc. Its path is set at the top of the script.
   - To separate for another press, pass that press's profile as the third argument.
   - `tools/lcms.py` is the small LittleCMS binding the script uses. It runs the colour maths in full precision, where Pillow's colour management only works in 8 bits.
