const container = document.querySelector("#userContainer");
const logoutBtn = document.querySelector("#logoutBtn");
const welcome = document.querySelector("#welcome");
const nextBtn = document.querySelector("#nextBtn");
const previousBtn = document.querySelector("#previousBtn");
const pageNumberDisplay = document.querySelector(".pageNumberDisplay");
const goToCartBtn = document.querySelector("#goToCartBtn");
const searchBar = document.querySelector("#searchBar");
const sortSelect = document.querySelector("#sortSelect");


let username = new URLSearchParams(window.location.search).get("user");
let user = null;
let products = [];
const itemsPerPage = 5;
let currentPage = 1;

window.onload = async () => {
    if (!username) return (window.location.href = "../index.html");
    await fetchUser();
    await fetchProducts();
    renderProducts();
};

// logout
logoutBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});

// go to cart
goToCartBtn.addEventListener("click", () => {
    window.location.href = `cart.html?user=${encodeURIComponent(username)}`;
});

// search listener
if (searchBar) {
    searchBar.addEventListener("input", () => {
        currentPage = 1;
        renderProducts();
    });
}

// Sorted products
if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        const sortValue = sortSelect.value;
        if (sortValue === "low") {
            products.sort((a, b) => a.price - b.price);
        } else if (sortValue === "high") {
            products.sort((a, b) => b.price - a.price);
        }
        else if (sortValue === "default") {
            fetchProducts().then(() => renderProducts());
            return;
        }
        currentPage = 1;
        renderProducts();
    });
}

async function fetchUser() {
    const res = await fetch(`http://localhost:3000/users/${username}`);
    user = res.ok ? await res.json() : null;
    if (!user) window.location.href = "../index.html";
    welcome.textContent = `Welcome ${user.username}`;
}

async function fetchProducts() {
    const res = await fetch("http://localhost:3000/products");
    products = await res.json();
}

