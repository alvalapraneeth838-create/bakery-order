const STORAGE_KEY = "bakeryOrders";
const form = document.getElementById("orderForm");
const orderRows = document.getElementById("orderRows");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
let orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// Format a number as Indian currency for the browser UI.
function money(value) {
  return "₹" + Number(value).toFixed(2);
}

// Calculate and apply each order's payment status from amount paid.
function paymentStatus(order) {
  if (order.amountPaid <= 0) return "Unpaid";
  if (order.amountPaid >= order.total) return "Paid";
  return "Partial";
}

// Save orders to localStorage, the browser equivalent of a local JSON file.
function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// Render summary cards and the filtered order table.
function render() {
  const keyword = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = orders.filter((order) => {
    const matchesText =
      order.customerName.toLowerCase().includes(keyword) ||
      order.item.toLowerCase().includes(keyword);
    const matchesStatus = status === "All" || order.status === status;
    return matchesText && matchesStatus;
  });

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const collected = orders.reduce((sum, order) => sum + order.amountPaid, 0);

  document.getElementById("totalOrders").textContent = orders.length;
  document.getElementById("totalRevenue").textContent = money(revenue);
  document.getElementById("collected").textContent = money(Math.min(collected, revenue));
  document.getElementById("pending").textContent = money(Math.max(revenue - collected, 0));

  if (filtered.length === 0) {
    orderRows.innerHTML = '<tr><td class="empty" colspan="7">No orders found.</td></tr>';
    return;
  }

  orderRows.innerHTML = filtered.map((order) => `
    <tr>
      <td>#${order.id}</td>
      <td>${escapeHtml(order.customerName)}</td>
      <td>${escapeHtml(order.item)}</td>
      <td>${order.pickupDate}</td>
      <td>${money(order.total)}</td>
      <td><span class="badge ${order.status}">${order.status}</span></td>
      <td><button class="delete" type="button" data-id="${order.id}" title="Delete order">Delete</button></td>
    </tr>
  `).join("");
}

// Prevent customer-entered text from being treated as HTML.
function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const quantity = Number(document.getElementById("quantity").value);
  const price = Number(document.getElementById("price").value);
  const amountPaid = Number(document.getElementById("amountPaid").value);
  const orderDate = document.getElementById("orderDate").value;
  const pickupDate = document.getElementById("pickupDate").value;

  if (!/^[0-9]{10}$/.test(document.getElementById("phone").value)) {
    alert("Phone number must contain exactly 10 digits.");
    return;
  }

  if (quantity < 1 || quantity > 50) {
    alert("Quantity must be between 1 and 50.");
    return;
  }

  if (price <= 0) {
    alert("Price must be greater than zero.");
    return;
  }

  if (pickupDate < orderDate) {
    alert("Pickup date cannot be before the order date.");
    return;
  }

  const total = Math.round(quantity * price * 100) / 100;
  const safeAmountPaid = Math.min(Math.max(amountPaid, 0), total);
  const order = {
    id: orders.length ? Math.max(...orders.map((item) => item.id)) + 1 : 1,
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value,
    item: document.getElementById("item").value.trim(),
    quantity,
    price,
    orderDate,
    pickupDate,
    amountPaid: safeAmountPaid,
    total,
    notes: document.getElementById("notes").value.trim()
  };
  order.status = paymentStatus(order);

  orders.unshift(order);
  saveOrders();
  form.reset();
  setDefaultDates();
  render();
});

orderRows.addEventListener("click", (event) => {
  if (!event.target.matches(".delete")) return;
  const id = Number(event.target.dataset.id);
  if (confirm("Delete this order?")) {
    orders = orders.filter((order) => order.id !== id);
    saveOrders();
    render();
  }
});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

// Set today as the default order date and today as the initial pickup date.
function setDefaultDates() {
  const today = new Date();
  const todayText = today.toISOString().split("T")[0];
  document.getElementById("orderDate").value = todayText;
  document.getElementById("pickupDate").value = todayText;
  document.getElementById("pickupDate").min = todayText;
}

const now = new Date();
document.getElementById("today").textContent =
  now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
setDefaultDates();
render();
