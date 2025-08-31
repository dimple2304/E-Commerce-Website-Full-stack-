const cartContainer = document.querySelector(".cartContainer");
const logoutBtn = document.querySelector("#logoutBtn");
const welcome = document.querySelector("#welcome");
const backToProductsBtn = document.querySelector("#backToProductsBtn");

let username = new URLSearchParams(window.location.search).get("user");
let user = null;
let products = [];

window.onload = async () => {
    if (!username) return (window.location.href = "../index.html");
    await fetchUser();
    await fetchProducts();
    renderCart();
};

logoutBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});

backToProductsBtn.addEventListener("click", () => {
    window.location.href = `index.html?user=${encodeURIComponent(username)}`;
});

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

function renderCart() {
    cartContainer.innerHTML = "";

    if (!user.cart || user.cart.length === 0) {
        cartContainer.textContent = "Your cart is empty!";
        return;
    }

    user.cart.forEach((item) => {
        const productDetails = products.find(p => p.id === item.id);
        if (!productDetails) return;

        const div = document.createElement("div");
        div.className = "userCart";

        div.innerHTML = `
            ${productDetails.image ? `<img src="${productDetails.image}" alt="${productDetails.name}">` : ""}
            <p>Name: ${productDetails.name}</p>
            <p>Price: $${productDetails.price}</p>
            <p>Description: ${productDetails.description}</p>
        `;

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = 1;
        qtyInput.max = productDetails.quantity + (item.purchasedQuantity || 0);
        qtyInput.value = item.purchasedQuantity || item.quantity;

        const bill = document.createElement("p");
        bill.innerText = "Bill: " + qtyInput.value * parseInt(productDetails.price) + "$";

        qtyInput.addEventListener("input", function () {
            if (parseInt(qtyInput.value) > productDetails.quantity) {
                qtyInput.value = productDetails.quantity;
            }
            const updatedQty = parseInt(qtyInput.value) || 0;
            bill.innerText = "Bill: " + updatedQty * parseInt(productDetails.price) + "$";
        });

        const buyBtn = document.createElement("button");
        buyBtn.classList.add("cartBtns");
        buyBtn.type = "button";
        buyBtn.textContent = item.bought ? "Buy more" : "Buy now";
        // buyBtn.disabled = item.bought;

        const cancelBtn = document.createElement("button");
        cancelBtn.classList.add("cartBtns");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.display = item.bought ? "inline-block" : "none";

        // if (item.bought) {
        //     qtyInput.disabled = true;
        // }

        buyBtn.addEventListener("click", async () => {
            const qty = Number(qtyInput.value);
            const res = await fetch(`http://localhost:3000/users/${user.username}/buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, quantity: qty })
            });

            if (res.ok) {
                swal("Order placed!", "You can cancel order at any time!", "success");
                await fetchUser();
                await fetchProducts();
                renderCart();
            }
        });

        cancelBtn.addEventListener("click", async () => {
            swal({
                title: "Are you sure?",
                text: "Once cancelled, you can order again anytime.",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then(async (willDelete) => {
                if (willDelete) {
                    const res = await fetch(`http://localhost:3000/users/${user.username}/buy/${item.id}`, {
                        method: "DELETE"
                    });
                    if (res.ok) {
                        await fetchUser();
                        await fetchProducts();
                        renderCart();
                        swal("Poof! Your order has been cancelled!", { icon: "success" });
                    } else {
                        swal("Failed to cancel order!", { icon: "error" });
                    }
                } else {
                    swal("Your order is safe!");
                }
            });
        });


        const removeBtn = document.createElement("button");
        removeBtn.classList.add("cartBtns");
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";

        removeBtn.addEventListener("click", async () => {
            swal({
                title: "Are you sure?",
                text: "Confirm, if you want to remove product from cart.",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then(async (willDelete) => {
                if (willDelete) {
                    const res = await fetch(`http://localhost:3000/users/${user.username}/cart/${item.id}`, {
                        method: "DELETE"
                    });
                    if (res.ok) {
                        await fetchUser();
                        // await fetchProducts();
                        renderCart();
                        swal("Poof! Your product has been removed from cart!", { icon: "success" });
                    } else {
                        swal("Failed to remove from cart!", { icon: "error" });
                    }
                } else {
                    swal("Your cart is safe!");
                }
            });
            // await fetch(`http://localhost:3000/users/${user.username}/cart/${item.id}`, {
            //     method: "DELETE"
            // });
            // await fetchUser();
            // renderCart();
        });

        div.appendChild(qtyInput);
        div.appendChild(bill);

        const cartActions = document.createElement("div");
        cartActions.className = "cartActions";
        cartActions.appendChild(buyBtn);
        cartActions.appendChild(cancelBtn);
        cartActions.appendChild(removeBtn);

        div.appendChild(cartActions);

        cartContainer.appendChild(div);
    });
}
