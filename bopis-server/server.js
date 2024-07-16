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

app.post("/create-cart", async (req, res) => {
  try {
    const cartResponse = await axios.post(
      `${baseURL}/carts`,
      {
        customer_id: 0,
        line_items: req.body.line_items,
        channel_id: 1,
        currency: { code: "USD" },
        locale: "en-US",
      },
      { headers }
    );

    // Constructing the response object in the desired format
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
        line_items: cartResponse.data.data.line_items,
        created_time: cartResponse.data.data.created_time,
        updated_time: cartResponse.data.data.updated_time,
        locale: cartResponse.data.data.locale,
      },
      meta: {},
    };

    console.log("Cart creation response:", responseData);
    res.json(responseData); // Sending the formatted response back to the client
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Error creating cart" });
  }
});

// Step 2: Getting Cart
app.get("/get-cart/:cartId", async (req, res) => {
  const { cartId } = req.params;
  try {
    const cartResponse = await axios.get(`${baseURL}/carts/${cartId}`, {
      headers,
    });
    res.json(cartResponse.data);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ error: "Error getting cart" });
  }
});

// Step 3: Creating Consignments
app.post("/create-consignments", async (req, res) => {
  const { checkoutId, itemId, address, pickup_option } = req.body;
  try {
    const consignmentsResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/consignments`,
      [
        {
          address: address,
          line_items: [
            {
              item_id: itemId,
              quantity: 1,
            },
          ],
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
app.post("/create-billing-address", async (req, res) => {
  const { checkoutId } = req.body;
  try {
    const billingAddressResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/billing-address`,
      {
        first_name: "Pushkar",
        last_name: "Dutta",
        email: "Pushkardutt555@gmail.com",
        company: "Ignitiv Technologies",
        address1: "E-201, Main Street",
        address2: "string",
        city: "Austin",
        state_or_province: "Texas",
        state_or_province_code: "FL",
        country_code: "US",
        postal_code: "395006",
        phone: "7781825993",
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
app.post("/create-order", async (req, res) => {
  const { checkoutId } = req.body;
  try {
    const orderResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/orders`,
      {},
      { headers }
    );
    res.json(orderResponse.data);
    console.log("Order created");
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
