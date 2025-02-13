// productStatus.js

const axios = require('axios');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL of 300 seconds (5 minutes)
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Mapping of department codes to allowed domino days.
 * Each code maps to an array of days on which a "Simple Count" (domino) is expected.
 */
const dominoDaysByDeptCode = {
  "F02F": ["Sunday"],
  "F08C": ["Sunday"],
  "F22A": ["Sunday"],
  "F09A": ["Sunday"],
  "F15C": ["Sunday", "Monday"],
  "F16C": ["Sunday", "Monday"],
  "F61C": ["Sunday", "Monday"],
  "F35A": ["Monday"],
  "F30C": ["Monday"],
  "F01C": ["Monday", "Tuesday"],
  "F06C": ["Monday", "Tuesday"],
  "F20A": ["Tuesday"],
  "F21A": ["Tuesday"],
  "F13A": ["Tuesday"],
  "F38C": ["Tuesday"],
  "F62C": ["Tuesday"],
  "F04C": ["Tuesday"],
  "F19A": ["Wednesday"],
  "F07C": ["Wednesday"],
  "F63C": ["Wednesday"],
  "F67C": ["Wednesday"],
  "F64C": ["Wednesday"],
  "F03C": ["Wednesday"],
  "F12A": ["Thursday"],
  "F33A": ["Thursday"],
  "F10A": ["Thursday"]
};

/**
 * Returns an array of allowed domino days for a product,
 * based on its department code and a global rule.
 */
function getAllowedDays(productDetails) {
  const deptCode = productDetails.departmentCode;
  let allowedDays = dominoDaysByDeptCode[deptCode] ? [...dominoDaysByDeptCode[deptCode]] : [];
  if (deptCode.endsWith("C") && !allowedDays.includes("Thursday")) {
    allowedDays.push("Thursday");
  }
  return allowedDays;
}

/**
 * Helper function to group transactions by date (YYYY-MM-DD).
 */
function groupTransactionsByDate(transactions) {
  return transactions.reduce((acc, tx) => {
    const dateKey = new Date(tx.transactionDateTime).toISOString().slice(0, 10);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(tx);
    return acc;
  }, {});
}

/**
 * Checks the product status for a given UPC.
 * Uses caching to store results for a given UPC for 5 minutes.
 */
async function checkProductStatus(upc) {
  const cacheKey = `productStatus_${upc}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // STEP 1: Retrieve the authorization token.
    const tokenResponse = await axios.get('http://192.168.0.202:3002/token');
    const authToken = tokenResponse.data.token || tokenResponse.data;

    const headers = {
      'accept': 'application/json, text/plain, */*',
      'authorization': authToken,
    };

    // STEP 2: Retrieve product details from the upcData API.
    const upcDataUrl = `https://foods-sst.marksandspencer.app/api/sst/upcData?storeNumber=3036&GhostUPC=${upc}&ParentUPC=${upc}&usermode=core`;
    const upcDataResponse = await axios.get(upcDataUrl, { headers });
    if (!upcDataResponse.data || !upcDataResponse.data.upcleveldata || upcDataResponse.data.upcleveldata.length === 0) {
      throw new Error('No product details returned from upcData API.');
    }
    const productDetails = upcDataResponse.data.upcleveldata[0];

    // Use "msc" as capacity and "todayStock" as current stock.
    const capacity = productDetails.msc;
    const currentStock = productDetails.todayStock;
    const lessThanCapacity = currentStock < capacity;

    // STEP 3: Determine allowed domino days based on the product's department code.
    const allowedDominoDays = getAllowedDays(productDetails);

    // STEP 4: Retrieve transaction details from the probeProductData API.
    const probeUrl = `https://foods-sst.marksandspencer.app/api/sst/probeProductData?storeNumber=3036&userMode=09610015&upc=${upc}`;
    const probeResponse = await axios.get(probeUrl, { headers });
    const probeData = probeResponse.data;
    const transactions = probeData.upcTransactionDetails || [];

    // STEP 5: Collect all "Simple Count" transactions in the last 7 days on an allowed domino day.
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let simpleCountTransactions = [];
    for (const tx of transactions) {
      if (tx.transactionName === "Simple Count") {
        let txDate;
        try {
          txDate = new Date(tx.transactionDateTime);
        } catch (err) {
          console.log("Error parsing transaction date:", err);
          continue;
        }
        if (txDate >= sevenDaysAgo) {
          const options = { weekday: 'long', timeZone: 'UTC' };
          const txDay = txDate.toLocaleDateString('en-GB', options);
          if (allowedDominoDays.includes(txDay)) {
            simpleCountTransactions.push({
              transactionDateTime: tx.transactionDateTime,
              transactionDay: txDay,
              transactionUserName: tx.transactionUserName || "Unknown",
              transactionUserID: tx.transactionUserID || "Unknown",
              transactionQuantity: tx.transactionQuantity
            });
          }
        }
      }
    }
    const dominoed = simpleCountTransactions.length > 0;

    // STEP 6: Check replenishment scans for the last 7 days (up to yesterday) if over capacity.
    let replenishmentScans = { missingDates: [], scansByDate: {} };
    if (currentStock > capacity) {
      let startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);
      let endDate = new Date(now);
      endDate.setUTCDate(endDate.getUTCDate() - 1);
      endDate.setUTCHours(0, 0, 0, 0);

      const validReplenishmentTypes = ["Top UP - Picked", "Top UP - Not Picked"];
      const replenishmentTxs = transactions.filter(tx =>
        validReplenishmentTypes.includes(tx.transactionName)
      );
      const txsByDate = groupTransactionsByDate(replenishmentTxs);
      replenishmentScans.scansByDate = txsByDate;

      let missingDates = [];
      for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateKey = d.toISOString().slice(0, 10);
        const weekday = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
        if (allowedDominoDays.includes(weekday)) {
          continue;
        }
        if (!txsByDate[dateKey] || txsByDate[dateKey].length === 0) {
          missingDates.push(dateKey);
        }
      }
      replenishmentScans.missingDates = missingDates;
    }

    // STEP 7: Prepare final result including image URL if available.
    const resultData = {
      dominoed,
      lessThanCapacity,
      simpleCounts: simpleCountTransactions,
      replenishmentScans,
      productDetails: {
        upc: productDetails.upc,
        description: productDetails.upcleveldata ? productDetails.upcleveldata : productDetails.upcDescription,
        departmentCode: productDetails.departmentCode,
        capacity,
        todayStock: currentStock,
        imageUrl: productDetails.foodImageUrl
      }
    };

    // Store in cache before returning.
    cache.set(cacheKey, resultData);

    return resultData;

  } catch (error) {
    console.error("Error in checkProductStatus:", error.message);
    throw error;
  }
}

module.exports = { checkProductStatus };
