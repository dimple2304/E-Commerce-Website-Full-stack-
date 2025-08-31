let name = document.querySelector("#name");
let quantity = document.querySelector("#quantity");
let price = document.querySelector("#price");
let description = document.querySelector("#description");
let imageInput = document.querySelector("#image");
let preview = document.querySelector("#imagePreview");

let inputBoxes = document.querySelector(".inputBoxes");
let addbtn = document.querySelector("#addbtn");
let cancelBtn = document.querySelector("#cancelBtn");

let container = document.querySelector(".container");
let logout = document.querySelector("#logout");

let editMode = false;
let editId = null;

// Pagination variables
let allProducts = [];
let currentPage = 1;
const productsPerPage = 10;
const paginationContainer = document.querySelector(".pagination");

logout.addEventListener("click", () => {
    window.location.href = "../index.html";
});

// Preview image
if (imageInput && preview) {
    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        } else {
            preview.src = "";
            preview.style.display = "none";
        }
    });
}

// Load products from server
async function loadProducts() {
    try {
        const res = await fetch("/products");
        allProducts = await res.json();
        const totalPages = Math.max(1, Math.ceil(allProducts.length / productsPerPage));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        renderPage();
    } catch (err) {
        console.error("Failed to load products:", err);
    }
}

function renderPage() {
    container.innerHTML = "";
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const pageItems = allProducts.slice(start, end);
    pageItems.forEach(addToDom);
    renderPagination();
}

function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(allProducts.length / productsPerPage);

    // Prev button
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "Prev";
    prevBtn.disabled = currentPage === 1;
    if (prevBtn.disabled) {
        prevBtn.style = "background-color:grey; color:#c8c8c8";
    }
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Current page number (only one button)
    const pageBtn = document.createElement("button");
    pageBtn.innerText = currentPage;
    pageBtn.classList.add("active");
    pageBtn.disabled = true; // non-clickable
    paginationContainer.appendChild(pageBtn);

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Next";
    nextBtn.disabled = currentPage === totalPages;
    if (nextBtn.disabled) {
        nextBtn.style = "background-color:grey; color:#c8c8c8";
    }
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });
    paginationContainer.appendChild(nextBtn);
}


addbtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (inputBoxes.style.display === "none" || inputBoxes.style.display === "") {
        inputBoxes.style.display = 'block';
        cancelBtn.style.display = 'block';
        return;
    }

    const nameVal = name.value.trim();
    const quantityVal = parseInt(quantity.value);
    const priceVal = parseInt(price.value);
    const descriptionVal = description.value.trim();
    const imageInputVal = imageInput.value;

    if (!nameVal || !quantityVal || !priceVal || !descriptionVal || !imageInputVal) {
        swal("All fields are required!", "...Please fill all the fields!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("name", nameVal);
        formData.append("quantity", quantityVal);
        formData.append("price", priceVal);
        formData.append("description", descriptionVal);

        let imageFile = imageInput?.files[0] || null;
        if (imageFile) {
            formData.append("image", imageFile);
        }

        let url, method;
        if (editMode) {
            url = `/products/${editId}`;
            method = "PUT";
        } else {
            url = "/adminpage";
            method = "POST";
        }

        const res = await fetch(url, {
            method: method,
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            swal("Congratulations!", "Your product has been listed successfully!", "success");
            loadProducts();
            clearInputs();
        } else {
            console.error(data.message);
        }
    } catch (err) {
        console.error("Error saving product:", err);
    }
});

cancelBtn.addEventListener("click", clearInputs);

function clearInputs() {
    name.value = "";
    quantity.value = "";
    price.value = "";
    description.value = "";
    if (imageInput) imageInput.value = "";
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }
    cancelBtn.style.display = "none";
    inputBoxes.style.display = 'none';
    addbtn.innerText = "List your product now";
    editMode = false;
    editId = null;
}

function addToDom(item) {
    let card = document.createElement("div");
    card.classList.add("flexclass");

    card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ""}
        <p>Name: ${item.name}</p>
        <p>Quantity: ${item.quantity}</p>
        <p>Price: ${item.price}</p>
        <p>Description: ${item.description}</p>
        <div class="cart-button-group">
            <button class="edit-btn" style="background: green; color: white;">Edit</button>
            <button class="delete-btn" style="background: red; color: white;">Delete</button>
        </div>
    `;

    // Edit button handler
    card.querySelector(".edit-btn").addEventListener("click", () => {
        name.value = item.name;
        quantity.value = item.quantity;
        price.value = item.price;
        description.value = item.description;
        editMode = true;
        editId = item.id;
        addbtn.innerText = "Update";
        cancelBtn.style.display = "inline-block";
        inputBoxes.style.display = "block";

        if (preview) {
            preview.src = item.image || "";
            preview.style.display = item.image ? "block" : "none";
        }
        name.focus();
    });

    // Delete from backend
    card.querySelector(".delete-btn").addEventListener("click", async () => {
        // if (confirm(`Delete ${item.name}?`)) {
        try {
            swal({
                title: "Are you sure?",
                text: "Once deleted, you will not be able to recover this product!",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            })
                .then((willDelete) => {
                    if (willDelete) {
                        fetch(`/products/${item.id}`, { method: "DELETE" });
                        card.remove();
                        swal("Poof! Your product has been deleted!", {
                            icon: "success",
                        });
                    } else {
                        swal("Your product is safe!");

                    }
                });

        } catch (err) {
            console.error("Delete failed:", err);
        }
        // }
    });

    container.appendChild(card);
}

loadProducts();
