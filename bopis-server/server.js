const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

const storeHash = "gaocea2v3z";
const accessToken = "cxgy1t2yvswp3kbmkq0gihkcj9cwh7z";

// Function to fetch products from BigCommerce
const fetchProducts = async () => {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products`,
      {
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Function to fetch inventory levels from BigCommerce
const fetchInventoryLevels = async (productId, locationId) => {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/inventory/products/${productId}/locations/${locationId}`,
      {
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    throw error;
  }
};

// Route to get locations from BigCommerce
app.get("/location", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/inventory/locations`,
      {
        headers: {
          "X-Auth-Token": accessToken,
          Accept: "application/json",
        },
      }
    );

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
        line_items: [],
        custom_items: [
          {
            sku: "IGNM",
            name: "Ignitiv Magazine",
            quantity: 1,
            list_price: 10.25,
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

    const cartId = cartResponse.data.data.id;
    res.json({ cartId });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Step 3: Creating Consignments
app.post("/create-consignments", async (req, res) => {
  const { checkoutId, itemId } = req.body;
  try {
    const consignmentsResponse = await axios.post(
      `${baseURL}/checkouts/${checkoutId}/consignments`,
      [
        {
          address: {
            first_name: "Jane",
            last_name: "Dony",
            email: "Jane.Dony@email.com",
            company: "BigCommerce",
            address1: "100 Main Street",
            address2: "string",
            city: "Austin",
            state_or_province: "Texas",
            state_or_province_code: "FL",
            country_code: "US",
            postal_code: "395006",
            phone: "555-555-5555",
            custom_fields: [],
          },
          line_items: [
            {
              item_id: itemId,
              quantity: 1,
            },
          ],
          pickup_option: {
            pickup_method_id: 2,
          },
        },
      ],
      { headers }
    );

    res.json(consignmentsResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
