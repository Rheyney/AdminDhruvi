// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkKEMbWHdPPGw4vr14c5fMHG1qXz4b9UE",
    authDomain: "ticket-booking-c7f9c.firebaseapp.com",
    projectId: "ticket-booking-c7f9c",
    storageBucket: "ticket-booking-c7f9c.appspot.com",
    messagingSenderId: "577108386667",
    appId: "1:577108386667:web:eec5791c46ba060062e22e",
    measurementId: "G-MNVT1C69JS"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// DOM Elements
const dashboardContainer = document.getElementById('dashboardContainer');
const searchInput = document.getElementById('searchInput');
const contactsContent = document.getElementById('contactsContent');
const paymentsContent = document.getElementById('paymentsContent');
const codContent = document.getElementById('codContent');
const contactsTableBody = document.getElementById('contactsTableBody');
const paymentsTableBody = document.getElementById('paymentsTableBody');
const codTableBody = document.getElementById('codTableBody');
const contactsTab = document.querySelector('.tab[data-tab="contacts"]');
const paymentsTab = document.querySelector('.tab[data-tab="payments"]');
const codTab = document.querySelector('.tab[data-tab="cod"]');
const exportContacts = document.getElementById('exportContacts');
const exportPayments = document.getElementById('exportPayments');
const exportCOD = document.getElementById('exportCOD');
const confirmationModal = document.getElementById('confirmationModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');
const toggleDeleteBtn = document.getElementById('toggleDeleteBtn');

let contacts = [];
let payments = [];
let codOrders = [];
let currentDeleteItem = null;
let showDeleteButtons = false;

// Show Dashboard
function showDashboard() {
    dashboardContainer.classList.remove('hidden');
}

// Fetch Data from Firestore
async function fetchData() {
    try {
        const contactsSnapshot = await db.collection('contacts').orderBy('timestamp', 'desc').get();
        const paymentsSnapshot = await db.collection('payments').orderBy('timestamp', 'desc').get();
        const codSnapshot = await db.collection('cod').orderBy('timestamp', 'desc').get();

        contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        codOrders = codSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        renderContacts();
        renderPayments();
        renderCODOrders();
        updateUnreadCounts();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Render Functions
function renderContacts() {
    contactsTableBody.innerHTML = contacts.map((contact, index) => `
        <tr>
            <td>${contact.name || 'N/A'}</td>
            <td>${contact.passes || 'N/A'}</td>
            <td>${contact.mobile || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('contacts', '${contact.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderPayments() {
    paymentsTableBody.innerHTML = payments.map((payment, index) => `
        <tr>
            <td>${payment.name || 'N/A'}</td>
            <td>${payment.dateOfPasses || 'N/A'}</td>
            <td>₹${payment.amountPaid || 'N/A'}</td>
            <td>${payment.contactNumber || 'N/A'}</td>
            <td>${payment.upirefid || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('payments', '${payment.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderCODOrders() {
    codTableBody.innerHTML = codOrders.map((order, index) => `
        <tr>
            <td>${order.name || 'N/A'}</td>
            <td>${order.dateOfPasses || 'N/A'}</td>
            <td>₹${order.amountToPay || 'N/A'}</td>
            <td>${order.contactNumber || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('cod', '${order.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateUnreadCounts() {
    const unreadContacts = contacts.filter(contact => !contact.isRead).length;
    const unreadPayments = payments.filter(payment => !payment.isRead).length;
    const unreadCOD = codOrders.filter(order => !order.isRead).length;

    contactsTab.textContent = `Contacts ${unreadContacts > 0 ? `(${unreadContacts})` : ''}`;
    paymentsTab.textContent = `Payments ${unreadPayments > 0 ? `(${unreadPayments})` : ''}`;
    codTab.textContent = `COD Orders ${unreadCOD > 0 ? `(${unreadCOD})` : ''}`;
}

// Delete Functionality
function showDeleteConfirmation(type, id) {
    currentDeleteItem = { type, id };
    confirmationModal.classList.remove('hidden');
}

confirmDelete.addEventListener('click', () => {
    if (currentDeleteItem) {
        deleteItem(currentDeleteItem.type, currentDeleteItem.id);
    }
    confirmationModal.classList.add('hidden');
});

cancelDelete.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
});

async function deleteItem(type, id) {
    try {
        await db.collection(type).doc(id).delete();
        if (type === 'contacts') {
            contacts = contacts.filter(contact => contact.id !== id);
            renderContacts();
        } else if (type === 'payments') {
            payments = payments.filter(payment => payment.id !== id);
            renderPayments();
        } else if (type === 'cod') {
            codOrders = codOrders.filter(order => order.id !== id);
            renderCODOrders();
        }
        updateUnreadCounts();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
    }
}

// Toggle Delete Buttons
toggleDeleteBtn.addEventListener('click', () => {
    showDeleteButtons = !showDeleteButtons;
    toggleDeleteBtn.textContent = showDeleteButtons ? 'Hide Delete Options' : 'Show Delete Options';
    document.querySelectorAll('.action-column').forEach(col => {
        col.classList.toggle('hidden');
    });
    renderContacts();
    renderPayments();
    renderCODOrders();
});

// Search Functionality
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    filterTable(contactsTableBody, contacts, searchTerm, renderContactRow);
    filterTable(paymentsTableBody, payments, searchTerm, renderPaymentRow);
    filterTable(codTableBody, codOrders, searchTerm, renderCODRow);
});

function filterTable(tableBody, data, searchTerm, renderRow) {
    const filteredData = data.filter(item => 
        Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm)
        )
    );
    tableBody.innerHTML = filteredData.map(renderRow).join('');
}

function renderContactRow(contact) {
    return `
        <tr>
            <td>${contact.name || 'N/A'}</td>
            <td>${contact.passes || 'N/A'}</td>
            <td>${contact.mobile || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('contacts', '${contact.id}')">Delete</button>
            </td>
        </tr>
    `;
}

function renderPaymentRow(payment) {
    return `
        <tr>
            <td>${payment.name || 'N/A'}</td>
            <td>${payment.dateOfPasses || 'N/A'}</td>
            <td>₹${payment.amountPaid || 'N/A'}</td>
            <td>${payment.contactNumber || 'N/A'}</td>
            <td>${payment.upirefid || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('payments', '${payment.id}')">Delete</button>
            </td>
        </tr>
    `;
}

function renderCODRow(order) {
    return `
        <tr>
            <td>${order.name || 'N/A'}</td>
            <td>${order.dateOfPasses || 'N/A'}</td>
            <td>₹${order.amountToPay || 'N/A'}</td>
            <td>${order.contactNumber || 'N/A'}</td>
            <td class="action-column ${showDeleteButtons ? '' : 'hidden'}">
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation('cod', '${order.id}')">Delete</button>
            </td>
        </tr>
    `;
}

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`${tab.dataset.tab}Content`).classList.remove('hidden');
    });
});

// Export to CSV Functionality
exportContacts.addEventListener('click', () => exportToCSV(contacts, 'contacts'));
exportPayments.addEventListener('click', () => exportToCSV(payments, 'payments'));
exportCOD.addEventListener('click', () => exportToCSV(codOrders, 'cod_orders'));

function exportToCSV(data, filename) {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function convertToCSV(data) {
    const header = Object.keys(data[0]).join(',') + '\n';
    const rows = data.map(obj => Object.values(obj).join(','));
    return header + rows.join('\n');
}

// Initial setup
showDashboard();
fetchData();