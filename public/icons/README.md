# PWA Icons

This directory should contain the following icon files for PWA support:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a single high-resolution source image (recommended: 1024x1024px) using tools like:

1. **Online Tools:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/favicon-generator/

2. **Command Line (using ImageMagick):**
   ```bash
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   convert source-icon.png -resize 128x128 icon-128x128.png
   convert source-icon.png -resize 144x144 icon-144x144.png
   convert source-icon.png -resize 152x152 icon-152x152.png
   convert source-icon.png -resize 192x192 icon-192x192.png
   convert source-icon.png -resize 384x384 icon-384x384.png
   convert source-icon.png -resize 512x512 icon-512x512.png
   ```

3. **Using a placeholder for now:**
   For development, you can create simple colored squares with the Tawi Shop branding colors (red #dc2626).

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure icons are readable at small sizes
- Use high contrast colors
- Test icons on both light and dark backgrounds
- Follow platform-specific guidelines (iOS, Android)

