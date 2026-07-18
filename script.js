// 🌟 1. Coffee Bean Parallax Background
const bg = document.getElementById('parallax-bg');
const symbols = ['🫘', '☕', '🤎', '✨']; 
if (bg) {
    for(let i=0; i<80; i++) {
        let span = document.createElement('span');
        span.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        span.style.fontSize = `${Math.random() * 3 + 1}rem`;
        span.style.opacity = Math.random() * 0.5 + 0.1;
        bg.appendChild(span);
    }
}

// 🌟 2. Global Mouse Tracking & Custom Cursor
let mouseX = 0; let mouseY = 0;
const cursor = document.getElementById('custom-cursor');

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (cursor) {
        cursor.style.left = `${mouseX}px`; 
        cursor.style.top = `${mouseY}px`;
    }
    
    if (bg) {
        const offsetX = (window.innerWidth / 2 - mouseX) * 0.05;
        const offsetY = (window.innerHeight / 2 - mouseY) * 0.05;
        bg.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    if(Math.random() > 0.85) createParticle(mouseX, mouseY);
});

function createParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${x + (Math.random() * 20 - 10)}px`;
    p.style.top = `${y + (Math.random() * 20 - 10)}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
}

document.querySelectorAll('.food-emoji').forEach(emoji => {
    emoji.addEventListener('mouseenter', () => cursor && cursor.classList.add('hungry'));
    emoji.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hungry'));
});

// 🌟 3. 3D Glass Tilt Effect
document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const centerX = rect.width / 2; const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15; 
        const rotateY = ((x - centerX) / centerX) * 15;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.boxShadow = `${-rotateY}px ${rotateX}px 30px rgba(140, 85, 33, 0.15)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        card.style.boxShadow = '0 15px 35px rgba(43, 27, 18, 0.1)';
    });
});

// 🌟 4. Secret Menu Easter Egg
let clickCount = 0; let clickTimer;
const logo = document.getElementById('logo');
if (logo) {
    logo.addEventListener('click', () => {
        clickCount++; clearTimeout(clickTimer);
        if (clickCount >= 3) {
            document.body.classList.toggle('hacked');
            const overlay = document.getElementById('secret-overlay');
            if (document.body.classList.contains('hacked') && overlay) {
                overlay.style.opacity = '1';
                setTimeout(() => overlay.style.opacity = '0', 2000);
            }
            clickCount = 0;
        } else {
            clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
        }
    });
}

// 🌟 5. Scroll Reveal Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
        } else {
            entry.target.classList.remove('reveal');
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.menu-section').forEach((section) => observer.observe(section));

// --- 🛒 6. UPGRADED CART & API LOGIC ---
let cart = []; 
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalDisplay = document.getElementById('cart-total');
const cartCountBadge = document.getElementById('cart-count');

// Drawer Controls
document.getElementById('floating-cart')?.addEventListener('click', () => {
    cartModal.classList.add('active');
});
document.getElementById('close-cart')?.addEventListener('click', () => {
    cartModal.classList.remove('active');
});

// Add to Order Logic
window.orderItem = function(e, itemName, itemPrice, emojiText) {
    triggerFallingEmoji(e.clientX, e.clientY, emojiText);
    
    const existingItem = cart.find(item => item.name === itemName);
    if (existingItem) {
        existingItem.quantity += 1; 
    } else {
        cart.push({ name: itemName, price: itemPrice, quantity: 1 }); 
    }
    updateCartUI();
};

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = ''; 
    let total = 0;
    let totalItems = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;
        
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name} <span style="color:#c98a4b; font-size:1rem;">x${item.quantity}</span></strong>
                    <span class="cart-item-price">₹${itemTotal}</span>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">X</button>
            </div>
        `;
    });

    if (cartCountBadge) cartCountBadge.innerText = totalItems;
    if (cartTotalDisplay) cartTotalDisplay.innerText = `₹${total}`;
    
    const cartElement = document.getElementById('floating-cart');
    if (cartElement) {
        cartElement.classList.add('bounce');
        setTimeout(() => cartElement.classList.remove('bounce'), 300);
    }
}

