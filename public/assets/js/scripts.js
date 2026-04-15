console.log("Script is loaded correctly!");

const productData = {
    "chair": {
        name: "Minimalist Wooden Chair",
        price: "$120.00",
        description: "A beautiful handcrafted oak chair designed for maximum comfort and style.",
        image: "../assets/images/chair.avif",
        thumbnails: ["../assets/images/chair.avif", "../assets/images/chair1.avif"] 
    },
    "sofa": {
        name: "Modern Grey Sofa",
        price: "$320.00",
        description: "A plush, deep-seated sofa perfect for modern living rooms.",
        image: "../assets/images/sofa.avif",
        thumbnails: ["../assets/images/sofa.avif", "../assets/images/sofa.avif"]
    },
    "table": {
        name: "Wooden Table",
        price: "$555.67",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam assumenda, cum et ducimus totam cumque.",
        image: "../assets/images/table.avif",
        thumbnails: ["../assets/images/table.avif", "../assets/images/table.avif", "../assets/images/table.avif"]
    }
};

const reviews = [
    { text: "Amazing product! The quality is outstanding and very comfortable.", name: "Omiee", img: "assets/images/user.png" },
    { text: "Beautiful design and fits perfectly in my home. Love it!", name: "Jennie", img: "assets/images/user.png" },
    { text: "Great service and fast delivery. Highly recommended!", name: "Shunnie", img: "assets/images/user.png" },
];
let reviewIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId && productData[productId]) {
        const data = productData[productId];
        
        const nameEl = document.getElementById("product-name");
        const priceEl = document.getElementById("product-price");
        const descEl = document.getElementById("product-desc-snippet");
        const mainImgEl = document.getElementById("main-detail-img");
        const thumbContainer = document.getElementById("thumbnails-grid");

        if(nameEl) nameEl.innerText = data.name;
        if(priceEl) priceEl.innerText = data.price;
        if(descEl) descEl.innerText = data.description;
        if(mainImgEl) mainImgEl.src = data.image;
        
        if(thumbContainer && data.thumbnails) {
            thumbContainer.innerHTML = data.thumbnails.map((src, index) => 
                `<img src="${src}" class="${index === 0 ? 'active' : ''}" alt="Thumb">`
            ).join('');
            initThumbnails(); 
        }
    }

    function initThumbnails() {
        const mainImg = document.getElementById("main-detail-img");
        const thumbs = document.querySelectorAll(".thumbnails-grid img");
        if (mainImg) {
            thumbs.forEach(t => {
                t.onclick = function() {
                    mainImg.src = this.src;
                    thumbs.forEach(img => img.classList.remove("active"));
                    this.classList.add("active");
                };
            });
        }
    }
    initThumbnails();

    const colorButtons = document.querySelectorAll(".color-btn");
    colorButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const product = this.closest(".product-img");
            if (!product) return; 
            const img = product.querySelector(".main-img");
            if (img) img.src = this.dataset.img;

            product.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
        });
    });

    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");
    const reviewText = document.querySelector(".review-text");
    const reviewName = document.querySelector(".user-name");
    const reviewImg = document.querySelector(".user-img");

    if (nextBtn && prevBtn && reviewText) {
        function updateReview() {
            reviewText.textContent = `"${reviews[reviewIndex].text}"`;
            reviewName.textContent = reviews[reviewIndex].name;
            reviewImg.src = reviews[reviewIndex].img;
        }

        nextBtn.onclick = () => {
            reviewIndex = (reviewIndex + 1) % reviews.length;
            updateReview();
        };

        prevBtn.onclick = () => {
            reviewIndex = (reviewIndex - 1 + reviews.length) % reviews.length;
            updateReview();
        };
    }

    const modal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const closeSpan = document.querySelector(".close-modal");

    if (loginBtn && modal) {
        loginBtn.onclick = () => {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        };

        if (closeSpan) {
            closeSpan.onclick = () => {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            };
        }

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        };
    }
});