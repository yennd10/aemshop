import { readBlockConfig } from "../../scripts/aem.js";
import { fetchPlaceholders, rootLink } from "../../scripts/commerce.js";

// Initialize cart functionality
import "../../scripts/initializers/cart.js";

// GraphQL query for fetching products
const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($pageSize: Int = 12, $currentPage: Int = 1, $phrase: String = "", $filter: [ProductAttributeFilterInput!] = []) {
    productSearch(
      page_size: $pageSize
      current_page: $currentPage
      phrase: $phrase
      filter: $filter
    ) {
      total_count
      page_info {
        current_page
        total_pages
        page_size
      }
      items {
        productView {
          sku
          name
          urlKey
          shortDescription
          images(roles: ["thumbnail", "small_image"]) {
            url
            label
            roles
          }
          ... on SimpleProductView {
            price {
              regular {
                amount {
                  currency
                  value
                }
              }
              final {
                amount {
                  currency
                  value
                }
              }
            }
          }
          ... on ComplexProductView {
            priceRange {
              minimum {
                regular {
                  amount {
                    currency
                    value
                  }
                }
                final {
                  amount {
                    currency
                    value
                  }
                }
              }
              maximum {
                regular {
                  amount {
                    currency
                    value
                  }
                }
                final {
                  amount {
                    currency
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Enhanced config reading function
function readEnhancedConfig(block) {
  const config = readBlockConfig(block);
  
  // Also read from data attributes for testing
  const useRealData = block.getAttribute('data-use-real-data') === 'true';
  
  return {
    ...config,
    useRealData: useRealData || config.useRealData || true
  };
}

// Function to fetch products from GraphQL API
async function fetchRealProducts(pageSize = 3, categoryPath = "") {
  try {
    console.log('🚀 Fetching real products from GraphQL API...');
    
    // Try multiple GraphQL endpoints
    const endpoints = [
      '/graphql',
      'https://www.aemshop.net/graphql',
      'https://www.aemshop.net/graphql',
      window.location.origin + '/graphql'
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        
        // Prepare filter for category if specified
        const filter = categoryPath ? [
          {
            attribute: "categoryPath",
            eq: categoryPath
          }
        ] : [];
        
        // Make GraphQL request
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Store': 'default',
            'Magento-Store-Code': 'default',
            'Magento-Store-View-Code': 'default',
            'Magento-Website-Code': 'base',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Demo-Template/1.0)'
          },
          body: JSON.stringify({
            query: PRODUCT_SEARCH_QUERY,
            variables: {
              pageSize: pageSize,
              currentPage: 1,
              phrase: "",
              filter: filter
            }
          })
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log(`📡 Raw response:`, responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        if (data.errors) {
          console.warn('⚠️ GraphQL errors:', data.errors);
          // Continue to next endpoint if this one has errors
          lastError = new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
          continue;
        }

        if (!data.data || !data.data.productSearch) {
          throw new Error('Invalid response format: missing productSearch data');
        }

        const products = data.data.productSearch.items.map(item => item.productView);
        console.log('✅ Real products fetched successfully from', endpoint, ':', products);
        
        return {
          products: products,
          totalCount: data.data.productSearch.total_count,
          pageInfo: data.data.productSearch.page_info,
          endpoint: endpoint
        };
        
      } catch (endpointError) {
        console.warn(`❌ Endpoint ${endpoint} failed:`, endpointError);
        lastError = endpointError;
        continue;
      }
    }
    
    // If all endpoints failed, throw the last error
    throw lastError || new Error('All GraphQL endpoints failed');
    
  } catch (error) {
    console.error('❌ Error fetching real products from all endpoints:', error);
    throw error;
  }
}

// Function to test GraphQL API connectivity
async function testGraphQLConnectivity() {
  console.log('🧪 Testing GraphQL API connectivity...');
  
  const endpoints = [
    '/graphql',
    'https://www.aemshop.net/graphql',
    window.location.origin + '/graphql'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      
      const testQuery = `
        query TestQuery {
          __schema {
            types {
              name
            }
          }
        }
      `;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Store': 'default',
          'Magento-Store-Code': 'default',
          'Magento-Store-View-Code': 'default',
          'Magento-Website-Code': 'base',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: testQuery
        })
      });
      
      const status = response.status;
      const ok = response.ok;
      
      results.push({
        endpoint,
        status,
        ok,
        accessible: ok
      });
      
      console.log(`📡 ${endpoint}: ${status} ${response.statusText} - ${ok ? '✅ Accessible' : '❌ Not accessible'}`);
      
    } catch (error) {
      results.push({
        endpoint,
        status: 'ERROR',
        ok: false,
        accessible: false,
        error: error.message
      });
      
      console.log(`📡 ${endpoint}: ❌ Error - ${error.message}`);
    }
  }
  
  console.log('📊 GraphQL Connectivity Test Results:', results);
  return results;
}

// Make test function available globally for debugging
window.testGraphQLConnectivity = testGraphQLConnectivity;

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const config = readEnhancedConfig(block);

  // Get metadata from config
  const {
    template = "demo-template",
    title = "Demo Template with Real Products",
    description = "Display real products from catalog",
    categoryPath = "", // Optional: specific category to show products from
    pageSize = 3, // Number of products to show
    useRealData = true, // Default to real data now
  } = config;

  console.log('🔧 Block configuration:', { template, title, description, categoryPath, pageSize, useRealData });

  // Hiển thị loading state
  block.innerHTML = `
    <section class="demo-template">
      <div class="demo-template__header">
        <h1 class="demo-template__title">${title}</h1>
        <p class="demo-template__description">${description}</p>
      </div>
      
      <div class="demo-template__content">
        <div class="demo-template__template-info">
          <strong>Template:</strong> ${template}
          ${categoryPath ? `<br><strong>Category:</strong> ${categoryPath}` : ''}
          <br><strong>Data Source:</strong> <span id="data-source">Loading...</span>
          <br><strong>Mode:</strong> ${useRealData ? 'Real Catalog Data' : 'Mock Data'}
        </div>
        
        <div class="demo-template__products">
          <h3>Loading products...</h3>
          <div class="demo-template__loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    </section>
  `;

  try {
    // Get products container
    const productsContainer = block.querySelector('.demo-template__products');
    const dataSourceSpan = block.querySelector('#data-source');
    
    // Try to use real data if requested
    if (useRealData) {
      try {
        dataSourceSpan.textContent = 'Real Catalog Data';
        
        // First test GraphQL connectivity
        console.log('🧪 Testing GraphQL connectivity before fetching products...');
        const connectivityResults = await testGraphQLConnectivity();
        const accessibleEndpoints = connectivityResults.filter(r => r.accessible);
        
        if (accessibleEndpoints.length === 0) {
          throw new Error('No GraphQL endpoints are accessible. Check your API configuration.');
        }
        
        console.log(`✅ Found ${accessibleEndpoints.length} accessible GraphQL endpoint(s)`);
        
        // Fetch real products from GraphQL API
        const result = await fetchRealProducts(pageSize, categoryPath);
        
        if (result.products && result.products.length > 0) {
          // Clear loading state
          productsContainer.innerHTML = `
            <h3>${result.products.length} Products from Catalog</h3>
            <div class="demo-template__info-message">
              <p>✅ Successfully fetched from: <strong>${result.endpoint}</strong></p>
              <p>Total products in catalog: <strong>${result.totalCount}</strong></p>
            </div>
            <div class="demo-template__products-grid"></div>
          `;
          
          const productsGrid = productsContainer.querySelector('.demo-template__products-grid');
          
          // Render real products
          renderRealProducts(productsGrid, result.products);
          
          console.log('✅ Real products loaded successfully from catalog');
          return;
        } else {
          throw new Error('No products found in catalog');
        }
        
      } catch (error) {
        console.log('⚠️ Failed to fetch real products, falling back to mock data:', error);
        dataSourceSpan.textContent = 'Mock Data (Real data failed)';
        
        // Show error details before falling back
        productsContainer.innerHTML = `
          <h3>⚠️ Real Data Unavailable</h3>
          <div class="demo-template__info-message">
            <p>❌ Failed to fetch from GraphQL API</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Falling back to demo products...</p>
          </div>
        `;
        
        // Wait a moment to show the error, then fall back to mock data
        setTimeout(() => {
          renderMockProducts(productsContainer, pageSize);
        }, 2000);
      }
    } else {
      // Use mock data
      dataSourceSpan.textContent = 'Mock Data';
      renderMockProducts(productsContainer, pageSize);
    }

  } catch (error) {
    console.error("Error loading products:", error);
    const productsContainer = block.querySelector('.demo-template__products');
    productsContainer.innerHTML = `
      <h3>Unable to load products</h3>
      <p>Please try again later.</p>
      <p>Error: ${error.message}</p>
    `;
  }

  // Add class for styling
  block.classList.add("demo-template--loaded");
}

// Function to render real products from catalog
function renderRealProducts(productsGrid, products) {
  const productsHTML = products
    .map((product) => {
      const imageUrl = product.images?.[0]?.url || "/assets/images/375x375.png";
      const imageAlt = product.images?.[0]?.label || product.name || product.sku;
      
      // Handle different product types
      let priceDisplay = "Contact us";
      let isComplex = false;
      
      if (product.price) {
        // Simple product
        const price = product.price.final?.amount || product.price.regular?.amount;
        if (price) {
          priceDisplay = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: price.currency || "USD",
          }).format(price.value);
        }
      } else if (product.priceRange) {
        // Complex product
        isComplex = true;
        const minPrice = product.priceRange.minimum?.final?.amount || product.priceRange.minimum?.regular?.amount;
        const maxPrice = product.priceRange.maximum?.final?.amount || product.priceRange.maximum?.regular?.amount;
        
        if (minPrice && maxPrice) {
          const minFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: minPrice.currency || "USD",
          }).format(minPrice.value);
          const maxFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: maxPrice.currency || "USD",
          }).format(maxPrice.value);
          priceDisplay = `${minFormatted} - ${maxFormatted}`;
        }
      }

      return `
      <div class="demo-template__product">
        <div class="demo-template__product-image">
          <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
        </div>
        <div class="demo-template__product-info">
          <h4 class="demo-template__product-title">${product.name || product.sku}</h4>
          <p class="demo-template__product-description">${
            product.shortDescription || "Product description"
          }</p>
          <div class="demo-template__product-price">${priceDisplay}</div>
          <div class="demo-template__product-actions">
            <button class="demo-template__button primary view-details" data-urlkey="${
              product.urlKey || product.sku
            }" data-sku="${product.sku}">View Details</button>
            <button class="demo-template__button secondary add-to-cart" data-sku="${
              product.sku
            }" ${isComplex ? 'disabled' : ''}>${isComplex ? 'View Options' : 'Add to Cart'}</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Update HTML with products
  productsGrid.innerHTML = productsHTML;

  // Add lazy loading for images
  const images = productsGrid.querySelectorAll("img");
  images.forEach((img) => {
    img.loading = "lazy";
  });

  // Handle button actions
  setupProductActions(productsGrid);
}

// Mock data for fallback
const mockProducts = [
  {
    sku: "DEMO-001",
    name: "Demo Product 1",
    urlKey: "demo-product-1",
    shortDescription: "This is a demo product for testing purposes",
    images: [{ url: "https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Product+1" }],
    price: {
      final: {
        amount: {
          currency: "USD",
          value: 29.99
        }
      }
    },
    typename: "SimpleProductView"
  },
  {
    sku: "DEMO-002", 
    name: "Demo Product 2",
    urlKey: "demo-product-2",
    shortDescription: "Another demo product to showcase the template",
    images: [{ url: "https://via.placeholder.com/300x300/2196F3/FFFFFF?text=Product+2" }],
    price: {
      final: {
        amount: {
          currency: "USD",
          value: 49.99
        }
      }
    },
    typename: "SimpleProductView"
  },
  {
    sku: "DEMO-003",
    name: "Demo Product 3", 
    urlKey: "demo-product-3",
    shortDescription: "Third demo product to complete the set",
    images: [{ url: "https://via.placeholder.com/300x300/FF9800/FFFFFF?text=Product+3" }],
    price: {
      final: {
        amount: {
          currency: "USD",
          value: 79.99
        }
      }
    },
    typename: "SimpleProductView"
  }
];

// Function to render mock products (fallback)
function renderMockProducts(productsContainer, pageSize) {
  // Clear loading state
  productsContainer.innerHTML = `
    <h3>${pageSize} Demo Products</h3>
    <div class="demo-template__products-grid"></div>
  `;
  
  const productsGrid = productsContainer.querySelector('.demo-template__products-grid');

  // Use mock products
  const products = mockProducts.slice(0, pageSize);
  console.log('Using mock products as fallback:', products);

  // Render products manually
  const productsHTML = products
    .map((product) => {
      const imageUrl = product.images?.[0]?.url || "/assets/images/375x375.png";
      const price = product.price?.final?.amount;
      const priceFormatted = price
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: price.currency || "USD",
          }).format(price.value)
        : "Contact us";

      return `
      <div class="demo-template__product">
        <div class="demo-template__product-image">
          <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="demo-template__product-info">
          <h4 class="demo-template__product-title">${product.name}</h4>
          <p class="demo-template__product-description">${
            product.shortDescription || "Product description"
          }</p>
          <div class="demo-template__product-price">${priceFormatted}</div>
          <div class="demo-template__product-actions">
            <button class="demo-template__button primary view-details" data-urlkey="${
              product.urlKey
            }" data-sku="${product.sku}">View Details</button>
            <button class="demo-template__button secondary add-to-cart" data-sku="${
              product.sku
            }">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Update HTML with products
  productsGrid.innerHTML = productsHTML;

  // Add lazy loading for images
  const images = productsContainer.querySelectorAll("img");
  images.forEach((img) => {
    img.loading = "lazy";
  });

  // Handle button actions
  setupProductActions(productsContainer);

  console.log('✅ Mock products loaded successfully as fallback');
}

