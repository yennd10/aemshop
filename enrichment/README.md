# Enrichment System

The enrichment system allows you to add dynamic content to your pages based on various criteria such as product SKU, category, or position.

## How it works

1. **Enrichment Block**: The `enrichment.js` block is placed on pages where you want enrichment content to appear
2. **Enrichment Fragments**: HTML files in the `enrichment/` directory that contain the actual content
3. **Metadata**: Each enrichment fragment has metadata in its `<head>` section that defines when and where it should appear

## Configuration

The enrichment block supports the following configuration options:

- `type`: Either "product" or "category"
- `position`: Optional position identifier (e.g., "top", "bottom")

## Fragment Metadata

Each enrichment fragment should include these meta tags:

```html
<meta name="enrichment-products" content="SKU123,SKU456">
<meta name="enrichment-categories" content="electronics,computers">
<meta name="enrichment-positions" content="top,bottom">
```

## Example Usage

### Product Page Enrichment
```html
<div class="block enrichment" data-type="product" data-position="top">
  <!-- Enrichment content will be loaded here -->
</div>
```

### Category Page Enrichment
```html
<div class="block enrichment" data-type="category" data-position="bottom">
  <!-- Enrichment content will be loaded here -->
</div>
```

## File Structure

```
enrichment/
├── enrichment.json          # Index file (auto-generated)
├── example-enrichment.html  # Example fragment
└── README.md               # This file
```

## Troubleshooting

- If you see a 404 error, make sure the `enrichment.json` file exists
- If no content appears, check that your fragment metadata matches the block configuration
- Check the browser console for any JavaScript errors
