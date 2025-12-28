import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- FIREBASE CONFIG ---
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

// THIS BLOCK MUST BE AT THE TOP TO ENSURE THE NAV WORKS FIRST
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.onclick = () => {
            navLinks.classList.toggle('active');
            console.log("Menu toggled");
        };
    }

    // --- Countdown Logic ---
    const countdownEl = document.getElementById("countdown");
    if (countdownEl) {
        const countDownDate = new Date("Jan 31, 2026 23:59:59").getTime();
        setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownEl.innerHTML = `SALE ENDS IN: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        }, 1000);
    }
});

// Add this inside your DOMContentLoaded listener in script.js
const banner = document.querySelector('.announcement-banner span');
if (banner) {
    // You could later fetch this string from your Firebase DB!
    banner.innerHTML = "<strong>Update:</strong><span><strong>BACK TO SCHOOL SALE:</strong> Get 10% off all Junior Rugged models! Limited time only.</span> ";
}

const products = [
    { id: 1, name: "Sgelar The Classic Derby", price: 450, img: "assets/img/shoe1.jpg", hasSizes: true },
    { id: 2, name: "Sgelar lace up", price: 350, img: "assets/img/shoe2.jpg", hasSizes: true},
    { id: 3, name: "Premium T-Bar Buckle", price: 350, img: "assets/img/shoe3.jpg", hasSizes: true },
    { id: 4, name: "Tough-Step Lace Up", price: 350, img: "assets/img/shoe4.jpg", hasSizes: true },
    { id: 5, name: "Sgelar Water Bottle ", price: 150, img: "assets/img/bottle3.jpg", hasSizes: false},
    { id: 6, name: "Sgelar Water Bottle ", price: 150, img: "assets/img/bottle1.jpg", hasSizes: false},
    { id: 7, name: " Senior Water Bottle", price: 150, img: "assets/img/bottle2.jpg", hasSizes: false},
    { id: 8, name: "Sgelar Bagpack ", price: 200, img: "assets/img/shoe8.jpg", hasSizes: false},
    { id: 9, name: "Sgelar Combo ", price: 550, img: "assets/img/combodeal.jpg",hasSizes: false },
   
    
    { id: 15, name: "Executive Senior Lace", price: 650, img: "assets/img/shoe15.jpg" }
];

// --- RENDER SHOP ---
const shopGrid = document.getElementById('product-grid');
if (shopGrid) {
    shopGrid.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.img}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200?text=Shoe+Image'">
            <h3>${p.name}</h3>
            <p style="color:var(--yellow); font-weight:bold;">R${p.price}</p>
            
            ${p.hasSizes ? `
            <select id="size-${p.id}" class="size-select" style="width:100%; margin-bottom:10px; padding:8px; border-radius:5px;">
                <option value="3">Size 3</option>
                <option value="4">Size 4</option>
                <option value="5">Size 5</option>
                <option value="6">Size 6</option>
                <option value="7">Size 7</option>
            </select>
            ` : '<div style="height:45px;"></div>'} 
            
            <button class="btn add-btn" data-id="${p.id}" style="width:100%">Add to Cart</button>
        </div>
    `).join('');

    // Re-bind listeners (Keep your existing code here)
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => addToFirebase(parseInt(e.target.dataset.id)));
    });
}

// --- CART ACTIONS ---
async function addToFirebase(id) {
    const p = products.find(prod => prod.id === id);
    
    // Check if the element exists before grabbing the value; otherwise default to "N/A"
    const sizeElement = document.getElementById(`size-${id}`);
    const size = sizeElement ? sizeElement.value : "N/A";

    try {
        await addDoc(collection(db, "cart"), {
            name: p.name,
            price: p.price,
            selectedSize: size,
            timestamp: Date.now()
        });
        alert(`${p.name} added to cart!`);
    } catch (e) { 
        alert("Check Firebase Config!"); 
        console.error(e); 
    }
};

// Listen for cart updates
onSnapshot(collection(db, "cart"), (snap) => {
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = snap.size;

    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        let total = 0;
        let cartData = [];
        cartItemsContainer.innerHTML = snap.empty ? "<p>Your cart is empty.</p>" : "";

        snap.forEach(d => {
            const item = d.data();
            total += item.price;
            cartData.push(item);
            cartItemsContainer.innerHTML += `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div>
                        <h4>${item.name}</h4>
                        <small>Size: ${item.selectedSize} | R${item.price}</small>
                    </div>
                    <button class="btn remove-btn" data-docid="${d.id}" style="background:red; padding:8px 15px;">Remove</button>
                </div>
            `;
        });

        document.getElementById('cart-total').innerText = total;
        document.getElementById('cart-total-final').innerText = total;

        // Re-bind remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => deleteDoc(doc(db, "cart", btn.dataset.docid));
        });

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) checkoutBtn.onclick = () => generatePDF(cartData, total);
    }
});

