import { readBlockConfig } from '../../scripts/aem.js';
import { getSkuFromUrl, fetchIndex } from '../../scripts/commerce.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const { type, position } = readBlockConfig(block);

  try {
    const filters = {};
    if (type === 'product') {
      const productSku = getSkuFromUrl();
      if (!productSku) {
        throw new Error('No product SKU found in URL');
      }
      filters.products = productSku;
    }

    if (type === 'category') {
      const plpBlock = document.querySelector('.block.product-list-page');
      if (!plpBlock) {
        throw new Error('No product list page block found');
      }

      const category = plpBlock.dataset?.category || readBlockConfig(plpBlock).category;
      if (!category) {
        throw new Error('No category ID found in product list page block');
      }
      filters.categories = category;
    }

    if (position) {
      filters.positions = position;
    }

    // Try to fetch enrichment data, but handle the case when it doesn't exist
    let index;
    try {
      index = await fetchIndex('enrichment/enrichment');
    } catch (fetchError) {
      console.warn('Enrichment data not available:', fetchError.message);
      // If enrichment data is not available, just remove the block and return
      return;
    }

    // Check if index data exists and has the expected structure
    if (!index || !index.data || !Array.isArray(index.data)) {
      console.warn('No enrichment data available');
      return;
    }

    const matchingFragments = index.data
      .filter((fragment) => {
        try {
          return Object.keys(filters).every((filterKey) => {
            if (!fragment[filterKey]) return false;
            const values = JSON.parse(fragment[filterKey]);
            return values.includes(filters[filterKey]);
          });
        } catch (parseError) {
          console.warn('Error parsing fragment data:', parseError);
          return false;
        }
      })
      .map((fragment) => fragment.path);

    if (matchingFragments.length === 0) {
      console.log('No matching enrichment fragments found for current filters');
      return;
    }

    (await Promise.all(matchingFragments.map((path) => loadFragment(path))))
      .filter((fragment) => fragment)
      .forEach((fragment) => {
        const sections = fragment.querySelectorAll(':scope .section');

        // If only single section, replace block with content of section
        if (sections.length === 1) {
          block.closest('.section').classList.add(...sections[0].classList);
          const wrapper = block.closest('.enrichment-wrapper');
          Array.from(sections[0].children)
            .forEach((child) => wrapper.parentNode.insertBefore(child, wrapper));
        } else if (sections.length > 1) {
          // If multiple sections, insert them after section of block
          const blockSection = block.closest('.section');
          Array.from(sections)
            .reverse()
            .forEach((section) => blockSection
              .parentNode.insertBefore(section, blockSection.nextSibling));
        }
      });
  } catch (error) {
    console.error('Enrichment block error:', error);
  } finally {
    block.closest('.enrichment-wrapper')?.remove();
  }
}