// Function to setup product actions
function setupProductActions(container) {
  // Handle Add to Cart buttons
  const addToCartButtons = container.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if button is disabled (complex products)
      if (button.disabled) {
        console.log('Complex product - navigating to product page instead');
        const sku = button.dataset.sku;
        const productUrl = `/products/${sku}`;
        window.location.href = productUrl;
        return;
      }
      
      const sku = button.dataset.sku;
      console.log("Add to cart:", sku);

      // Add visual feedback
      const originalText = button.textContent;
      button.textContent = "Adding...";
      button.disabled = true;
      button.style.background = "var(--color-neutral-400)";
      button.style.color = "white";

      try {
        // Import and use addProductsToCart function
        const { addProductsToCart } = await import(
          "../../scripts/__dropins__/storefront-cart/api.js"
        );

        // Add product to cart
        await addProductsToCart([
          {
            sku: sku,
            quantity: 1,
          },
        ]);

        // Success feedback
        button.textContent = "Added!";
        button.style.background = "var(--color-positive-500)";
        button.style.color = "white";

        // Reset button after 2 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "";
          button.style.color = "";
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Error adding to cart:", error);

        // Error feedback
        button.textContent = "Error!";
        button.style.background = "var(--color-alert-500)";
        button.style.color = "white";

        // Reset button after 2 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "";
          button.style.color = "";
          button.disabled = false;
        }, 2000);
      }
    });
  });

  // Handle View Details buttons
  const viewDetailsButtons = container.querySelectorAll(".view-details");
  viewDetailsButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const urlKey = button.dataset.urlkey;
      const sku = button.dataset.sku;
      const productUrl = `/products/${urlKey}/${sku}`;
      console.log("Navigating to:", productUrl);

      // Try to navigate to product page
      try {
        console.log("Navigating to:", productUrl);
        window.location.href = productUrl;
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback: open in new tab
        window.open(productUrl, "_blank");
      }
    });
  });
}
