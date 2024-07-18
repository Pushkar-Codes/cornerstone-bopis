const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const storeHash = "gaocea2v3z";
const accessToken = "cxgy1t2yvswp3kbmkq0gihkcj9cwh7z";
const baseURL = `https://api.bigcommerce.com/stores/${storeHash}/v3`;

const headers = {
  "X-Auth-Token": accessToken,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Route to get locations from BigCommerce
app.get("/location", async (req, res) => {
  try {
    const response = await axios.get(`${baseURL}/inventory/locations`, {
      headers,
    });

    const pinCode = req.query.pinCode;
    let locations = response.data.data;

    if (pinCode) {
      locations = locations.filter(
        (location) => location.address.zip === pinCode
      );
    }

    res.json({ data: locations });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).send("Error fetching location");
  }
});

// Function to fetch inventory levels from BigCommerce
const fetchInventoryLevels = async (productId, locationId) => {
  try {
    const response = await axios.get(
      `${baseURL}/inventory/products/${productId}/locations/${locationId}`,
      { headers }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    throw error;
  }
};

// Route to get inventory level for a product at a specific location
app.get("/inventory-level", async (req, res) => {
  const { productId, locationId } = req.query;
  try {
    const inventoryLevel = await fetchInventoryLevels(productId, locationId);
    res.json({ inventoryLevel });
  } catch (error) {
    console.error("Error fetching inventory level:", error);
    res.status(500).send("Error fetching inventory level");
  }
});

// Step 1: Creating Cart

//
app.post("/create-cart", async (req, res) => {
  try {
    const { line_items, custom_items } = req.body;
    const cartResponse = await axios.post(
      `${baseURL}/carts`,
      {
        customer_id: 0,
        line_items: line_items || [],
        custom_items: custom_items || [
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
      },
      { headers }
    );

    const responseData = {
      data: {
        id: cartResponse.data.data.id,
        customer_id: cartResponse.data.data.customer_id,
        channel_id: cartResponse.data.data.channel_id,
        email: cartResponse.data.data.email,
        currency: {
          code: cartResponse.data.data.currency.code,
        },
        tax_included: cartResponse.data.data.tax_included,
        base_amount: cartResponse.data.data.base_amount,
        discount_amount: cartResponse.data.data.discount_amount,
        manual_discount_amount: cartResponse.data.data.manual_discount_amount,
        cart_amount: cartResponse.data.data.cart_amount,
        coupons: cartResponse.data.data.coupons,
        discounts: cartResponse.data.data.discounts,
        custom_items: cartResponse.data.data.custom_items,
        line_items: cartResponse.data.data.line_items,
        created_time: cartResponse.data.data.created_time,
        updated_time: cartResponse.data.data.updated_time,
        locale: cartResponse.data.data.locale,
      },
      meta: {},
    };

    console.log("Cart creation response:", responseData);

    // const cartId = cartResponse.data.data.id;
    res.json(responseData);
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
});

// Step 2: Getting Cart Items
app.post("/get-cart/:cartId/items", async (req, res) => {
  const { cartId } = req.params;
  const { custom_items } = req.body; // Expecting custom_items in the request body

  try {
    // Assuming you want to update the cart with custom_items
    const cartResponse = await axios.post(
      `${baseURL}/carts/${cartId}/items`,
      {
        custom_items: custom_items,
      },
      {
        headers,
      }
    );
    res.json(cartResponse.data);
  } catch (error) {
    console.error("Error getting cart items:", error);
    res.status(500).json({ error: "Error getting cart items" });
  }
});
// Step 3: Creating Consignments
app.post("/checkouts/:checkoutId/create-consignments", async (req, res) => {
  const { checkoutId } = req.params;
  const { address, line_items, pickup_option } = req.body; // Ensure line_items is properly destructure from req.body

  try {
    const consignmentsResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/consignments`,
      [
        {
          address: {
            first_name: address.first_name,
            last_name: address.last_name,
            email: address.email,
            company: address.company,
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state_or_province: address.state_or_province,
            state_or_province_code: address.state_or_province_code,
            country_code: address.country_code,
            postal_code: address.postal_code,
            phone: address.phone,
            custom_fields: address.custom_fields || [], // Ensure custom_fields is an array
          },
          line_items: line_items, // Ensure line_items is passed correctly
          pickup_option: pickup_option,
        },
      ],
      { headers }
    );

    res.json(consignmentsResponse.data);
  } catch (error) {
    console.error("Error creating consignments:", error);
    res.status(500).json({ error: "Error creating consignments" });
  }
});
// Step 4: Create Billing Address
app.post("/checkouts/:checkoutId/create-billing-address", async (req, res) => {
  const { checkoutId } = req.params;
  const { address } = req.body;

  try {
    const billingAddressResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/billing-address`,
      {
        first_name: address.first_name,
        last_name: address.last_name,
        email: address.email,
        company: "Ignitiv Technologies",
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        state_or_province: address.state_or_province,
        country_code: address.country_code,
        postal_code: address.postal_code,
        phone: address.phone,
        custom_fields: [],
      },
      { headers }
    );

    res.json(billingAddressResponse.data);
  } catch (error) {
    console.error("Error creating billing address:", error);
    res.status(500).json({ error: "Error creating billing address" });
  }
});

// Step 5: Creating Order
// Step 5: Creating Order
app.post("/create-order/:checkoutId", async (req, res) => {
  const { checkoutId } = req.params;
  try {
    const orderResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/orders`,
      {},
      { headers }
    );
    res.json(orderResponse.data);
    console.log("Order created: ", orderResponse.data);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
