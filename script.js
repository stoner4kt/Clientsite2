// ===============================
// 1. IMPORTS
// ===============================

import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, getDocs 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { 
    getAuth, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// ===============================
// 2. FIREBASE CONFIG
// ===============================
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
const auth = getAuth(app);

let currentUser = null;

// ===============================
// 3. AUTH STATE
// ===============================
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    const authBtn = document.getElementById("auth-btn");
    if (!authBtn) return;

    if (user) {
        authBtn.innerText = "Logout";
        authBtn.onclick = async () => {
            await signOut(auth);
            window.location.reload();
        };
    } else {
        authBtn.innerText = "Login";
        authBtn.onclick = () => {
            window.location.href = "loginc.html";
        };
    }
});


// ===============================
// 4. LOCAL IMAGE MAPPING
// ===============================
const localImages = {
    "Sgelar The Classic Derby": "assets/img/shoe1.jpg",
    "Sgelar The Classic Derby Junior": "assets/img/shoe1.jpg",
    "Sgelar lace up": "assets/img/shoe2.jpg",
    "Sgelar lace up Junior": "assets/img/shoe2.jpg",
    "Premium T-Bar Buckle": "assets/img/shoe3.jpg",
    "Sgelar Classic Junior": "assets/img/shoe4.jpg",
    "Sgelar Buckle Cross": "assets/img/shoe5.jpg",
    "Premium T-Bar Buckle Junior": "assets/img/shoe11.jpg",
    "Sgelar Classic Girls Junior": "assets/img/shoe4.jpg",
    "Sgelar Water Bottle": "assets/img/bottle3.jpg",
    "Sgelar Combo": "assets/img/combodeal.jpg",
    "Sgelar Bagpack": "assets/img/bag.jpg"
};

// ===============================
// 5. DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    // Mobile navbar
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");
    if (hamburger) hamburger.onclick = () => navLinks.classList.toggle("active");

    // Shop
    const shopGrid = document.getElementById("product-grid");
    if (shopGrid) renderShop(shopGrid);

    // Cart
    const cartItemsDiv = document.getElementById("cart-items");
    if (cartItemsDiv) {
        onAuthStateChanged(auth, (user) => {
            if (user) renderCart(cartItemsDiv);
        });
    }
});

// ===============================
// 6. SHOP RENDER
// ===============================
function renderShop(container) {
    onSnapshot(collection(db, "inventory"), (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = "<p>Loading inventory...</p>";
            return;
        }

        const grouped = {};
        snapshot.forEach(docSnap => {
            const d = docSnap.data();
            if (!grouped[d.name]) {
                grouped[d.name] = {
                    name: d.name,
                    img: localImages[d.name] || "assets/img/placeholder.jpg",
                    description: d.description || "High-quality school gear.",
                    variants: []
                };
            }
            grouped[d.name].variants.push({
                id: docSnap.id,
                size: d.size,
                price: d.price
            });
        });

        container.innerHTML = Object.values(grouped).map(p => {
            const safeId = p.name.replace(/\s+/g, "");
            p.variants.sort((a, b) => a.size - b.size);
            const first = p.variants[0];
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
                        <select id="select-${safeId}" class="size-select"
                                onchange="window.updateUIPrice('${safeId}', this.value)">
                            ${p.variants.map(v =>
                                `<option value="${v.price}" data-size="${v.size}">
                                    Size ${v.size} - R${v.price}
                                </option>`
                            ).join("")}
                        </select>
                    ` : `
                        <input type="hidden" id="select-${safeId}" value="${first.price}" data-size="${first.size}">
                        <div style="height:45px; text-align:center; color:#888;">Standard Size</div>
                    `}

                    <button class="btn add-btn"
                            onclick="window.handleAddToCart('${safeId}', '${p.name}')">
                        Add to Cart
                    </button>
                </div>
            `;
        }).join("");
    });
}

// ===============================
// 7. UI PRICE UPDATE
// ===============================
window.updateUIPrice = (id, price) => {
    document.getElementById(`price-tag-${id}`).innerText = `R${price}`;
};

// ===============================
// 8. ADD TO CART (SECURE)
// ===============================
window.handleAddToCart = async (safeId, fullName) => {
    if (!currentUser) {
        window.location.href = "./loginc.html";
        return; // Added return to stop execution [cite: 25]
    }

    const element = document.getElementById(`select-${safeId}`);
    let price, size;

    // Check if it's a dropdown or a hidden input
    if (element.tagName === "SELECT") {
        const option = element.options[element.selectedIndex];
        price = parseInt(option.value);
        size = option.getAttribute("data-size");
    } else {
        // It's a hidden input for standard sizes 
        price = parseInt(element.value);
        size = element.getAttribute("data-size");
    }

    try {
        await addDoc(
            collection(db, "cart", currentUser.uid, "items"),
            {
                name: fullName,
                price: price,
                size: size,
                createdAt: Date.now()
            }
        );
        alert(`${fullName} added to cart`);
    } catch (e) {
        console.error("Firebase Error:", e);
        alert("Failed to add item to cart. Check your console for permission errors.");
    }
};

// ===============================
// 9. RENDER CART (USER ONLY)
// ===============================
function renderCart(container) {
    onSnapshot(
        collection(db, "cart", currentUser.uid, "items"),
        (snap) => {
            let total = 0;
            container.innerHTML = snap.docs.map(d => {
                const item = d.data();
                total += item.price;
                return `
                    <div class="cart-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;">
                        <div>${item.name} (Size ${item.size})</div>
                        <div>
                            R${item.price}
                            <i class="fas fa-trash" style="color:red; cursor:pointer;"
                               onclick="window.removeFromCart('${d.id}')"></i>
                        </div>
                    </div>
                `;
            }).join("");

            const totalDisplay = document.getElementById("cart-total-final");
            if (totalDisplay) totalDisplay.innerText = total;
        }
    );
}

// ===============================
// 10. REMOVE FROM CART
// ===============================
window.removeFromCart = async (id) => {
    await deleteDoc(doc(db, "cart", currentUser.uid, "items", id));
};

// ===============================
// 11. PAYSTACK CHECKOUT
// ===============================
window.payWithPaystack = async () => {
    if (!currentUser) {
        alert("Please log in to checkout");
        return;
    }

    const totalDisplay = document.getElementById("cart-total-final");
    const total = parseInt(totalDisplay.innerText);

    if (!total || total <= 0) {
        alert("Cart is empty");
        return;
    }

    const handler = PaystackPop.setup({
        key: "pk_test_YOUR_PUBLIC_KEY", // Replace with your key
        email: currentUser.email,
        amount: total * 100, // ZAR in cents
        currency: "ZAR",
        metadata: {
            // This is CRITICAL for the backend to know who paid
            custom_fields: [
                {
                    display_name: "User ID",
                    variable_name: "user_id",
                    value: currentUser.uid
                }
            ]
        },
        callback: async (response) => {
            alert("Payment received! Reference: " + response.reference);
            // Instead of deleting cart here, redirect to a 'processing' or 'success' page
            // Your backend (Step 2) will handle the rest automatically
            window.location.href = "success.html";
        },
        onClose: () => {
            alert("Window closed.");
        }
    });

    handler.openIframe();
};