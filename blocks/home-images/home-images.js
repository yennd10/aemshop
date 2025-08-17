export default function init(el) {
  // Get scrollable container and paragraphs (layers) 
  // .default-content-wrapper is outside the block, need to find from parent
  const parentContainer = el.closest('.home-images-container');
  const scrollContainer = parentContainer ? parentContainer.querySelector('.default-content-wrapper') : null;
  const paragraphs = parentContainer ? parentContainer.querySelectorAll('.default-content-wrapper > p') : [];
  
  if (!scrollContainer || paragraphs.length === 0) {
    return;
  }

  // Set initial state for each layer
  paragraphs.forEach((p, index) => {
    if (index === 0) {
      // Layer 1: fully visible
      p.style.opacity = '1';
    } else {
      // Layer 2, 3: completely hidden
      p.style.opacity = '0';
    }
  });

  let ticking = false;

  // Handle scroll with parallax transform and 3-stage fade
  function update() {
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

    // Handle parallax transform and 3-stage fade in/out
    paragraphs.forEach((p, index) => {
      // PARALLAX TRANSFORM - only use translateY
      if (index === 0) {
        // Layer 1 (background) - slowest movement
        const translateY = progress * -25; // Move up
        p.style.transform = `translateY(${translateY}px)`;
      } else if (index === 1) {
        // Layer 2 (middle) - medium movement
        const translateY = progress * 15; // Move down
        p.style.transform = `translateY(${translateY}px)`;
      } else {
        // Layer 3 (foreground) - fastest movement
        const translateY = progress * 30; // Move down
        p.style.transform = `translateY(${translateY}px)`;
      }
      
      // 3 STAGES FADE IN/OUT:
      if (index === 0) {
        // Layer 1: Stage 1 - fade out from 1 → 0 (progress 0 → 0.33)
        if (progress <= 0.33) {
          const opacity = 1 - (progress * 3); // 1 → 0
          p.style.opacity = Math.max(0, opacity);
        } else {
          p.style.opacity = 0; // completely hidden
        }
      } else if (index === 1) {
        // Layer 2: Stage 1 & 2 & 3
        if (progress <= 0.33) {
          // Stage 1: fade in from 0 → 1 (progress 0 → 0.33)
          const opacity = progress * 3; // 0 → 1
          p.style.opacity = Math.min(1, opacity);
        } else if (progress <= 0.66) {
          // Stage 2: keep opacity = 1 (progress 0.33 → 0.66)
          p.style.opacity = 1;
        } else {
          // Stage 3: fade out from 1 → 0 (progress 0.66 → 1)
          const opacity = 1 - ((progress - 0.66) * 3); // 1 → 0
          p.style.opacity = Math.max(0, opacity);
        }
      } else if (index === 2) {
        // Layer 3: Stage 3 - fade in from 0 → 1 (progress 0.66 → 1)
        if (progress <= 0.66) {
          p.style.opacity = 0; // completely hidden
        } else {
          const opacity = (progress - 0.66) * 3; // 0 → 1
          p.style.opacity = Math.min(1, opacity);
        }
      }
    });
    
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  // Add scroll event listener to scrollable container
  scrollContainer.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  
  // Call initial update to set initial state
  update();

  // Cleanup function
  return function cleanup() {
    scrollContainer.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