function renderProducts() {
    container.innerHTML = "";

    const query = searchBar ? searchBar.value.toLowerCase() : "";
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(p => {
        const div = document.createElement("div");
        div.className = "cart";
        div.innerHTML = `
            ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}
            <p>Name: ${p.name}</p>
            <p>Quantity: ${p.quantity}</p>
            <p>Price: $${p.price}</p>
            <p>Description: ${p.description}</p>
        `;

        if (p.quantity == 0) {
            const outOfStockMsg = document.createElement("span");
            outOfStockMsg.innerText = "Currently out of stock!";
            outOfStockMsg.style.color = "red";
            div.appendChild(outOfStockMsg);
        }

        const btn = document.createElement("button");
        btn.type = "button";

        const alreadyInCart = user.cart.some(c => c.id === p.id);
        btn.textContent = alreadyInCart ? "Added to cart" : "Add to cart";
        btn.disabled = alreadyInCart || p.quantity === 0;

        btn.addEventListener("click", async () => {
            const res = await fetch(`http://localhost:3000/users/${user.username}/cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: p.id, price: p.price })
            });
            if (res.ok) {
                swal("Cart updated!", "Product is added in cart!", "success");
                await fetchUser();
                renderProducts();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to add to cart");
            }
        });

        div.appendChild(btn);
        container.appendChild(div);
    });

    // pagination controls
    nextBtn.disabled = currentPage * itemsPerPage >= filtered.length;
    previousBtn.disabled = currentPage === 1;
    pageNumberDisplay.textContent = `Page ${currentPage} of ${Math.max(1, Math.ceil(filtered.length / itemsPerPage))}`;
}

nextBtn.addEventListener("click", () => {
    currentPage++;
    renderProducts();
});

previousBtn.addEventListener("click", () => {
    currentPage--;
    renderProducts();
});







// const container = document.querySelector("#userContainer");
// const logoutBtn = document.querySelector("#logoutBtn");
// const welcome = document.querySelector("#welcome");
// const nextBtn = document.querySelector("#nextBtn");
// const previousBtn = document.querySelector("#previousBtn");
// const pageNumberDisplay = document.querySelector(".pageNumberDisplay");
// const goToCartBtn = document.querySelector("#goToCartBtn");

// let username = new URLSearchParams(window.location.search).get("user");
// let user = null;
// let products = [];
// const itemsPerPage = 5;
// let currentPage = 1;

// window.onload = async () => {
//     if (!username) return (window.location.href = "../index.html");
//     await fetchUser();
//     await fetchProducts();
//     renderProducts();
// };

// logoutBtn.addEventListener("click", () => {
//     window.location.href = "../index.html";
// });

// goToCartBtn.addEventListener("click", () => {
//     window.location.href = `cart.html?user=${encodeURIComponent(username)}`;
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

// function renderProducts() {
//     container.innerHTML = "";

//     const query = document.querySelector("#searchBar").value.toLowerCase();
//     const filtered = products.filter(p =>
//         p.name.toLowerCase().includes(query) ||
//         p.description.toLowerCase().includes(query)
//     );
//     const start = (currentPage - 1) * itemsPerPage;
//     const pageItems = filtered.slice(start, start + itemsPerPage);

//     pageItems.forEach(p => {
//         const div = document.createElement("div");
//         div.className = "cart";
//         div.innerHTML = `
//             ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}
//             <p>Name: ${p.name}</p>
//             <p>Quantity: ${p.quantity}</p>
//             <p>Price: $${p.price}</p>
//             <p>Description: ${p.description}</p>
//         `;

//         const outOfStockMsg = document.createElement("span");
//         outOfStockMsg.innerText = "Currently out of stock!";
//         outOfStockMsg.style.color = "red";
//         if (p.quantity == 0) {
//             div.appendChild(outOfStockMsg);
//         }

//         const btn = document.createElement("button");
//         btn.type = "button";

//         const alreadyInCart = user.cart.some(c => c.id === p.id);
//         btn.textContent = alreadyInCart ? "Added to cart" : "Add to cart";
//         btn.disabled = alreadyInCart || p.quantity === 0;

//         btn.addEventListener("click", async () => {
//             const res = await fetch(`http://localhost:3000/users/${user.username}/cart`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ id: p.id, price: p.price })
//             });
//             if (res.ok) {
//                 swal("Good job!", "Product is added in cart!", "success");
//                 await fetchUser();
//                 renderProducts();
//             } else {
//                 const err = await res.json();
//                 alert(err.message || "Failed to add to cart");
//             }
//         });

//         div.appendChild(btn);
//         container.appendChild(div);
//     });

//     nextBtn.disabled = currentPage * itemsPerPage >= products.length;
//     previousBtn.disabled = currentPage === 1;
//     pageNumberDisplay.textContent = `Page ${currentPage}`;
// }

// nextBtn.addEventListener("click", () => {
//     currentPage++;
//     renderProducts();
// });

// previousBtn.addEventListener("click", () => {
//     currentPage--;
//     renderProducts();
// });























/* cart on the same page */
// const container = document.querySelector("#userContainer");
// const logoutBtn = document.querySelector("#logoutBtn");
// const welcome = document.querySelector("#welcome");
// const cartContainer = document.querySelector(".cartContainer");
// const nextBtn = document.querySelector("#nextBtn");
// const previousBtn = document.querySelector("#previousBtn");
// const pageNumberDisplay = document.querySelector(".pageNumberDisplay");

// let username = new URLSearchParams(window.location.search).get("user");
// let user = null;
// let products = [];
// const itemsPerPage = 5;
// let currentPage = 1;

// window.onload = async () => {
//     if (!username) return (window.location.href = "../index.html");
//     await fetchUser();
//     await fetchProducts();
//     renderProducts();
//     renderCart();
// };

// logoutBtn.addEventListener("click", () => {
//     window.location.href = "../index.html";
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

// function renderProducts() {
//     container.innerHTML = "";
//     const start = (currentPage - 1) * itemsPerPage;
//     const pageItems = products.slice(start, start + itemsPerPage);

//     pageItems.forEach(p => {
//         const div = document.createElement("div");
//         div.className = "cart";
//         div.innerHTML = `
//             ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}
//             <p>Name: ${p.name}</p>
//             <p>Quantity: ${p.quantity}</p>
//             <p>Price: $${p.price}</p>
//             <p>Description: ${p.description}</p>
//         `;

//         const outOfStockMsg = document.createElement("span");
//         outOfStockMsg.innerText = "Currently out of stock!";
//         outOfStockMsg.style.color = "red";
//         if (p.quantity == 0) {
//             div.appendChild(outOfStockMsg);
//         }

//         const btn = document.createElement("button");
//         btn.type = "button";

//         const cartItem = user.cart.find(c => c.id === p.id);
//         // if (cartItem?.bought) {
//         //     btn.textContent = "Bought";
//         //     btn.disabled = true;
//         // } else {
//         const alreadyInCart = user.cart.some(c => c.id === p.id);
//         btn.textContent = alreadyInCart ? "Added to cart" : "Add to cart";
//         btn.disabled = alreadyInCart || p.quantity === 0;

//         btn.addEventListener("click", async () => {
//             console.log("Adding to cart:", p.id, p.price);
//             if (!p.id || !p.price) {
//                 alert("Product details are missing. Try refreshing the page.");
//                 return;
//             }
//             const res = await fetch(`http://localhost:3000/users/${user.username}/cart`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ id: p.id, price: p.price })
//             });
//             if (res.ok) {
//                 await fetchUser();
//                 renderProducts();
//                 renderCart();
//             } else {
//                 const err = await res.json();
//                 alert(err.message || "Failed to add to cart");
//             }
//         });
//         // }

//         div.appendChild(btn);
//         container.appendChild(div);
//     });

//     nextBtn.disabled = currentPage * itemsPerPage >= products.length;
//     previousBtn.disabled = currentPage === 1;
//     pageNumberDisplay.textContent = `Page ${currentPage}`;
// }

// nextBtn.addEventListener("click", () => {
//     currentPage++;
//     renderProducts();
// });

// previousBtn.addEventListener("click", () => {
//     currentPage--;
//     renderProducts();
// });

// function renderCart() {
//     cartContainer.innerHTML = "";

//     if (!user.cart || user.cart.length === 0) {
//         cartContainer.textContent = "Your cart is empty!";
//         return;
//     }

//     user.cart.forEach((item) => {
//         const productDetails = products.find(p => p.id === item.id);
//         if (!productDetails) return; // skip if product no longer exists

//         const div = document.createElement("div");
//         div.className = "userCart";

//         div.innerHTML = `
//             ${productDetails.image ? `<img src="${productDetails.image}" alt="${productDetails.name}">` : ""}
//             <p>Name: ${productDetails.name}</p>
//             <p>Price: $${productDetails.price}</p>
//             <p>Description: ${productDetails.description}</p>
//         `;

//         const qtyInput = document.createElement("input");
//         qtyInput.type = "number";
//         qtyInput.min = 1;
//         qtyInput.max = productDetails.quantity + (item.purchasedQuantity || 0);
//         qtyInput.value = item.purchasedQuantity || item.quantity;

//         const bill = document.createElement("p");
//         bill.innerText = "Bill: " + qtyInput.value * parseInt(productDetails.price) + "$";

//         qtyInput.addEventListener("input", function () {
//             if (parseInt(qtyInput.value) > productDetails.quantity) {
//                 qtyInput.value = productDetails.quantity;
//             }
//             const updatedQty = parseInt(qtyInput.value) || 0;
//             bill.innerText = "Bill: " + updatedQty * parseInt(productDetails.price) + "$";
//         });

//         const buyBtn = document.createElement("button");
//         buyBtn.classList.add("cartBtns");
//         buyBtn.type = "button";
//         buyBtn.textContent = item.bought ? "Bought" : "Buy now";
//         buyBtn.disabled = item.bought;

//         const cancelBtn = document.createElement("button");
//         cancelBtn.classList.add("cartBtns");
//         cancelBtn.type = "button";
//         cancelBtn.textContent = "Cancel";
//         cancelBtn.style.display = item.bought ? "inline-block" : "none";

//         if (item.bought) {
//             qtyInput.disabled = true;
//         }

//         buyBtn.addEventListener("click", async () => {
//             const qty = Number(qtyInput.value);
//             const res = await fetch(`http://localhost:3000/users/${user.username}/buy`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ id: item.id, quantity: qty })
//             });

//             if (res.ok) {
//                 await fetchUser();
//                 await fetchProducts();
//                 renderProducts();
//                 renderCart();
//             }
//         });

//         cancelBtn.addEventListener("click", async () => {
//             const res = await fetch(`http://localhost:3000/users/${user.username}/buy/${item.id}`, {
//                 method: "DELETE"
//             });
//             if (res.ok) {
//                 await fetchUser();
//                 await fetchProducts();
//                 renderProducts();
//                 renderCart();
//             }
//         });

//         const removeBtn = document.createElement("button");
//         removeBtn.classList.add("cartBtns");
//         removeBtn.type = "button";
//         removeBtn.textContent = "Remove";

//         removeBtn.addEventListener("click", async () => {
//             await fetch(`http://localhost:3000/users/${user.username}/cart/${item.id}`, {
//                 method: "DELETE"
//             });
//             await fetchUser();
//             renderCart();
//             renderProducts();
//         });

//         div.appendChild(qtyInput);
//         div.appendChild(bill);
//         div.appendChild(buyBtn);
//         div.appendChild(cancelBtn);
//         div.appendChild(removeBtn);
//         cartContainer.appendChild(div);
//     });
// }
