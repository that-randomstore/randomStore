# Product image guidelines

Use these rules so every category page looks the same on mobile and desktop.

## Export spec (recommended)

| Setting | Value |
|--------|--------|
| **Size** | **1080 × 1080 px** (square) |
| **Format** | **JPEG** (`.jpg`), quality ~80–85% |
| **Color** | sRGB |
| **Background** | Same for all products (white `#ffffff` or site gray `#eef3fa`) |
| **Subject** | Centered, ~85% of frame — leave even padding on all sides |
| **Naming** | `category_productname.jpg` (e.g. `bottles_insulated_yellow.jpg`) |

Avoid mixing wide photos (710×488), tall photos (800×864), and AVIF/PNG unless you convert them to square JPEGs first.

## Why pages looked different

- **Aspect ratios** varied, so `object-fit: cover` cropped each product differently.
- **Card text** length differed (e.g. color dropdown on bottles only), so card heights jumped on mobile.

The site CSS now uses **square frames + `object-fit: contain`** and **fixed min-heights** for title/description/option areas. Replacing assets with **1080×1080** JPEGs on a **consistent background** is still the best way to get a catalog-quality look.

## Quick check before upload

1. Square canvas (1:1)?  
2. Same background color as your other product shots?  
3. File under ~300 KB if possible (1080px JPEG)?  
4. Saved as `.jpg` (not `.avif` unless you standardize all images to AVIF)?

Update paths in `docs/products/*.html` and `docs/data/category-images.json` when you add new files.
