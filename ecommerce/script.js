let products = [];
let cart = [];
let discount = 0;

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    if (raw) cart = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load cart from localStorage", e);
    cart = [];
  }
}

function showError(message) {
  const container = document.getElementById("productList");
  container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function showLoading() {
  const container = document.getElementById("productList");
  container.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  showLoading();
  fetch("products.json")
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      products = data;
      populateCategoryFilter();
      applyFiltersAndSort();
      renderCart();
    })
    .catch((err) => {
      console.error(err);
      showError("Failed to load products. Please try again later.");
    });

  document
    .getElementById("categoryFilter")
    .addEventListener("change", applyFiltersAndSort);
  document
    .getElementById("priceRangeSelect")
    .addEventListener("change", applyFiltersAndSort);
  document.getElementById("sortBy").addEventListener("change", applyFiltersAndSort);

  document.getElementById("applyPromo").addEventListener("click", () => {
    const code = document.getElementById("promoCode").value.trim().toUpperCase();
    if (code === "WELCOME10") discount = 0.1;
    else discount = 0;
    renderCart();
  });

  document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (cart.length === 0) return alert("Your cart is empty.");
    const confirmed = confirm("Proceed to checkout?");
    if (confirmed) {
      cart = [];
      saveCart();
      renderCart();
      alert("Thank you for your purchase!");
    }
  });

  // Event delegation for add-to-cart buttons and cart actions
  document.getElementById("productList").addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    addToCart(id);
  });

  document.getElementById("cartItems").addEventListener("click", (e) => {
    const minus = e.target.closest(".qty-decrease");
    if (minus) {
      const id = parseInt(minus.dataset.id, 10);
      changeQty(id, -1);
      return;
    }
    const plus = e.target.closest(".qty-increase");
    if (plus) {
      const id = parseInt(plus.dataset.id, 10);
      changeQty(id, 1);
      return;
    }
    const remove = e.target.closest(".remove-item");
    if (remove) {
      const id = parseInt(remove.dataset.id, 10);
      removeFromCart(id);
      return;
    }
  });
});

function populateCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  // clear existing options except first
  Array.from(select.options)
    .slice(1)
    .forEach((o) => o.remove());
  const categories = [...new Set(products.map((p) => p.category))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function renderProducts(list) {
  const container = document.getElementById("productList");
  container.innerHTML = "";
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-muted">No products found.</p>';
    return;
  }

  list.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4";

    const card = document.createElement("div");
    card.className = "card h-100";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src = product.image;
    img.alt = product.alt || product.name;

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = product.name;

    const price = document.createElement("p");
    price.textContent = `$${product.price.toFixed(2)}`;

    const stars = document.createElement("p");
    stars.innerHTML = renderStars(product.rating);

    const btn = document.createElement("button");
    btn.className = "btn btn-dark w-100 add-to-cart";
    btn.type = "button";
    btn.dataset.id = product.id;
    btn.textContent = "Add to cart";

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(stars);
    body.appendChild(btn);

    card.appendChild(img);
    card.appendChild(body);
    col.appendChild(card);
    container.appendChild(col);
  });
}

function renderStars(rating) {
  const full = Math.round(rating);
  let html = "";
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '<span class="star filled">★</span>'; else html += '<span class="star">☆</span>';
  }
  return html;
}

function addToCart(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cartItems");
  list.innerHTML = "";
  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const name = document.createElement("span");
    name.textContent = item.name;

    const controls = document.createElement("div");

    const dec = document.createElement("button");
    dec.className = "btn btn-sm btn-outline-secondary qty-decrease";
    dec.type = "button";
    dec.dataset.id = item.id;
    dec.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
    dec.setAttribute("aria-label", "Decrease quantity");

    const qty = document.createElement("span");
    qty.className = "mx-2";
    qty.textContent = item.qty;

    const inc = document.createElement("button");
    inc.className = "btn btn-sm btn-outline-secondary qty-increase";
    inc.type = "button";
    inc.dataset.id = item.id;
    inc.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
    inc.setAttribute("aria-label", "Increase quantity");

    const price = document.createElement("span");
    price.className = "mx-2";
    price.textContent = `× $${item.price.toFixed(2)}`;

    const rem = document.createElement("button");
    rem.className = "btn btn-sm btn-danger remove-item";
    rem.type = "button";
    rem.dataset.id = item.id;
    rem.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    rem.setAttribute("aria-label", "Remove item");

    controls.appendChild(dec);
    controls.appendChild(qty);
    controls.appendChild(inc);
    controls.appendChild(price);
    controls.appendChild(rem);

    li.appendChild(name);
    li.appendChild(controls);
    list.appendChild(li);
  });

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("total").textContent = (subtotal - subtotal * discount).toFixed(2);
}

function changeQty(id, change) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

function applyFiltersAndSort() {
  const category = document.getElementById("categoryFilter").value;
  const priceValue = document.getElementById("priceRangeSelect").value;
  const sortBy = document.getElementById("sortBy").value;

  let filtered = products.filter((p) => {
    let priceMatch = true;
    if (priceValue) {
      if (priceValue.includes("-")) {
        let [min, max] = priceValue.split("-").map(Number);
        priceMatch = p.price >= min && p.price <= max;
      } else if (priceValue.includes("+")) {
        let min = parseFloat(priceValue);
        priceMatch = p.price >= min;
      }
    }
    return (category === "" || p.category === category) && priceMatch;
  });

  if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "popularity-desc") filtered.sort((a, b) => b.popularity - a.popularity);

  renderProducts(filtered);
}
