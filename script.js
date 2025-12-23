import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- FIREBASE CONFIGURATION (Placeholder) ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 15 PRODUCT DATABASE ---
const products = [
    { id: 1, name: "Sgelar Classic Oxford", price: 450, img: "assets/img/shoe1.webp" },
    { id: 2, name: "Sgelar Velcro Junior", price: 380, img: "assets/img/shoe2.webp" },
    { id: 3, name: "Premium T-Bar Buckle", price: 490, img: "assets/img/shoe3.webp" },
    { id: 4, name: "Tough-Step Lace Up", price: 520, img: "assets/img/shoe4.webp" },
    { id: 5, name: "Sgelar Mary Jane", price: 430, img: "assets/img/shoe5.webp" },
    { id: 6, name: "Active Sport School", price: 400, img: "assets/img/shoe6.webp" },
    { id: 7, name: "Formal Senior Derby", price: 600, img: "assets/img/shoe7.jpg" },
    { id: 8, name: "Sgelar Slip-On Ease", price: 350, img: "assets/img/shoe8.jpg" },
    { id: 9, name: "Junior Rugged Sole", price: 410, img: "assets/img/shoe9.jpg" },
    { id: 10, name: "Classic Monk Strap", price: 550, img: "assets/img/shoe10.jpg" },
    { id: 11, name: "High-Shine Formal", price: 580, img: "assets/img/shoe11.jpg" },
    { id: 12, name: "Velcro Play-Safe", price: 370, img: "assets/img/shoe12.jpg" },
    { id: 13, name: "Sgelar Comfort Arch", price: 480, img: "assets/img/shoe13.jpg" },
    { id: 14, name: "Standard Issue Black", price: 320, img: "assets/img/shoe14.jpg" },
    { id: 15, name: "Executive Senior Lace", price: 650, img: "assets/img/shoe15.jpg" }
];

// --- CORE UI LOGIC ---

// Hamburger Toggle
document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('active');
});

// Render Shop Page
const shopGrid = document.getElementById('product-grid');
if (shopGrid) {
    products.forEach(p => {
        shopGrid.innerHTML += `
            <div class="card">
                <img src="${p.img}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200?text=Shoe+Image'">
                <h3>${p.name}</h3>
                <p style="color:var(--yellow); font-weight:bold;">R${p.price}</p>
                <select id="size-${p.id}" class="size-select" style="width:100%; background:#2a2a2a; color:white; border:1px solid var(--yellow); padding:8px; border-radius:5px; margin-bottom:10px;">
                    <option value="3">Size 3</option>
                    <option value="4">Size 4</option>
                    <option value="5">Size 5</option>
                    <option value="6">Size 6</option>
                    <option value="7">Size 7</option>
                </select>
                <button class="btn" style="width:100%" onclick="addToFirebase(${p.id})">Add to Cart</button>
            </div>
        `;
    });
}

// --- FIREBASE CART LOGIC ---

// Add to Cart
window.addToFirebase = async (id) => {
    const p = products.find(prod => prod.id === id);
    const size = document.getElementById(`size-${id}`).value;
    try {
        await addDoc(collection(db, "cart"), {
            name: p.name,
            price: p.price,
            selectedSize: size,
            timestamp: Date.now()
        });
        alert(`${p.name} added to cart!`);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

// Real-time Cart Listener
const cartItemsContainer = document.getElementById('cart-items');
onSnapshot(collection(db, "cart"), (snap) => {
    // Update Cart Count in Nav
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = snap.size;

    // Update Cart Page if user is on it
    if (cartItemsContainer) {
        let total = 0;
        let cartData = [];
        cartItemsContainer.innerHTML = "";

        if (snap.empty) {
            cartItemsContainer.innerHTML = "<p style='text-align:center;'>Your cart is empty.</p>";
        }

        snap.forEach(d => {
            const item = d.data();
            total += item.price;
            cartData.push(item);
            cartItemsContainer.innerHTML += `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--dark-grey);">
                    <div>
                        <h4 style="margin:0;">${item.name}</h4>
                        <small style="color:var(--yellow)">Size: ${item.selectedSize} | Price: R${item.price}</small>
                    </div>
                    <button class="btn" style="background:red; padding:8px 15px;" onclick="removeItem('${d.id}')">Remove</button>
                </div>
            `;
        });

        document.getElementById('cart-total').innerText = total;
        document.getElementById('cart-total-final').innerText = total;

        // Setup Checkout Button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => generatePDF(cartData, total);
        }
    }
});

// Remove Item
window.removeItem = async (id) => {
    await deleteDoc(doc(db, "cart", id));
};

// --- PDF RECEIPT GENERATION ---
async function generatePDF(cartData, total) {
    const template = document.getElementById('receipt-template');
    const itemsBody = document.getElementById('r-items-body');
    
    // Fill Template Data
    document.getElementById('r-date').innerText = new Date().toLocaleDateString();
    document.getElementById('r-id').innerText = Math.floor(Math.random() * 90000) + 10000;
    document.getElementById('r-total-amount').innerText = total;
    
    itemsBody.innerHTML = "";
    cartData.forEach(item => {
        itemsBody.innerHTML += `
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">${item.name}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">${item.selectedSize}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">R${item.price}</td>
            </tr>
        `;
    });

    const options = {
        margin: 0.5,
        filename: `Sgelar_Order_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    template.style.display = "block"; // Show to capture
    html2pdf().set(options).from(template).save().then(() => {
        template.style.display = "none"; // Hide after capture
        alert("Receipt downloaded successfully!");
    });
}

// Countdown Timer for Home Page
function runCountdown() {
    const deadline = new Date("Jan 15, 2026 00:00:00").getTime();
    const timerBox = document.getElementById("countdown");
    if (!timerBox) return;

    setInterval(() => {
        const now = new Date().getTime();
        const t = deadline - now;
        const d = Math.floor(t / (1000 * 60 * 60 * 24));
        const h = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timerBox.innerText = `Back To School Sale Ends In: ${d}d ${h}h`;
    }, 1000);
}
runCountdown();