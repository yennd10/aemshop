# PARALLAX EFFECT - 3 GIAI ĐOẠN FADE IN/OUT

## Mục tiêu
Tạo hiệu ứng parallax với fade in/out 3 giai đoạn trong container scroll riêng biệt (600px)

## Cấu trúc HTML
```html
<section class="hero" id="scene">
  <div class="wrap-layer">
    <div class="layer" data-speed="0.65">
      <img src="..." alt="">
    </div>
    <div class="layer" data-speed="0.35">
      <img src="..." alt="">
    </div>
    <div class="layer" data-speed="0.15">
      <img src="..." alt="">
    </div>
  </div>
</section>
```

## CSS chính

### 1. Container scroll
```css
.wrap-layer {
  position: relative;
  height: 600px;                    /* Chiều cao cố định */
  overflow-y: auto;                 /* Tạo scroll riêng */
  scrollbar-width: none;            /* Ẩn scrollbar Firefox */
  -ms-overflow-style: none;         /* Ẩn scrollbar IE/Edge */
}

.wrap-layer::-webkit-scrollbar {
  display: none;                    /* Ẩn scrollbar Chrome/Safari */
}
```

### 2. Layer styling
```css
.layer {
  position: absolute;
  inset: 0;                         /* Phủ toàn bộ container */
  will-change: transform, opacity;  /* Tối ưu GPU */
  transition: opacity 0.3s ease-out; /* Smooth fade */
  height: 900px;                    /* Tạo nội dung scrollable */
}
```

## JavaScript Logic

### 1. Scroll event handling
```javascript
// Lắng nghe scroll trong wrap-layer thay vì window
const wrapLayer = document.querySelector('.wrap-layer');
wrapLayer.addEventListener('scroll', onScroll, { passive: true });
```

### 2. Progress calculation
```javascript
function update() {
  const wrapLayer = document.querySelector('.wrap-layer');
  const scrollTop = wrapLayer.scrollTop;
  const scrollHeight = wrapLayer.scrollHeight - wrapLayer.clientHeight;
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  
  // Xử lý các layer...
}
```

### 3. 3 Giai đoạn fade in/out

#### Giai đoạn 1: progress = 0 → 0.33 (0-200px)
- **Layer 1**: opacity = 1 → 0 (ẩn dần)
- **Layer 2**: opacity = 0 → 1 (hiện dần)  
- **Layer 3**: opacity = 0 (ẩn hoàn toàn)

#### Giai đoạn 2: progress = 0.33 → 0.66 (200-400px)
- **Layer 1**: opacity = 0 (ẩn hoàn toàn)
- **Layer 2**: opacity = 1 (hiện hoàn toàn)
- **Layer 3**: opacity = 0 (ẩn hoàn toàn)

#### Giai đoạn 3: progress = 0.66 → 1 (400-600px)
- **Layer 1**: opacity = 0 (ẩn hoàn toàn)
- **Layer 2**: opacity = 1 → 0 (ẩn dần)
- **Layer 3**: opacity = 0 → 1 (hiện dần)

### 4. Opacity calculation
```javascript
layers.forEach((layer, index) => {
  if (index === 0) {
    // Layer 1 - ẩn dần trong giai đoạn 1
    if (progress <= 0.33) {
      layer.style.opacity = 1 - (progress * 3); // 1 -> 0
    } else {
      layer.style.opacity = 0;
    }
  } else if (index === 1) {
    // Layer 2 - hiện dần giai đoạn 1, hiện rõ giai đoạn 2, ẩn dần giai đoạn 3
    if (progress <= 0.33) {
      layer.style.opacity = progress * 3; // 0 -> 1
    } else if (progress <= 0.66) {
      layer.style.opacity = 1;
    } else {
      layer.style.opacity = 1 - ((progress - 0.66) * 3); // 1 -> 0
    }
  } else {
    // Layer 3 - hiện dần trong giai đoạn 3
    if (progress <= 0.66) {
      layer.style.opacity = 0;
    } else {
      layer.style.opacity = (progress - 0.66) * 3; // 0 -> 1
    }
  }
});
```

### 5. Parallax transform
```javascript
// Mỗi layer có chuyển động khác nhau
if (index === 0) {
  // Background - di chuyển lên trên, chậm nhất
  const translateY = progress * -30 * speed;
  layer.style.transform = `translateY(${translateY}px)`;
} else if (index === 1) {
  // Middle - di chuyển xuống + sang phải
  const translateY = progress * 20 * speed;
  const translateX = progress * 15 * speed;
  layer.style.transform = `translateY(${translateY}px) translateX(${translateX}px)`;
} else {
  // Foreground - di chuyển xuống + sang trái, nhanh nhất
  const translateY = progress * 40 * speed;
  const translateX = progress * -10 * speed;
  layer.style.transform = `translateY(${translateY}px) translateX(${translateX}px)`;
}
```

## Các bước thực hiện

1. **Tạo cấu trúc HTML** với `.wrap-layer` chứa 3 layer
2. **CSS cho scroll container** (600px height, ẩn scrollbar)
3. **CSS cho layers** (absolute positioning, height 900px)
4. **JavaScript scroll handling** trong `.wrap-layer`
5. **Logic 3 giai đoạn** fade in/out
6. **Parallax transform** cho từng layer
7. **Tối ưu performance** với `will-change` và `requestAnimationFrame`

## Kết quả
- Scroll riêng trong 600px container
- 3 giai đoạn fade in/out rõ ràng
- Hiệu ứng parallax mượt mà
- Giao diện sạch sẽ, chuyên nghiệp
- Chỉ hoàn thành 3 giai đoạn mới scroll được section tiếp theo

## Lưu ý
- Mỗi giai đoạn chiếm đúng 1/3 scroll distance
- Progress tính theo scroll position trong `.wrap-layer`
- Transform tạo độ sâu 3D với hướng di chuyển khác nhau
- Transition 0.3s cho smooth fade effect