window.removeFromCart = function(index) {
    if(cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1); 
    }
    updateCartUI(); 
};

function triggerFallingEmoji(startX, startY, emojiText) {
    const cartElement = document.getElementById('floating-cart');
    if (!cartElement) return;
    
    const cartRect = cartElement.getBoundingClientRect();
    const endX = cartRect.left + (cartRect.width / 2);
    const endY = cartRect.top + (cartRect.height / 2);

    const fallingItem = document.createElement('div');
    fallingItem.className = 'falling-item';
    fallingItem.innerText = emojiText;
    fallingItem.style.left = `${startX}px`;
    fallingItem.style.top = `${startY}px`;
    document.body.appendChild(fallingItem);

    requestAnimationFrame(() => {
        fallingItem.style.transform = `translate(${endX - startX - 25}px, ${endY - startY - 25}px) rotate(720deg) scale(0.2)`;
        fallingItem.style.opacity = '0.7';
    });
    setTimeout(() => fallingItem.remove(), 800); 
}

// 💳 Razorpay Checkout API
document.getElementById('checkout-btn')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('customer-name').value;
    const phoneInput = document.getElementById('customer-phone').value;
    const tableInput = document.getElementById('table-number').value;
    const specialInput = document.getElementById('special-instructions').value;

    if(!nameInput || !phoneInput || !tableInput) return alert('Please fill in your Name, Phone, and Table Number!');
    if(cart.length === 0) return alert('Your tray is empty!');

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const checkoutBtn = document.getElementById('checkout-btn');
    
    checkoutBtn.innerText = "Initializing Payment...";
    checkoutBtn.disabled = true;

    try {
        const orderResponse = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total_amount: totalAmount })
        });
        
        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.detail || 'Failed to create payment order');

        const options = {
            "key": "rzp_test_TEeLFQAYo8bpHT", // ⚠️ REPLACE WITH YOUR TEST KEY!
            "amount": orderData.amount, 
            "currency": "INR",
            "name": "Caffe-30 Sijhora",
            "description": "Premium Cafe Order",
            "order_id": orderData.razorpay_order_id,
            "handler": async function (response) {
                const verifyPayload = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    customer_name: nameInput,
                    customer_phone: phoneInput,
                    table_number: parseInt(tableInput),
                    special_instructions: specialInput,
                    items: cart,
                    total_amount: totalAmount
                };

                const verifyResponse = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(verifyPayload)
                });

                if (verifyResponse.ok) {
                    document.getElementById('receipt-name').innerText = `Name: ${nameInput}`;
                    document.getElementById('receipt-table').innerText = `Table: ${tableInput}`;
                    document.getElementById('receipt-total-price').innerText = `Total Paid: ₹${totalAmount}`;
                    
                    const receiptList = document.getElementById('receipt-items-list');
                    receiptList.innerHTML = '';
                    cart.forEach(item => {
                        receiptList.innerHTML += `<li><span>${item.quantity}x ${item.name}</span> <span>₹${item.price * item.quantity}</span></li>`;
                    });

                    cartModal.classList.remove('active');
                    document.getElementById('receipt-overlay').classList.add('active');

                    cart = []; 
                    updateCartUI(); 
                    document.getElementById('customer-name').value = '';
                    document.getElementById('customer-phone').value = '';
                    document.getElementById('table-number').value = '';
                    document.getElementById('special-instructions').value = '';
                } else {
                    alert("Payment verification failed! Please contact staff.");
                }
            },
            "prefill": { "name": nameInput, "contact": phoneInput },
            "theme": { "color": "#c98a4b" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
            alert("Payment Failed: " + response.error.description);
        });
        rzp.open();
        
    } catch (error) {
        console.error('API Error:', error);
        alert('Could not initiate payment. Make sure the server is running and you cleared your browser cache.');
    } finally {
        checkoutBtn.innerText = "Proceed to Pay";
        checkoutBtn.disabled = false;
    }
});

window.closeReceipt = function() {
    document.getElementById('receipt-overlay').classList.remove('active');
};