// 1. Konfigurasi Firebase khusus untuk proyek OurBank milikmu
const firebaseConfig = {
  apiKey: "AIzaSyBEa7PEyK49uVIRyUweey36Ii3clVioybY",
  authDomain: "ourbank-59dc3.firebaseapp.com",
  databaseURL: "https://ourbank-59dc3-default-rtdb.firebaseio.com",
  projectId: "ourbank-59dc3",
  storageBucket: "ourbank-59dc3.firebasestorage.app",
  messagingSenderId: "272624267730",
  appId: "1:272624267730:web:36bcc4272eecb30444980b",
  measurementId: "G-ZSC4E26MWH"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TARGET_TABUNGAN = 50000; // Target default: Rp 10.000.000
let currentUser = null;

// PIN Sederhana
const USER_PINS = {
  "Adam": "adam1306",
  "Nadine": "nadine1306"
};

// --- LOGIKA LOGIN & LOGOUT ---
function login() {
  const userSelect = document.getElementById("username").value;
  const pinInput = document.getElementById("password").value;
  const errorElement = document.getElementById("login-error");

  if (USER_PINS[userSelect] === pinInput) {
    currentUser = userSelect;
    document.getElementById("user-display").innerText = currentUser;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("dashboard-screen").classList.remove("hidden");
    
    // Mulai mendengarkan perubahan data dari Firebase secara Realtime
    listenToData();
  } else {
    errorElement.innerText = "PIN salah! Coba lagi.";
  }
}

function logout() {
  currentUser = null;
  document.getElementById("password").value = "";
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("dashboard-screen").classList.add("hidden");
}

// --- LOGIKA FIREBASE REALTIME ---
function listenToData() {
  const savingsRef = db.ref("savings_history");

  savingsRef.on("value", (snapshot) => {
    const data = snapshot.val();
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";

    if (!data) {
      historyList.innerHTML = '<li class="empty-state">Belum ada setoran.</li>';
      updateSummary(0, 0);
      return;
    }

    let totalSaldo = 0;
    let totalMingguIni = 0;
    
    // Menghitung awal minggu ini (Senin/Minggu)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    // Ambil data dan urutkan agar transaksi terbaru muncul di atas
    const items = Object.values(data).reverse();

    items.forEach((item) => {
      const nominal = parseInt(item.amount);
      totalSaldo += nominal;

      const itemDate = new Date(item.timestamp);
      if (itemDate >= startOfWeek) {
        totalMingguIni += nominal;
      }

      // Format tanggal ke Bahasa Indonesia
      const formattedDate = itemDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      // Render daftar riwayat ke HTML
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <div>
          <span class="user-badge">${item.user}</span>
          <b>Rp ${nominal.toLocaleString("id-ID")}</b>
          <div class="text-subtle">${item.note || "Setoran tabungan"}</div>
        </div>
        <div class="text-subtle">${formattedDate}</div>
      `;
      historyList.appendChild(li);
    });

    updateSummary(totalSaldo, totalMingguIni);
  });
}

// --- TAMPUNG SETORAN UANG BARU ---
function setorUang(e) {
  e.preventDefault();
  const amountInput = document.getElementById("nominal");
  const noteInput = document.getElementById("catatan");

  const amount = parseInt(amountInput.value);
  const note = noteInput.value.trim();

  if (!amount || amount <= 0) return;

  // Kirim data baru ke Firebase Database
  const newSetorRef = db.ref("savings_history").push();
  newSetorRef.set({
    user: currentUser,
    amount: amount,
    note: note,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    // Reset form input setelah sukses
    amountInput.value = "";
    noteInput.value = "";
  }).catch((err) => {
    alert("Gagal menyimpan data: " + err.message);
  });
}

// --- UPDATE SUMMARY & PROGRESS BAR ---
function updateSummary(total, minggu) {
  document.getElementById("total-saldo").innerText = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("total-minggu").innerText = `Rp ${minggu.toLocaleString("id-ID")}`;

  const percentage = Math.min(Math.round((total / TARGET_TABUNGAN) * 100), 100);
  document.getElementById("progress-bar").style.width = `${percentage}%`;
  document.getElementById("progress-text").innerText = `${percentage}% tercapai (${total.toLocaleString("id-ID")} / ${TARGET_TABUNGAN.toLocaleString("id-ID")})`;
}