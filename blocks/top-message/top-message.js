/**
 * Top Message Block
 * Hiển thị nội dung HTML từ Google Doc top-message
 */

import { getMetadata } from "../../scripts/aem.js";
import { loadFragment } from "../fragment/fragment.js";

/**
 * Tạo và hiển thị top message block
 * @param {Element} block - Element block cần decorate
 */
export default async function decorate(block) {
  // Xóa nội dung cũ và thêm class
  block.textContent = "";
  block.classList.add("top-message");

  // Tạo container cho nội dung
  const contentContainer = document.createElement("div");
  contentContainer.className = "top-message-content";

  // Lấy metadata từ Google Doc top-message
  const topMessageMeta = getMetadata("top-message");

  if (!topMessageMeta) {
    contentContainer.innerHTML = "";
    block.appendChild(contentContainer);
    return;
  }

  try {
    // Tạo đường dẫn đến Google Doc
    const topMessagePath = new URL(topMessageMeta, window.location).pathname;
    console.log("Đang tải top message từ:", topMessagePath);

    // Load fragment từ Google Doc
    const fragment = await loadFragment(topMessagePath);

    if (!fragment) {
      contentContainer.innerHTML = "";
      console.log("⚠️ Không tìm thấy fragment từ Google Doc");
      block.appendChild(contentContainer);
      return;
    }

    // Tìm nội dung trong fragment (với fallback chain)
    const content =
      fragment.querySelector(".default-content-wrapper") ||
      fragment.querySelector(".content") ||
      fragment;

    if (!content) {
      contentContainer.innerHTML = "";
      console.log("⚠️ Không tìm thấy nội dung trong Google Doc");
      block.appendChild(contentContainer);
      return;
    }

    // Lấy HTML content
    const htmlContent = content.innerHTML || content.outerHTML || "";

    if (!htmlContent.trim()) {
      contentContainer.innerHTML = "";
      console.log("⚠️ Nội dung Google Doc trống");
      block.appendChild(contentContainer);
      return;
    }

    // Xử lý và làm sạch HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Loại bỏ button-container wrapper nhưng giữ nội dung bên trong
    tempDiv.querySelectorAll(".button-container").forEach((container) => {
      const content = container.innerHTML;
      if (content) {
        container.replaceWith(
          document.createRange().createContextualFragment(content)
        );
      }
    });

    // Loại bỏ class 'button' khỏi tất cả thẻ <a>
    tempDiv.querySelectorAll("a.button").forEach((link) => {
      link.classList.remove("button");
    });

    // Lấy HTML đã được làm sạch
    const finalHtmlContent = tempDiv.innerHTML;

    if (finalHtmlContent.trim()) {
      contentContainer.innerHTML = finalHtmlContent;
      console.log("✅ Đã tải thành công nội dung top message từ Google Doc");
    } else {
      contentContainer.innerHTML = "";
      console.log("⚠️ Không tìm thấy nội dung trong Google Doc");
    }
  } catch (error) {
    console.log("❌ Lỗi khi tải nội dung:", error);
    contentContainer.innerHTML = "";
  }

  // Thêm container vào block
  block.appendChild(contentContainer);
}
