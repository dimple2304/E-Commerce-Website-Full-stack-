// const cartContainer = document.querySelector(".cartContainer");
// const logoutBtn = document.querySelector("#logoutBtn");
// const welcome = document.querySelector("#welcome");

// let username = new URLSearchParams(window.location.search).get("user");
// let user = null;
// let products = [];

// window.onload = async () => {
//     if (!username) return (window.location.href = "../index.html");
//     await fetchUser();
//     await fetchProducts();
//     renderCart();
// };

// logoutBtn.addEventListener("click", async () => {
//     await fetch("http://localhost:3000/logout", { method: "POST" });
// });

// async function fetchUser() {
//     const res = await fetch(`http://localhost:3000/users/${username}`);
//     user = res.ok ? await res.json() : null;
//     if (!user) window.location.href = "../index.html";
//     welcome.textContent = `Welcome ${user.username}`;
// }

// async function fetchProducts() {
//     const res = await fetch("http://localhost:3000/products");
//     products = await res.json();
// }

// function renderCart() {
//     cartContainer.innerHTML = "";

//     if (!user.cart.length) {
//         cartContainer.innerHTML = "<p>Your cart is empty.</p>";
//         return;
//     }

//     user.cart.forEach(cartItem => {
//         const product = products.find(p => p.id === cartItem.id);
//         if (!product) return;

//         const div = document.createElement("div");
//         div.className = "userCart";
//         div.innerHTML = `
//             <p><strong>${product.name}</strong></p>
//             <p>Price: $${product.price}</p>
//             <p>Description: ${product.description}</p>
//             <input type="number" min="1" value="${cartItem.quantity}" />
//             <div>
//                 <button class="buyBtn">Buy</button>
//                 <button class="removeBtn">Remove</button>
//             </div>
//         `;

//         const qtyInput = div.querySelector("input");
//         const buyBtn = div.querySelector(".buyBtn");
//         const removeBtn = div.querySelector(".removeBtn");

//         // Buy product
//         buyBtn.addEventListener("click", async () => {
//             const finalQty = Number(qtyInput.value);
//             if (product.quantity < finalQty) {
//                 alert("Insufficient stock.");
//                 return;
//             }
//             await fetch(`http://localhost:3000/users/${user.username}/buy`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ id: product.id, quantity: finalQty })
//             });
//             await fetchUser();
//             await fetchProducts();
//             renderCart();
//         });

//         // Remove from cart
//         removeBtn.addEventListener("click", async () => {
//             await fetch(`http://localhost:3000/users/${user.username}/cart/${product.id}`, {
//                 method: "DELETE"
//             });
//             await fetchUser();
//             renderCart();
//         });

//         cartContainer.appendChild(div);
//     });
// }
