
// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');

mobileMenuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Initialize variables for booking form
let selectedPackagePrice = 0;
let customServicePrice = 0;
let addonsPrice = 0;
let wasteBagsCount = 0;

// Package selection function
function selectPackage(element, price) {
    // Remove selected class from all packages
    document.querySelectorAll('.package-option').forEach(pkg => {
        pkg.classList.remove('selected');
    });

    // Add selected class to clicked package
    element.classList.add('selected');

    // Check the hidden radio button
    element.querySelector('input[type="radio"]').checked = true;

    // Update package price
    selectedPackagePrice = price;

    // Hide custom options if showing
    document.getElementById('customOptions').style.display = 'none';
    document.getElementById('customService').checked = false;

    // Update total price
    updatePrice();
}

// Custom service toggle
document.getElementById('customService').addEventListener('change', function () {
    const customOptions = document.getElementById('customOptions');
    if (this.checked) {
        customOptions.style.display = 'block';

        // Unselect any package
        document.querySelectorAll('.package-option').forEach(pkg => {
            pkg.classList.remove('selected');
            pkg.querySelector('input[type="radio"]').checked = false;
        });
        selectedPackagePrice = 0;
    } else {
        customOptions.style.display = 'none';
    }
    updatePrice();
});

// Calculate custom service price
function calculateCustomService() {
    let price = 0;

    // Garden size base price
    const selectedSize = document.querySelector('input[name="gardenSize"]:checked');
    if (selectedSize && selectedSize.value !== 'custom') {
        price += parseInt(selectedSize.value);
    }

    // Additional services
    document.querySelectorAll('input[name="services"]:checked').forEach(service => {
        price += parseInt(service.value);
    });

    return price;
}

// Calculate addons price
function calculateAddons() {
    let price = 0;

    // Additional services
    document.querySelectorAll('input[name="addons"]:checked').forEach(addon => {
        // Special handling for waste bags
        if (addon.id === 'addonWaste') {
            price += (10 * wasteBagsCount); // 10€ per bag
        } else {
            price += parseInt(addon.value);
        }
    });

    return price;
}

// Update waste bags count and price
function updateWasteBags() {
    const wasteBagsInput = document.getElementById('wasteBagsCount');
    if (wasteBagsInput) {
        wasteBagsCount = parseInt(wasteBagsInput.value) || 0;

        // Update the price display for waste bags
        const wastePriceElement = document.querySelector('label[for="addonWaste"] .addon-price');
        if (wastePriceElement) {
            wastePriceElement.textContent = `+${wasteBagsCount * 10}€`;
        }

        updatePrice();
    }
}

// Update total price display
function updatePrice() {
    // Calculate custom service price if selected
    if (document.getElementById('customService').checked) {
        customServicePrice = calculateCustomService();
    } else {
        customServicePrice = 0;
    }

    // Calculate addons price
    addonsPrice = calculateAddons();

    // Calculate total
    let total = selectedPackagePrice + customServicePrice + addonsPrice;

    // Special case for extra large custom quote
    if (document.getElementById('sizeXLarge') && document.getElementById('sizeXLarge').checked) {
        document.getElementById('totalPrice').innerHTML = 'We will contact you with a customized quote';
        return;
    }

    // Update display
    document.getElementById('totalPrice').innerHTML = `Total Price: ${total}€`;

    // Show savings if package selected
    if (selectedPackagePrice > 0) {
        const selectedPackage = document.querySelector('.package-option.selected .package-saving');
        if (selectedPackage) {
            document.getElementById('totalPrice').innerHTML += `<br><small>${selectedPackage.textContent}</small>`;
        }
    }
}

// Generate WhatsApp message
function generateWhatsAppMessage(formData) {
    let message = "Hello! I would like to book a garden cleaning service:\n\n";

    // Add selected package or custom services
    if (selectedPackagePrice > 0) {
        const packageName = document.querySelector('.package-option.selected .package-name').textContent;
        message += `*Package:* ${packageName}\n`;
    } else {
        message += "*Custom Services:*\n";
        document.querySelectorAll('input[name="services"]:checked').forEach(service => {
            message += `- ${service.labels[0].textContent.replace(/\(\+\d+€\)/, '').trim()}\n`;
        });
    }

    // Add add-ons
    const selectedAddons = [];
    document.querySelectorAll('input[name="addons"]:checked').forEach(addon => {
        let addonText = addon.labels[0].textContent.replace(/\(\+\d+€\)/, '').trim();
        if (addon.id === 'addonWaste' && wasteBagsCount > 0) {
            addonText += ` (${wasteBagsCount} bags)`;
        }
        selectedAddons.push(addonText);
    });

    if (selectedAddons.length > 0) {
        message += `\n*Add-ons:*\n${selectedAddons.join('\n')}\n`;
    }

    // Add scheduling information
    message += `\n*Date:* ${formData.get('serviceDate')}\n`;
    message += `*Time:* ${formData.get('serviceTime')}\n`;

    // Add garden details
    message += `\n*Garden Address:* ${formData.get('gardenAddress')}\n`;
    if (formData.get('gardenNotes')) {
        message += `*Special Instructions:* ${formData.get('gardenNotes')}\n`;
    }

    // Add contact information
    message += `\n*My Contact Info:*\n`;
    message += `Name: ${formData.get('customerName')}\n`;
    message += `Phone: ${formData.get('customerPhone')}\n`;
    message += `Email: ${formData.get('customerEmail')}\n`;

    // Add pricing information
    message += `\n*Total Price:* ${selectedPackagePrice + customServicePrice + addonsPrice}€\n`;

    return encodeURIComponent(message);
}