// PDF Generation
async function generatePDF(cartData, total) {
    const template = document.getElementById('receipt-template');
    if (!template) return;

    document.getElementById('r-date').innerText = new Date().toLocaleDateString();
    document.getElementById('r-id').innerText = Math.floor(Math.random() * 90000) + 10000;
    document.getElementById('r-total-amount').innerText = total;
    
    document.getElementById('r-items-body').innerHTML = cartData.map(item => `
        <tr>
            <td style="padding:10px; border:1px solid #ddd;">${item.name}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:center;">${item.selectedSize}</td>
        </tr>
    `).join('');

    template.style.display = "block";
    html2pdf().set({ margin: 0.5, filename: 'Sgelar_Receipt.pdf' }).from(template).save().then(() => {
        template.style.display = "none";
    });
}
    // --- PAYSTACK PAYMENT GATEWAY ---
// --- SECURE PAYSTACK INTEGRATION ---
window.payWithPaystack = async () => {
    // 1. Recalculate total from the database, not the HTML (Prevents manipulation)
    const querySnapshot = await getDocs(collection(db, "cart"));
    let totalRand = 0;
    
    querySnapshot.forEach((doc) => {
        totalRand += doc.data().price;
    });

    if (totalRand <= 0) {
        alert("Your cart is empty!");
        return;
    }

    const email = prompt("Please enter your email for the receipt:");
    if (!email || !email.includes('@')) {
        alert("A valid email is required.");
        return;
    }

    // 2. Convert Rands to Cents (Paystack requirement)
    // Example: R450.00 becomes 45000
    const totalCents = Math.round(totalRand * 100);

    const handler = PaystackPop.setup({
        key: 'pk_test_PASTE_CLIENT_TEST_KEY_HERE', 
        email: email,
        amount: totalCents, // Sending the cents value
        currency: 'ZAR',
        callback: async (response) => {
            console.log("Payment successful. Ref:", response.reference);
            
            // Clear the cart in Firebase after successful payment
            const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "cart", d.id)));
            await Promise.all(deletePromises);
            
            // Redirect to success page
            window.location.href = `success.html?ref=${response.reference}&email=${email}`;
        },
        onClose: () => {
            alert('Transaction cancelled.');
        }
    });

    handler.openIframe();
};

// Helper function to clear the cart in Firestore
async function clearFirebaseCart() {
    try {
        const cartRef = collection(db, "cart");
        const snapshot = await getDocs(cartRef); // You'll need to add 'getDocs' to your Firestore imports
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "cart", d.id)));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error clearing cart:", error);
    }
}
// --- STAR RATING LOGIC ---
let selectedRating = 0;
const stars = document.querySelectorAll('.star-rating i');
stars.forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = star.dataset.value;
        stars.forEach(s => s.classList.remove('active'));
        for(let i=0; i < selectedRating; i++) stars[i].classList.add('active');
    });
});

// --- SUBMIT REVIEW ---
const reviewForm = document.getElementById('review-form');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('rev-name').value;
        const text = document.getElementById('rev-text').value;

        if(selectedRating === 0) return alert("Please select a star rating!");

        try {
            await addDoc(collection(db, "reviews"), {
                name, text, rating: selectedRating, timestamp: Date.now()
            });
            alert("Review posted! Thank you.");
            reviewForm.reset();
            stars.forEach(s => s.classList.remove('active'));
        } catch (err) { console.error(err); }
    });
}

// --- LOAD REVIEWS INTO CAROUSEL ---
const reviewsContainer = document.getElementById('reviews-container');
if (reviewsContainer) {
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        reviewsContainer.innerHTML = snapshot.docs.map(doc => {
            const r = doc.data();
            const starHTML = '<i class="fas fa-star"></i>'.repeat(r.rating);
            return `
                <div class="swiper-slide">
                    <div class="review-card">
                        <div class="stars-display">${starHTML}</div>
                        <p>"${r.text}"</p>
                        <h4>- ${r.name}</h4>
                    </div>
                </div>`;
        }).join('');

        // Initialize Swiper
        new Swiper('.review-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: { el: '.swiper-pagination', clickable: true },
            breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
            autoplay: { delay: 4000 }
        });
    });
}