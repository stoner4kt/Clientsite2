import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getFirestore, collection, onSnapshot, updateDoc, doc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- SGELAR FIREBASE CONFIG ---
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
const auth = getAuth(app);
const db = getFirestore(app);

// --- 1. AUTH CHECK ---
const ADMIN_EMAIL = "sgelarshoes@gamil.com"; // 🔁 same email as rules

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("Access denied");
        window.location.href = "index.html";
        return;
    }

    console.log("Admin verified:", user.email);
    loadInventory();
    loadOrders();
});


// --- 2. LOAD INVENTORY ---
function loadInventory() {
    const tableBody = document.getElementById('inventory-list');
    
    // Listen to changes in the 'inventory' collection
    onSnapshot(collection(db, "inventory"), (snap) => {
        tableBody.innerHTML = "";
        snap.forEach((d) => {
            const item = d.data();
            const id = d.id; // Usually in format '1-7'
            
            tableBody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>Size ${item.size}</td>
                    <td><input type="number" id="p-${id}" value="${item.price}"></td>
                    <td><input type="number" id="s-${id}" value="${item.stock}"></td>
                    <td>
                        <button onclick="window.updateProduct('${id}')" class="btn" style="padding: 5px 15px; font-size: 12px;">Save</button>
                    </td>
                </tr>
            `;
        });
    });
}

// --- 3. UPDATE PRODUCT (PRICE/STOCK) ---
window.updateProduct = async (docId) => {
    const newPrice = document.getElementById(`p-${docId}`).value;
    const newStock = document.getElementById(`s-${docId}`).value;

    try {
        const itemRef = doc(db, "inventory", docId);
        await updateDoc(itemRef, {
            price: Number(newPrice),
            stock: Number(newStock)
        });
        alert("Update Successful!");
    } catch (e) {
        console.error("Update failed:", e);
        alert("Error: Admin permissions required.");
    }
};

// --- 4. SALES STATS ---
function loadOrders() {
    const revEl = document.getElementById('stat-revenue');
    const orderEl = document.getElementById('stat-orders');

    onSnapshot(collection(db, "orders"), (snap) => {
        let total = 0;
        snap.forEach(d => {
            total += (d.data().amount || 0);
        });
        revEl.innerText = `R${total}`;
        orderEl.innerText = snap.size;
    });
}

// --- 5. LOGOUT ---
window.logoutAdmin = () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
};