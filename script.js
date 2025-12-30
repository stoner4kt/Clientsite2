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
   
    
    { id: 15, name: "New Product Coming ", price: 100, img: "assets/img/shoe15.jpg" }
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
     .       </select>
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
        if (checkoutBtn) checkoutBtn.onclick = () => window.payWithPaystack();
    }
});




    // --- PAYSTACK PAYMENT GATEWAY ---
// --- SECURE PAYSTACK INTEGRATION ---
window.payWithPaystack = async () => {
    // 1. Capture Form Inputs
    const name = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;

    // 2. Simple Validation
    if (!name || !email || !phone || !address) {
        alert("Please fill in all delivery details.");
        return;
    }

    const querySnapshot = await getDocs(collection(db, "cart"));
    let totalRand = 0;
    let itemsPurchased = "";

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRand += data.price;
        itemsPurchased += `${data.name} (Size: ${data.selectedSize}), `;
    });

    if (totalRand <= 0) {
        alert("Your cart is empty!");
        return;
    }

    // 2. Convert Rands to Cents (Paystack requirement)
    // Example: R450.00 becomes 45000
    const totalCents = Math.round(totalRand * 100);

    const handler = PaystackPop.setup({
        key: 'pk_test_PASTE_CLIENT_TEST_KEY_HERE', 
        email: email,
        amount: totalCents, // Sending the cents value
        currency: 'ZAR',metadata: {
            custom_fields: [
                { display_name: "Customer Name", variable_name: "customer_name", value: name },
                { display_name: "Phone Number", variable_name: "phone_number", value: phone },
                { display_name: "Delivery Address", variable_name: "delivery_address", value: address },
                { display_name: "Items", variable_name: "items", value: itemsPurchased }
            ]
        },
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


// --- UNIFIED REVIEW LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Star Rating Selection Logic
    let selectedRating = 0;
    const stars = document.querySelectorAll('.star-rating i');
    
    stars.forEach(star => {
        star.onclick = () => {
            selectedRating = star.getAttribute('data-value');
            // Visual feedback: color the stars yellow when clicked
            stars.forEach(s => {
                s.style.color = s.getAttribute('data-value') <= selectedRating ? '#ffcc00' : '#444';
            });
        };
    });

    // 2. Submit Review to Firebase
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (selectedRating === 0) return alert("Please select a star rating!");

            const name = document.getElementById('rev-name').value;
            const text = document.getElementById('rev-text').value;

            try {
                await addDoc(collection(db, "reviews"), {
                    customerName: name,
                    comment: text,
                    rating: parseInt(selectedRating),
                    timestamp: Date.now()
                });
                alert("Review posted successfully!");
                reviewForm.reset();
                selectedRating = 0;
                stars.forEach(s => s.style.color = '#444');
            } catch (error) {
                console.error("Review Error:", error);
            }
        };
    }

    // 3. Live Review Feed (Swiper compatible)
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => {
            reviewsContainer.innerHTML = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                const slide = `
                    <div class="swiper-slide">
                        <div class="review-card" style="background:#2a2a2a; padding:20px; border-radius:10px; border:1px solid #ffcc00; min-height:150px;">
                            <div style="color:#ffcc00; margin-bottom:10px;">${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}</div>
                            <p style="color:white; font-style:italic;">"${data.comment}"</p>
                            <h4 style="color:#ffcc00; margin-top:10px;">- ${data.customerName}</h4>
                        </div>
                    </div>`;
                reviewsContainer.insertAdjacentHTML('beforeend', slide);
            });
            
            // Initialize Swiper after data is loaded
            new Swiper('.review-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                pagination: { el: '.swiper-pagination', clickable: true },
                autoplay: { delay: 4000 },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                }
            });
        });
    }
});