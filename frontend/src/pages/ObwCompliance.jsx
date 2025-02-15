import React, { useState } from "react";
import "./OBWCompliance.css";

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        <button className="modal-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const OBWCompliance = () => {
  const [upc, setUpc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state for details
  const [showSimpleCountModal, setShowSimpleCountModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!upc) return;
    setLoading(true);
    setError("");
    try {
      console.log("Fetching data for UPC:", upc);
      console.log("API URL:", `/api/obw-compliance?upc=${encodeURIComponent(upc)}`);
      const response = await fetch(
        `/api/obw-compliance?upc=${encodeURIComponent(upc)}`
      );
      if (!response.ok) {
        throw new Error("Error retrieving data");
      }
      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper to decide status class based on a boolean value.
  const getStatusClass = (status) => (status ? "status-red" : "status-green");

  // Calculate the color for the Missing Replenishment Scans button.
  const getMissingButtonColor = () => {
    if (!result || !result.replenishmentScans) return "default";
    const count = result.replenishmentScans.missingDates.length;
    if (count === 0) return "status-green";
    if (count === 1) return "status-amber";
    return "status-red";
  };

  // Get summary for the last Simple Count transaction.
  const getLastSimpleCountSummary = () => {
    if (!result || !result.simpleCounts || result.simpleCounts.length === 0)
      return "No record";
    const lastTx = result.simpleCounts.reduce((latest, tx) => {
      return new Date(tx.transactionDateTime) >
        new Date(latest.transactionDateTime)
        ? tx
        : latest;
    });
    const txDate = new Date(lastTx.transactionDateTime);
    const dayName = txDate.toLocaleDateString("en-GB", { weekday: "long" });
    return `${dayName} by ${lastTx.transactionUserName}`;
  };

  // Get summary for the last missing replenishment scan in the last 7 days.
  const getLastMissingScanSummary = () => {
    if (
      !result ||
      !result.replenishmentScans ||
      !result.replenishmentScans.missingDates ||
      result.replenishmentScans.missingDates.length === 0
    )
      return "No record";
    const sortedMissing = [...result.replenishmentScans.missingDates].sort(
      (a, b) => new Date(b) - new Date(a)
    );
    const lastMissingDate = new Date(sortedMissing[0]);
    const dayName = lastMissingDate.toLocaleDateString("en-GB", {
      weekday: "long",
    });
    const formattedDate = lastMissingDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });
    const count = result.replenishmentScans.missingDates.length;
    return `${dayName} ${formattedDate} Times Missed: ${count}`;
  };

  return (
    <div className="container shaded-box">
      <h1 className="title">OBW Compliance Checker</h1>
      <form onSubmit={handleSubmit} className="form shaded-box">
        <label htmlFor="upc" className="label">
          Enter UPC:
        </label>
        <input
          type="text"
          id="upc"
          value={upc}
          onChange={(e) => setUpc(e.target.value)}
          placeholder="Scan or enter barcode"
          className="input"
        />
        <button type="submit" className="button">
          Check Compliance
        </button>
      </form>

      {loading && <p className="info">Loading...</p>}
      {error && <p className="error">Error: {error}</p>}

      {result && (
        <div className="result shaded-box">
          {/* Product Name */}
          <h2 className="product-name">{result.productDetails.description}</h2>
          {result.productDetails.imageUrl && (
  <img
    src={result.productDetails.imageUrl}
    alt={result.productDetails.description}
    className="product-image"
  />
)}

          {/* Status Boxes */}
          <div className="status-container">
            <div
              className={`status-box ${
                result.dominoed ? "status-green" : "status-red"
              }`}
            >
              <p className="status-text">
                Dominoed: {result.dominoed ? "Yes" : "No"}
              </p>
            </div>
            <div
              className={`status-box ${getStatusClass(
                result.lessThanCapacity
              )}`}
            >
              <p className="status-text">
                Stock &lt; Capacity: {result.lessThanCapacity ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* 2x2 Grid for Buttons */}
          <div className="grid-container">
            <button
              className="grid-button"
              onClick={() => setShowSimpleCountModal(true)}
            >
              <div className="button-main-text">Show Last Simple Count</div>
              <div className="button-subtext">
                Last: {getLastSimpleCountSummary()}
              </div>
            </button>
            <button
              className={`grid-button ${getMissingButtonColor()}`}
              onClick={() => setShowMissingModal(true)}
            >
              <div className="button-main-text">
                Show Missing Replenishment Scans
              </div>
              <div className="button-subtext">
                Last Missed: {getLastMissingScanSummary()}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Simple Count Transactions */}
      {showSimpleCountModal && (
        <Modal
          title="Simple Count Transactions (Last 7 Days)"
          onClose={() => setShowSimpleCountModal(false)}
        >
          {result.simpleCounts && result.simpleCounts.length > 0 ? (
            <ul className="list">
              {result.simpleCounts.map((tx, index) => (
                <li key={index} className="list-item">
                  <span className="bold">{tx.transactionDay}</span> on{" "}
                  {new Date(tx.transactionDateTime).toLocaleString()} by{" "}
                  {tx.transactionUserName} (Qty: {tx.transactionQuantity})
                </li>
              ))}
            </ul>
          ) : (
            <p className="info">No Simple Count transactions found.</p>
          )}
        </Modal>
      )}

      {/* Modal for Missing Replenishment Scans */}
      {showMissingModal && (
        <Modal
          title="Missing Replenishment Scans (Last 7 Days, Up to Yesterday)"
          onClose={() => setShowMissingModal(false)}
        >
          {result.replenishmentScans &&
          result.replenishmentScans.missingDates.length > 0 ? (
            <ul className="list">
              {result.replenishmentScans.missingDates.map((dateStr, index) => {
                const d = new Date(dateStr);
                const dayName = d.toLocaleDateString("en-GB", {
                  weekday: "long",
                });
                const formattedDate = d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                return (
                  <li key={index} className="list-item">
                    {dayName} {formattedDate}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="info">No missing replenishment scans.</p>
          )}
          <h4 className="sub-title">Scans Summary:</h4>
          {result.replenishmentScans && (
            <div className="scans-summary-container">
              {Object.entries(result.replenishmentScans.scansByDate).map(
                ([dateStr, txList]) => {
                  const d = new Date(dateStr);
                  const dayName = d.toLocaleDateString("en-GB", {
                    weekday: "long",
                  });
                  const formattedDate = d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  // For brevity, we show only the first user name.
                  const name = txList[0].transactionUserName;
                  return (
                    <div key={dateStr} className="scan-summary">
                      {dayName} {formattedDate} — {name}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default OBWCompliance;
