import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import Joi from 'joi';
import session from 'express-session';
import multer from 'multer';
import errorHandler from './middlewares/errorHandler.js';
import { EMAIL_USER, EMAIL_PASS } from './config/index.js';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/adminPanel", express.static(path.join(__dirname, "public/adminPanel")));
app.use("/userPanel", express.static(path.join(__dirname, "public/userPanel")));
app.use("/", express.static(path.join(__dirname, "public")));

app.set('trust proxy', 1);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

// Helpers
function readUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
    catch { return []; }
}
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function readProducts() {
    try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')); }
    catch { return []; }
}
function writeProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// === OTP Endpoint ===
app.post("/send-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Missing email or OTP" });

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `E-commerce <${EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            html: `<p>Your OTP is: <b>${otp}</b></p>`
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Email sending failed:", err.message);
        res.status(500).json({ success: false, message: "OTP sending failed" });
    }
});

// === Signup ===
app.post('/signup', (req, res) => {
    const registerSchema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
        repeat_password: Joi.ref('password'),
        role: Joi.string().valid('admin', 'user').default('user')
    });

    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { username, email, password, role } = req.body;
    const users = readUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        role,
        cart: [],
        itemsBought: []
    };

    users.push(newUser);
    writeUsers(users);

    req.session.isLoggedIn = true;
    req.session.role = role;
    req.session.username = username;

    const redirectURL = role === "admin"
        ? `/adminPanel/products.html?user=${username}`
        : `/userPanel/index.html?user=${username}`;
    res.json({ success: true, redirect: redirectURL });
});

// === Login ===
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    req.session.isLoggedIn = true;
    req.session.role = user.role;
    req.session.username = user.username;

    const redirectURL = user.role === "admin"
        ? `/adminPanel/products.html?user=${user.username}`
        : `/userPanel/index.html?user=${user.username}`;

    res.json({ success: true, redirect: redirectURL });
});

// === Session Info ===
app.get('/user', (req, res) => {
    if (!req.session.isLoggedIn) return res.status(401).json({ success: false, message: 'Not logged in' });
    res.json({ success: true, username: req.session.username, role: req.session.role });
});

/* Admin Routes */
app.get('/products', (req, res) => res.json(readProducts()));

// Admin add/update product
app.post('/adminpage', upload.single("image"), (req, res) => {
    const { name, quantity, price, description } = req.body;
    if (!name || !quantity || !price || !description) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const products = readProducts();
    const existingProduct = products.find(p => p.name.toLowerCase() === name.trim().toLowerCase());

    let imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (existingProduct) {
        existingProduct.quantity += Number(quantity);
        existingProduct.price = Number(price);
        existingProduct.description = description.trim();
        if (imagePath) existingProduct.image = imagePath;
        writeProducts(products);
        return res.json({ success: true, message: 'Product updated successfully', product: existingProduct });
    }

    const newProduct = {
        id: Date.now(),
        name: name.trim(),
        quantity: Number(quantity),
        price: Number(price),
        description: description.trim(),
        image: imagePath
    };

    products.push(newProduct);
    writeProducts(products);
    res.json({ success: true, message: 'Product added successfully', product: newProduct });
});

// Update product
app.put('/products/:id', upload.single("image"), (req, res) => {
    const { id } = req.params;
    const { name, quantity, price, description, image } = req.body;

    let products = readProducts();
    const productIndex = products.findIndex(p => p.id == id);
    if (productIndex === -1) return res.status(404).json({ success: false, message: "Product not found" });

    let imagePath = req.file ? `/uploads/${req.file.filename}` : products[productIndex].image;

    products[productIndex] = {
        ...products[productIndex],
        name: name.trim(),
        quantity: Number(quantity),
        price: Number(price),
        description: description.trim(),
        image: imagePath
    };

    writeProducts(products);
    res.json({ success: true, message: "Product updated successfully", product: products[productIndex] });
});

// Delete product
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    let products = readProducts();
    const productToDelete = products.find(p => p.id == id || p.id === Number(id));

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete image from uploads if it exists
    if (productToDelete.image && productToDelete.image.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, productToDelete.image);
        fs.unlink(imagePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error("Error deleting image file:", err);
            }
        });
    }

    // Remove product from the list
    const newProducts = products.filter(p => p.id != id && p.id !== Number(id));
    writeProducts(newProducts);

    res.json({ success: true, message: "Product and image deleted successfully" });
});


/* User Routes */
app.get('/users/:username', (req, res) => {
    const { username } = req.params;
    const users = readUsers();
    const user = users.find(u => u.username === username || u.email === username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

// Add to cart with image
app.post('/users/:username/cart', (req, res) => {
    const { username } = req.params;
    const { id, price } = req.body;

    if (!id || !price) {
        return res.status(400).json({ message: 'Missing id or price' });
    }

    const users = readUsers();
    const products = readProducts();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.cart.some(i => i.id == id)) {
        return res.status(400).json({ message: 'Item already in cart' });
    }

    const product = products.find(p => p.id == id);
    const image = product ? product.image : null;

    user.cart.push({ id, price, quantity: 1, bought: false, image });
    writeUsers(users);
    res.status(200).json({ message: 'Item added to cart', cart: user.cart });
});

// Remove from cart
app.delete('/users/:username/cart/:id', (req, res) => {
    const { username, id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cart = user.cart.filter(item => item.id != id);
    writeUsers(users);
    res.status(200).json({ message: 'Item removed from cart' });
});

// Buy product
app.post('/users/:username/buy', (req, res) => {
    const { username } = req.params;
    const { id, quantity } = req.body;

    const users = readUsers();
    const products = readProducts();

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = products.find(p => p.id == id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }
    if (product.quantity < qty) {
        return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.quantity -= qty;

    const cartItem = user.cart.find(i => i.id == id);
    if (cartItem) {
        cartItem.bought = true;
        cartItem.purchasedQuantity = qty;
    }

    if (!user.itemsBought.some(i => i.id == id)) {
        user.itemsBought.push({ id, quantity: qty });
    }

    writeUsers(users);
    writeProducts(products);
    res.status(200).json({ message: 'Item bought successfully', cart: user.cart, itemsBought: user.itemsBought });
});

// Cancel order
app.delete('/users/:username/buy/:id', (req, res) => {
    const { username, id } = req.params;
    const users = readUsers();
    const products = readProducts();

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const cartItem = user.cart.find(item => item.id == id && item.bought);
    if (!cartItem) return res.status(404).json({ message: 'Order not found' });

    const product = products.find(p => p.id == id);
    if (product) {
        product.quantity += cartItem.purchasedQuantity || 0;
    }

    cartItem.bought = false;
    delete cartItem.purchasedQuantity;

    user.itemsBought = user.itemsBought.filter(i => i.id != id);

    writeUsers(users);
    writeProducts(products);

    res.status(200).json({ message: 'Order cancelled', cart: user.cart, itemsBought: user.itemsBought });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
