const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware to enable CORS
app.use(cors());

// BigCommerce API credentials
const storeHash = "gaocea2v3z";
const accessToken = "cxgy1t2yvswp3kbmkq0gihkcj9cwh7z";

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

    // Filter based on pin-code if providedsss
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
