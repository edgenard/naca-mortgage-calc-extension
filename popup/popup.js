document.addEventListener("DOMContentLoaded", () => {
  const calculator = new MortgageCalculator();

  // Get DOM elements
  const calcMethodInputs = document.querySelectorAll(
    'input[name="calcMethod"]',
  );
  const priceInput = document.getElementById("price");
  const termSelect = document.getElementById("term");
  const rateInput = document.getElementById("rate");
  const taxInput = document.getElementById("tax");
  const insuranceInput = document.getElementById("insurance");
  const hoaFeeInput = document.getElementById("hoaFee");
  const downPaymentInput = document.getElementById("downPayment");
  const calculateButton = document.getElementById("calculate");
  const monthlyPaymentDisplay = document.getElementById("monthlyPayment");
  const purchasePriceDisplay = document.getElementById("purchasePrice");
  const principalInterestDisplay = document.getElementById("principalInterest");
  const taxesDisplay = document.getElementById("taxes");
  const insuranceAmountDisplay = document.getElementById("insuranceAmount");
  const hoaFeeDisplay = document.getElementById("hoaFeeDisplay");

  // Set default values
  rateInput.value = "5.625";
  taxInput.value = "5.00";
  insuranceInput.value = "50";
  hoaFeeInput.value = "0";
  downPaymentInput.value = "0";

  // Handle calculation method change
  calcMethodInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      calculator.setCalcMethod(e.target.value);
      priceInput.placeholder = e.target.value === "payment"
        ? "Enter desired monthly payment"
        : "Enter purchase price";
    });
  });

  // Handle calculate button click
  calculateButton.addEventListener("click", () => {
    const inputs = {
      price: parseFloat(priceInput.value) || 0,
      term: parseInt(termSelect.value) || 30,
      rate: parseFloat(rateInput.value) || 0,
      tax: parseFloat(taxInput.value) || 0,
      insurance: parseFloat(insuranceInput.value) || 0,
      downPayment: parseFloat(downPaymentInput.value) || 0,
      hoaFee: parseFloat(hoaFeeInput.value) || 0,
    };

    const results = calculator.calculate(inputs);

    monthlyPaymentDisplay.textContent = results.monthlyPayment;
    purchasePriceDisplay.textContent = results.purchasePrice;
    principalInterestDisplay.textContent = results.principalInterest;
    taxesDisplay.textContent = results.taxes;
    insuranceAmountDisplay.textContent = results.insuranceAmount;
    hoaFeeDisplay.textContent = results.hoaFee;
  });

  // Add input validation and formatting
  const numericInputs = [
    priceInput,
    rateInput,
    taxInput,
    insuranceInput,
    hoaFeeInput,
  ];

  numericInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      // Remove non-numeric characters except decimal point
      let value = e.target.value.replace(/[^0-9.]/g, "");

      // Ensure only one decimal point
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }

      // Update the input value
      e.target.value = value;
    });
  });

  // --- Tab Handling ---
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Deactivate all buttons and hide all content
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Activate clicked button and show corresponding content
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // --- MSA Lookup Logic ---
  const lookupButton = document.getElementById("lookupMsa");
  const addressInput = document.getElementById("msaAddress");
  const statusDiv = document.getElementById("msaStatus");
  const resultsDiv = document.querySelector(".msa-results");
  const msaIncomeSpan = document.getElementById("msaResultMsaIncome");
  const tractIncomeSpan = document.getElementById("msaResultTractIncome");
  const tractPercentSpan = document.getElementById("msaResultTractPercent");
  const yearSpan = document.getElementById("msaResultYear");

  if (lookupButton) {
    lookupButton.addEventListener("click", () => {
      const address = addressInput.value.trim();
      if (!address) {
        statusDiv.textContent = "Please enter an address.";
        resultsDiv.style.display = "none";
        return;
      }

      statusDiv.textContent = "Looking up address...";
      resultsDiv.style.display = "none"; // Hide previous results

      // **Placeholder for actual lookup**
      // This function needs to be replaced with a call to your backend service
      // that runs the logic from msa-lookup.js
      performMsaLookup(address)
        .then((result) => {
          if (result) {
            statusDiv.textContent = `Data found for: ${
              result.address || address
            }`;
            msaIncomeSpan.textContent = `$${
              result.msaMedianFamilyIncome?.toLocaleString() || "N/A"
            }`;
            tractIncomeSpan.textContent = `$${
              result.tractMedianFamilyIncome?.toLocaleString() || "N/A"
            }`;
            tractPercentSpan.textContent = `${
              result.tractPercentOfMsa || "N/A"
            }%`;
            yearSpan.textContent = result.year || "N/A";
            resultsDiv.style.display = "block"; // Show results
          } else {
            // Handled in catch block usually, but handle null return explicitly
            statusDiv.textContent =
              "Could not retrieve income data for this address.";
            resultsDiv.style.display = "none";
          }
        })
        .catch((error) => {
          statusDiv.textContent = `Error: ${error.message}`;
          resultsDiv.style.display = "none";
        });
    });
  }
});

// **Placeholder Function - Replace with Backend Call**
async function performMsaLookup(address) {
  try {
    const response = await fetch(
      "https://iqmfcfigrvrsuwqvlnfw.supabase.co/functions/v1/msaLookup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add your Supabase anon key here
          "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbWZjZmlncnZyc3V3cXZsbmZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDkwMzksImV4cCI6MjA1OTE4NTAzOX0.gI7FtmbUg285dXN_QTJfVLAaKwm5tbKuxbZc3kOau0Q",
        },
        body: JSON.stringify({ address }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw new Error("Failed to fetch income data from the server.");
  }
}
