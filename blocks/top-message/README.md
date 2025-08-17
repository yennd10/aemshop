# Top Message Block

## 📋 Mô tả

Block hiển thị nội dung HTML từ Google Doc `top-message`. Block này có thể hiển thị text, links, và các thẻ HTML khác từ Google Doc.

## 🚀 Cách sử dụng

### 1. Tạo Google Doc

Tạo file Google Doc tên `top-message` với nội dung HTML:

```html
<h1>Welcome to Our Website</h1>
<p>Discover amazing products and offers!</p>
<a href="/products">Shop Now</a>
<a href="/about">About Us</a>
<ul>
  <li><a href="/contact">Contact</a></li>
  <li><a href="/blog">Blog</a></li>
</ul>
```

### 2. Thêm metadata

Thêm vào file `head.html`:

```html
<meta name="top-message" content="/top-message" />
```

### 3. Sử dụng block

Thêm vào trang HTML:

```html
<div class="top-message block" data-block-name="top-message">
  <!-- Content will be loaded from Google Doc -->
</div>
```

## 🎨 Styling

Block sử dụng các class CSS:

- `.top-message` - Container chính
- `.top-message-content` - Container cho nội dung
- `.top-message h1` - Tiêu đề
- `.top-message p` - Đoạn văn
- `.top-message a` - Links

## 📱 Responsive

Block có responsive design cho mobile và desktop.

## 🔧 Tính năng

- ✅ Load nội dung từ Google Doc
- ✅ Preserve HTML structure
- ✅ Loại bỏ class `button` từ links
- ✅ Error handling
- ✅ Fallback content