// Form validation
function validateForm() {
    // Check if a package or custom service is selected
    if (!document.querySelector('.package-option.selected')) {
        if (!document.getElementById('customService').checked) {
            alert('Please select a service package or choose custom services');
            return false;
        }

        // For custom services, check at least one service is selected
        if (document.getElementById('customService').checked) {
            if (!document.querySelector('input[name="gardenSize"]:checked')) {
                alert('Please select your garden size');
                return false;
            }

            if (!document.querySelector('input[name="services"]:checked')) {
                alert('Please select at least one service');
                return false;
            }
        }
    }

    // Check required fields
    const requiredFields = ['serviceDate', 'serviceTime', 'gardenAddress', 'customerName', 'customerPhone', 'customerEmail'];
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value) {
            alert(`Please fill in the ${field.labels[0].textContent} field`);
            field.focus();
            return false;
        }
    }

    return true;
}

// Initialize date picker with tomorrow as minimum date
function initializeDatePicker() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    document.getElementById('serviceDate').min = `${yyyy}-${mm}-${dd}`;
}

// Initialize event listeners for booking form
function initializeBookingFormListeners() {
    // Package selection
    document.querySelectorAll('.package-option').forEach(pkg => {
        const price = parseInt(pkg.querySelector('.package-price').textContent.replace('€', ''));
        pkg.addEventListener('click', () => selectPackage(pkg, price));
    });

    // Custom service options
    document.querySelectorAll('input[name="gardenSize"], input[name="services"]').forEach(input => {
        input.addEventListener('change', updatePrice);
    });

    // Add-on services
    document.querySelectorAll('input[name="addons"]').forEach(addon => {
        if (addon.id !== 'addonWaste') {
            addon.addEventListener('change', updatePrice);
        }
    });

    // Waste bags special handling
    const wasteCheckbox = document.getElementById('addonWaste');
    if (wasteCheckbox) {
        wasteCheckbox.addEventListener('change', function () {
            if (this.checked) {
                // Create quantity input if it doesn't exist
                if (!document.getElementById('wasteBagsCount')) {
                    const container = this.parentNode.parentNode;
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.id = 'wasteBagsCount';
                    input.min = '1';
                    input.value = '1';
                    input.style.width = '50px';
                    input.style.marginLeft = '10px';
                    input.addEventListener('input', updateWasteBags);
                    container.appendChild(input);
                    wasteBagsCount = 1;

                    // Update the price display immediately
                    const wastePriceElement = document.querySelector('label[for="addonWaste"] .addon-price');
                    if (wastePriceElement) {
                        wastePriceElement.textContent = '+10€';
                    }
                }
            } else {
                // Remove quantity input
                const input = document.getElementById('wasteBagsCount');
                if (input) {
                    input.remove();
                    wasteBagsCount = 0;

                    // Reset the price display
                    const wastePriceElement = document.querySelector('label[for="addonWaste"] .addon-price');
                    if (wastePriceElement) {
                        wastePriceElement.textContent = '+10€';
                    }
                }
            }
            updatePrice();
        });
    }

    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Prepare form data
        const formData = new FormData(this);

        // Generate WhatsApp message
        const whatsappMessage = generateWhatsAppMessage(formData);
        const whatsappNumber = "+880 18616 77258"; // Replace with your WhatsApp number

        // Open WhatsApp with the message
        window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');

        // Optional: Show confirmation
        alert('Thank you for your booking! You will now be redirected to WhatsApp to confirm your appointment.');
    });
}

// Highlight current section in navigation
window.addEventListener('scroll', function () {
    const scrollPosition = window.scrollY;

    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('nav ul li a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeBookingFormListeners();
    initializeDatePicker();
    updatePrice();
});
