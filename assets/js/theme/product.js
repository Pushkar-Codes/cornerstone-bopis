/*
 Import all product specific js
 */
import PageManager from "./page-manager";
import Review from "./product/reviews";
import collapsibleFactory from "./common/collapsible";
import ProductDetails from "./common/product-details";
import videoGallery from "./product/video-gallery";
import { classifyForm } from "./common/utils/form-utils";
import modalFactory from "./global/modal";

export default class Product extends PageManager {
  constructor(context) {
    super(context);
    this.url = window.location.href;
    this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
    this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
    this.reviewModal = modalFactory("#modal-review-form")[0];
  }

  onReady() {
    // Listen for foundation modal close events to sanitize URL after review.
    $(document).on("close.fndtn.reveal", () => {
      if (
        this.url.indexOf("#write_review") !== -1 &&
        typeof window.history.replaceState === "function"
      ) {
        window.history.replaceState(
          null,
          document.title,
          window.location.pathname
        );
      }
    });

    let validator;

    // Init collapsible
    collapsibleFactory();

    this.productDetails = new ProductDetails(
      $(".productView"),
      this.context,
      window.BCData.product_attributes
    );
    this.productDetails.setProductVariant();

    videoGallery();

    this.bulkPricingHandler();

    const $reviewForm = classifyForm(".writeReview-form");

    if ($reviewForm.length === 0) return;

    const review = new Review({ $reviewForm });

    $("body").on("click", '[data-reveal-id="modal-review-form"]', () => {
      validator = review.registerValidation(this.context);
      this.ariaDescribeReviewInputs($reviewForm);
    });

    $reviewForm.on("submit", () => {
      if (validator) {
        validator.performCheck();
        return validator.areAll("valid");
      }

      return false;
    });

    this.productReviewHandler();
  }

  ariaDescribeReviewInputs($form) {
    $form.find("[data-input]").each((_, input) => {
      const $input = $(input);
      const msgSpanId = `${$input.attr("name")}-msg`;

      $input.siblings("span").attr("id", msgSpanId);
      $input.attr("aria-describedby", msgSpanId);
    });
  }

  productReviewHandler() {
    if (this.url.indexOf("#write_review") !== -1) {
      this.$reviewLink.trigger("click");
    }
  }

  bulkPricingHandler() {
    if (this.url.indexOf("#bulk_pricing") !== -1) {
      this.$bulkPricingLink.trigger("click");
    }
  }
}

// Store - selector;

$(document).ready(function () {
  console.log("DOM fully loaded and parsed");

  $("#search-button").on("click", function () {
    const pinCode = $("#pin-code").val();
    console.log("Pin Code entered:", pinCode);

    fetch(`http://localhost:3000/location?pinCode=${pinCode}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Location data received:", data);
        const citySelectionDiv = $("#city-selection");
        citySelectionDiv.empty(); // Clear previous results

        if (data && data.data && data.data.length > 0) {
          const cities = data.data;
          let citySelectionHtml = "<p>Select a City:</p>";

          cities.forEach((city, index) => {
            citySelectionHtml += `
              <div>
                <input type="radio" id="city-${index}" name="city" value='${JSON.stringify(
              city
            )}'>
                <label for="city-${index}">${city.address.city}</label>
              </div>
            `;
          });

          citySelectionDiv.html(citySelectionHtml);

          $("input[name='city']").on("change", function () {
            const selectedCity = JSON.parse($(this).val());
            console.log("Selected city:", selectedCity);

            // Store selected city in local storage
            localStorage.setItem("selectedStore", JSON.stringify(selectedCity));

            const storeInfoDiv = $("#store-info");
            storeInfoDiv.html(`
              <h4>Pickup available at:</h4>
              <p><strong>${selectedCity.label}</strong></p>
              <p>${selectedCity.address.address1},</p>
              <p>${selectedCity.address.city}, ${selectedCity.address.state}</p>
              <button id="cart-button">Cart</button>
            `);

            // Handle cart button click
            const myCartButton = $("#cart-button");

            myCartButton.on("click", function (event) {
              event.preventDefault(); // Prevent the default form submission

              const productId = $("input[name='product_id']").val();
              const quantity = $("#qty").val();
              // const variantId = 1; // Assuming this is the default variant ID for simplicity

              // Debugging logs
              console.log("Product ID:", productId);
              console.log("Quantity:", quantity);

              if (!productId || !quantity) {
                console.error("Product ID or Quantity is missing");
                alert("Please select a product and quantity.");
                return;
              }

              const skuElement = document.querySelector(
                ".productView-info-value[data-product-sku]"
              );
              const sku = skuElement.textContent.trim(); // This will give you "IGNM"

              const productNameElement =
                document.querySelector(".productView-title");
              const productName = productNameElement.textContent.trim(); // This will give you "Ignitiv Magazine"

              const priceElement = document.querySelector(
                "[data-product-price-without-tax]"
              );
              const price = priceElement.textContent.trim(); // This will give you "$10.25"

              // Prepare payload dynamically
              const payload = {
                customer_id: 0,
                line_items: [],
                custom_items: [
                  {
                    sku: sku,
                    name: productName,
                    quantity: quantity,
                    list_price: price,
                  },
                ],
                channel_id: 1,
                currency: {
                  code: "USD",
                },
                locale: "en-US",
              };

              // Debugging log
              console.log("Payload:", payload);

              // Making the API call to create a cart
              fetch("http://localhost:3000/create-cart", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.error) {
                    console.error("Error creating cart:", data.error);
                    alert(
                      "Failed to add item to cart. Please try again later."
                    );
                  } else {
                    console.log("Cart created successfully:", data);
                    localStorage.setItem("myCartData", JSON.stringify(data));

                    // Check the response structure and log it
                    if (data.data && data.data.id) {
                      console.log("Cart ID:", data.data.id);

                      // Redirect to the cart page with appropriate parameters
                      const redirectUrl = `/cart.php?action=add&product_id=${productId}&cart_id=${data.data.id}`;
                      window.location.href = redirectUrl;
                    } else {
                      console.error("Cart ID not found in response:", data);
                      alert(
                        "Cart created but redirect failed. Please check the console for details."
                      );
                    }
                  }
                })
                .catch((error) => {
                  console.error("Error creating cart:", error);
                  alert("Failed to add item to cart. Please try again later.");
                });
            });
          });
        } else {
          citySelectionDiv.text("No store locations found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching store location:", error);
        $("#city-selection").text("Error fetching store location.");
      });
  });
});
