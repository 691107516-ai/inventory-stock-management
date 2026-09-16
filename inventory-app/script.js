const STORAGE_KEY = "stockflow_products";

const defaultProducts = [
  {
    id: 1,
    name: "เมาส์ไร้สาย",
    code: "IT-001",
    category: "อุปกรณ์ไอที",
    unit: "ชิ้น",
    price: 590,
    stock: 18,
    minStock: 5
  },
  {
    id: 2,
    name: "คีย์บอร์ด Mechanical",
    code: "IT-002",
    category: "อุปกรณ์ไอที",
    unit: "ชิ้น",
    price: 1890,
    stock: 4,
    minStock: 5
  },
  {
    id: 3,
    name: "กระดาษ A4 80 แกรม",
    code: "OF-001",
    category: "เครื่องเขียน",
    unit: "รีม",
    price: 125,
    stock: 32,
    minStock: 10
  },
  {
    id: 4,
    name: "ปากกาลูกลื่น สีน้ำเงิน",
    code: "OF-002",
    category: "เครื่องเขียน",
    unit: "ด้าม",
    price: 15,
    stock: 0,
    minStock: 20
  }
];

let products = loadProducts();
let stockAction = "add";

const productTableBody = document.getElementById("productTableBody");
const emptyState = document.getElementById("emptyState");
const lowStockList = document.getElementById("lowStockList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const productModal = document.getElementById("productModal");
const stockModal = document.getElementById("stockModal");
const productForm = document.getElementById("productForm");
const stockForm = document.getElementById("stockForm");
const toast = document.getElementById("toast");

function loadProducts() {
  const savedProducts = localStorage.getItem(STORAGE_KEY);

  if (!savedProducts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
    return defaultProducts;
  }

  return JSON.parse(savedProducts);
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function formatNumber(number) {
  return new Intl.NumberFormat("th-TH").format(number);
}

function formatCurrency(number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
}

function getProductStatus(product) {
  if (product.stock === 0) {
    return {
      key: "out-of-stock",
      label: "หมดสต็อก",
      className: "status-out-of-stock"
    };
  }

  if (product.stock <= product.minStock) {
    return {
      key: "low-stock",
      label: "ใกล้หมด",
      className: "status-low-stock"
    };
  }

  return {
    key: "in-stock",
    label: "พร้อมขาย",
    className: "status-in-stock"
  };
}

function renderSummary() {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const totalValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );
  const lowStockCount = products.filter(
    (product) => product.stock <= product.minStock
  ).length;

  document.getElementById("totalProducts").textContent = formatNumber(totalProducts);
  document.getElementById("totalStock").textContent = formatNumber(totalStock);
  document.getElementById("totalValue").textContent = formatCurrency(totalValue);
  document.getElementById("lowStockCount").textContent = formatNumber(lowStockCount);
}

function renderCategories() {
  const currentValue = categoryFilter.value;
  const categories = [...new Set(products.map((product) => product.category))].sort();

  categoryFilter.innerHTML = `
    <option value="all">ทุกหมวดหมู่</option>
    ${categories
      .map((category) => `<option value="${category}">${category}</option>`)
      .join("")}
  `;

  if ([...categoryFilter.options].some((option) => option.value === currentValue)) {
    categoryFilter.value = currentValue;
  }

  document.getElementById("categoryOptions").innerHTML = categories
    .map((category) => `<option value="${category}"></option>`)
    .join("");
}

function getFilteredProducts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedStatus = statusFilter.value;

  return products.filter((product) => {
    const status = getProductStatus(product);

    const matchesKeyword =
      product.name.toLowerCase().includes(keyword) ||
      product.code.toLowerCase().includes(keyword);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || status.key === selectedStatus;

    return matchesKeyword && matchesCategory && matchesStatus;
  });
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  productTableBody.innerHTML = filteredProducts
    .map((product) => {
      const status = getProductStatus(product);

      return `
        <tr>
          <td>
            <span class="product-name">${product.name}</span>
            <span class="product-code">${product.code}</span>
          </td>
          <td>${product.category}</td>
          <td>${formatCurrency(product.price)} บาท</td>
          <td>
            <span class="stock-number">${formatNumber(product.stock)}</span>
            ${product.unit}
          </td>
          <td>
            <span class="status-badge ${status.className}">${status.label}</span>
          </td>
          <td class="text-center">
            <div class="action-buttons">
              <button
                class="table-action-btn"
                title="ปรับสต็อก"
                data-action="stock"
                data-id="${product.id}"
              >±</button>
              <button
                class="table-action-btn"
                title="แก้ไขสินค้า"
                data-action="edit"
                data-id="${product.id}"
              >✏️</button>
              <button
                class="table-action-btn delete"
                title="ลบสินค้า"
                data-action="delete"
                data-id="${product.id}"
              >🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const noProducts = products.length === 0;
  emptyState.classList.toggle("hidden", !noProducts);

  if (noProducts) {
    productTableBody.innerHTML = "";
  }
}

function renderLowStock() {
  const lowStockProducts = products.filter(
    (product) => product.stock <= product.minStock
  );

  if (lowStockProducts.length === 0) {
    lowStockList.innerHTML = `
      <div class="no-low-stock">
        ✅ สินค้าทุกชิ้นมีจำนวนสต็อกเพียงพอในขณะนี้
      </div>
    `;
    return;
  }

  lowStockList.innerHTML = lowStockProducts
    .map(
      (product) => `
        <article class="low-stock-card">
          <h3>${product.name}</h3>
          <p>รหัสสินค้า: ${product.code} • หมวดหมู่: ${product.category}</p>
          <div class="low-stock-card-footer">
            <span class="low-stock-amount">
              เหลือ ${formatNumber(product.stock)} ${product.unit}
              (ขั้นต่ำ ${formatNumber(product.minStock)})
            </span>
            <button data-refill-id="${product.id}">เพิ่มสต็อก</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderApp() {
  renderSummary();
  renderCategories();
  renderProducts();
  renderLowStock();
}

function openProductModal(product = null) {
  productForm.reset();

  if (product) {
    document.getElementById("modalTitle").textContent = "แก้ไขข้อมูลสินค้า";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCode").value = product.code;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productUnit").value = product.unit;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productMinStock").value = product.minStock;
  } else {
    document.getElementById("modalTitle").textContent = "เพิ่มสินค้าใหม่";
    document.getElementById("productId").value = "";
    document.getElementById("productUnit").value = "ชิ้น";
    document.getElementById("productMinStock").value = 5;
  }

  productModal.classList.remove("hidden");
  document.getElementById("productName").focus();
}

function closeProductModal() {
  productModal.classList.add("hidden");
}

function openStockModal(product) {
  document.getElementById("stockProductId").value = product.id;
  document.getElementById("stockProductName").textContent =
    `${product.name} (คงเหลือ ${formatNumber(product.stock)} ${product.unit})`;

  document.getElementById("stockAmount").value = 1;
  setStockAction("add");
  stockModal.classList.remove("hidden");
  document.getElementById("stockAmount").focus();
}

function closeStockModal() {
  stockModal.classList.add("hidden");
}

function setStockAction(action) {
  stockAction = action;

  document.querySelectorAll(".stock-action").forEach((button) => {
    button.classList.toggle("active", button.dataset.action === action);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function deleteProduct(id) {
  const product = products.find((item) => item.id === id);

  if (!product) return;

  const confirmed = confirm(`ต้องการลบสินค้า "${product.name}" ใช่หรือไม่?`);

  if (!confirmed) return;

  products = products.filter((item) => item.id !== id);
  saveProducts();
  renderApp();
  showToast("ลบสินค้าเรียบร้อยแล้ว");
}

document.getElementById("openAddModalBtn").addEventListener("click", () => {
  openProductModal();
});

document.getElementById("emptyAddBtn").addEventListener("click", () => {
  openProductModal();
});

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeProductModal);
});

document.querySelectorAll("[data-close-stock-modal]").forEach((element) => {
  element.addEventListener("click", closeStockModal);
});

document.querySelectorAll(".stock-action").forEach((button) => {
  button.addEventListener("click", () => {
    setStockAction(button.dataset.action);
  });
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const code = document.getElementById("productCode").value.trim().toUpperCase();
  const category = document.getElementById("productCategory").value.trim();
  const unit = document.getElementById("productUnit").value.trim() || "ชิ้น";
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const minStock = Number(document.getElementById("productMinStock").value);

  const duplicateCode = products.some(
    (product) => product.code === code && String(product.id) !== id
  );

  if (duplicateCode) {
    showToast("รหัสสินค้านี้มีอยู่ในระบบแล้ว");
    return;
  }

  const productData = {
    id: id ? Number(id) : Date.now(),
    name,
    code,
    category,
    unit,
    price,
    stock,
    minStock
  };

  if (id) {
    products = products.map((product) =>
      product.id === Number(id) ? productData : product
    );
    showToast("แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว");
  } else {
    products.unshift(productData);
    showToast("เพิ่มสินค้าใหม่เรียบร้อยแล้ว");
  }

  saveProducts();
  renderApp();
  closeProductModal();
});

stockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = Number(document.getElementById("stockProductId").value);
  const amount = Number(document.getElementById("stockAmount").value);
  const product = products.find((item) => item.id === id);

  if (!product || amount <= 0) return;

  if (stockAction === "remove" && amount > product.stock) {
    showToast("ไม่สามารถลดสต็อกมากกว่าจำนวนที่มีได้");
    return;
  }

  product.stock =
    stockAction === "add" ? product.stock + amount : product.stock - amount;

  saveProducts();
  renderApp();
  closeStockModal();

  showToast(
    stockAction === "add"
      ? `เพิ่มสต็อก ${formatNumber(amount)} ${product.unit} แล้ว`
      : `ลดสต็อก ${formatNumber(amount)} ${product.unit} แล้ว`
  );
});

productTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);
  const product = products.find((item) => item.id === id);

  if (!product) return;

  if (button.dataset.action === "edit") openProductModal(product);
  if (button.dataset.action === "stock") openStockModal(product);
  if (button.dataset.action === "delete") deleteProduct(id);
});

lowStockList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-refill-id]");

  if (!button) return;

  const id = Number(button.dataset.refillId);
  const product = products.find((item) => item.id === id);

  if (product) openStockModal(product);
});

[searchInput, categoryFilter, statusFilter].forEach((element) => {
  element.addEventListener("input", renderProducts);
  element.addEventListener("change", renderProducts);
});

document.getElementById("resetDataBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "ต้องการล้างข้อมูลทั้งหมดและกลับไปใช้ข้อมูลตัวอย่างหรือไม่?"
  );

  if (!confirmed) return;

  products = [...defaultProducts];
  saveProducts();
  searchInput.value = "";
  categoryFilter.value = "all";
  statusFilter.value = "all";
  renderApp();
  showToast("รีเซ็ตข้อมูลเรียบร้อยแล้ว");
});

renderApp();