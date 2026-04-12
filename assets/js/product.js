document.addEventListener("layoutLoaded", (event) => {
  const { updateCartBadge, getCartItems } = event.detail;

  const addToCartButton = document.getElementById("addToCartBtn");
  const quantitySelect = document.getElementById("productQuantity");

  if (!addToCartButton || !quantitySelect) return;

  const currentProduct = {
    productId: 1,
    name: "Green 2-Seater Velvet Sofa",
    price: 299
  };

  function saveCartItems(cartItems) {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cartItems:", error);
    }
  }

  function addItemToCart(newItem) {
    const cartItems = getCartItems();

    const existingItem = cartItems.find((item) => item.productId === newItem.productId);

    if (existingItem) {
      existingItem.quantity += newItem.quantity;
    } else {
      cartItems.push(newItem);
    }

    saveCartItems(cartItems);
    updateCartBadge();
  }

  addToCartButton.addEventListener("click", () => {
    const quantity = Number(quantitySelect.value) || 1;

    const cartItem = {
      productId: currentProduct.productId,
      name: currentProduct.name,
      price: currentProduct.price,
      quantity
    };

    addItemToCart(cartItem);
    alert(`Added to cart\nQuantity: ${quantity}`);
  });
});