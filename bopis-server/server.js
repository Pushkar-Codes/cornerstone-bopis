const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

// BigCommerce API credentials
const storeHash = "gaocea2v3z";
// const clientId = "2q8k0wclqkvts23rezqvaq326p6bhga";
// const clientSecret =
//   "5a32ade58db7907e1a401064526de7b25ff8c5d6a87e383dd844dade7849601c";
const accessToken = "cxgy1t2yvswp3kbmkq0gihkcj9cwh7z";

// Route to get products from BigCommerce
app.get("/location", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/inventory/locations`,
      {
        headers: {
          "X-Auth-Token": accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching location");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
