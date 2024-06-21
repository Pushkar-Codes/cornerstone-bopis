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
const fetchInventoryLevels = async () => {
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

    // Fetch inventory levels
    const inventoryLevels = await fetchInventoryLevels();

    // Map inventory levels to locations
    locations = locations.map((location) => {
      const inventoryLevel = inventoryLevels.find(
        (level) => level.location_id === location.id
      );
      return {
        ...location,
        inventory_level: inventoryLevel ? inventoryLevel.available : 0,
      };
    });

    res.json({ data: locations });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).send("Error fetching location");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
