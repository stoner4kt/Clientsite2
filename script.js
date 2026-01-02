import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, getDocs, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBjnfrqymhhE88LkFBIrC7tvV7YyXRCTh4",
    authDomain: "sgelar-web-store.firebaseapp.com",
    projectId: "sgelar-web-store",
    storageBucket: "sgelar-web-store.firebasestorage.app",
    messagingSenderId: "984584108456",
    appId: "1:984584108456:web:51ca48c53cbf16d459059d",
    measurementId: "G-Q0FD7RSMQQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. LOCAL IMAGE MAPPING ---
// This connects the names in your Firebase to the files in your local folder.
const localImages = {
    "Sgelar The Classic Derby": "assets/img/shoe1.jpg",
    "Sgelar lace up": "assets/img/shoe2.jpg",
    "Premium T-Bar Buckle": "assets/img/shoe3.jpg",
    "Sgelar Classic Junior": "assets/img/shoe4.jpg",
    "Sgelar Buckle Cross Junior": "assets/img/shoe5.jpg",
    "Premium T-Bar Buckle Junior": "assets/img/shoe6.jpg", 
    
    
    "Sgelar Classic Girls Junior": "assets/img/shoe4.jpg",
    "Sgelar Water Bottle": "assets/img/bottle3.jpg",
    "Sgelar Combo": "assets/img/combodeal.jpg",
    "Sgelar Bagpack": "assets/img/bag.jpg"
};

// --- 3. UI & NAVIGATION INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navbar Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger) {
        hamburger.onclick = () => navLinks.classList.toggle('active');
    }

    // Initialize Shop Grid
    const shopGrid = document.getElementById('product-grid');
    if (shopGrid) renderShop(shopGrid);

    // Initialize Cart Display
    const cartItemsDiv = document.getElementById('cart-items');
    if (cartItemsDiv) renderCart(cartItemsDiv);

    // Global Cart Count Update
    onSnapshot(collection(db, "cart"), (snap) => {
        const count = document.getElementById('cart-count');
        if (count) count.innerText = snap.size;
    });
});

// --- 4. SHOP RENDERING (FIREBASE DATA + LOCAL IMAGES) ---
function renderShop(container) {
    onSnapshot(collection(db, "inventory"), (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = "<p>Connecting to inventory...</p>";
            return;
        }

        const grouped = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const name = data.name;

            if (!grouped[name]) {
                grouped[name] = {
                    name: name,
                    img: localImages[name] || "assets/img/placeholder.jpg",
                    description: data.description || "High-quality school gear.",
                    variants: []
                };
            }
            grouped[name].variants.push({ id: doc.id, size: data.size, price: data.price });
        });

        container.innerHTML = Object.values(grouped).map(p => {
            const safeId = p.name.replace(/\s+/g, '');
            p.variants.sort((a, b) => a.size - b.size);
            const first = p.variants[0];

            // --- THE FIX IS HERE ---
            // We check if there's more than 1 variant to decide whether to show the dropdown
            const hasMultipleSizes = p.variants.length > 1;

            return `
                <div class="card">
                    <div class="image-container">
                        <img src="${p.img}" alt="${p.name}">
                        <div class="hover-description">${p.description}</div>
                    </div>
                    <h3>${p.name}</h3>
                    <p class="price-tag" id="price-tag-${safeId}" style="color:var(--yellow); font-weight:bold;">
                        R${first.price}
                    </p>

                    ${hasMultipleSizes ? `
                        <select class="size-select" id="select-${safeId}" 
                                onchange="window.updateUIPrice('${safeId}', this.value)" 
                                style="width:100%; margin-bottom:10px; padding:8px; background:#222; color:white;">
                            ${p.variants.map(v => `<option value="${v.price}" data-size="${v.size}">Size ${v.size} - R${v.price}</option>`).join('')}
                        </select>
                    ` : `
                        <input type="hidden" id="select-${safeId}" value="${first.price}" data-size="${first.size}">
                        <div style="height: 45px; display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.8rem;">
                            Standard Size
                        </div>
                    `}

                    <button class="btn add-btn" onclick="window.handleAddToCart('${safeId}', '${p.name}')" style="width:100%">
                        Add to Cart
                    </button>
                </div>
            `;
        }).join('');
    });
}

// --- 5. CART & PAYMENT LOGIC ---
window.updateUIPrice = (id, price) => {
    document.getElementById(`price-tag-${id}`).innerText = `R${price}`;
};

window.handleAddToCart = async (safeId, fullName) => {
    const select = document.getElementById(`select-${safeId}`);
    const selectedOption = select.options[select.selectedIndex];
    
    try {
        await addDoc(collection(db, "cart"), {
            name: fullName,
            price: parseInt(selectedOption.value),
            size: selectedOption.getAttribute('data-size'),
            timestamp: Date.now()
        });
        alert(`${fullName} added to cart!`);
    } catch (e) { console.error("Error adding to cart:", e); }
};

function renderCart(container) {
    onSnapshot(collection(db, "cart"), (snap) => {
        let total = 0;
        container.innerHTML = snap.docs.map(doc => {
            const item = doc.data();
            total += item.price;
            return `
                <div class="cart-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;">
                    <div>${item.name} (Size ${item.size})</div>
                    <div>R${item.price} <i class="fas fa-trash" style="color:red; cursor:pointer;" onclick="window.removeFromCart('${doc.id}')"></i></div>
                </div>
            `;
        }).join('');
        const totalDisplay = document.getElementById('cart-total-final');
        if (totalDisplay) totalDisplay.innerText = total;
    });
}

window.removeFromCart = async (id) => {
    await deleteDoc(doc(db, "cart", id));
};

window.payWithPaystack = async () => {
    const total = parseInt(document.getElementById('cart-total-final').innerText);
    if (total <= 0) return alert("Cart is empty!");

    const email = prompt("Enter your email for receipt:");
    if (!email) return;

    const handler = PaystackPop.setup({
        key: 'pk_test_YOUR_ACTUAL_KEY', // <--- REPLACE THIS WITH YOUR PAYSTACK KEY
        email: email,
        amount: total * 100,
        currency: 'ZAR',
        callback: async (response) => {
            // Clear cart
            const snapshot = await getDocs(collection(db, "cart"));
            snapshot.docs.forEach(async (d) => await deleteDoc(doc(db, "cart", d.id)));
            alert("Payment successful! Ref: " + response.reference);
            window.location.href = "index.html";
        }
    });
    handler.openIframe();
};