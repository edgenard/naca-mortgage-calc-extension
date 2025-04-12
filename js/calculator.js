// deno-lint-ignore-file no-unused-vars
class MortgageCalculator {
  constructor() {
    this.calcMethod = "payment";
  }

  setCalcMethod(method) {
    this.calcMethod = method;
  }

  /**
   * Format a number to a string with a prefix and commas
   * @param {number} num
   * @param {number} decimals
   * @param {string} prefix
   * @returns {string}
   */
  formatNumber(num, decimals = 2, prefix = "$") {
    if (isNaN(num)) return "";
    return `${prefix}${
      num
        .toFixed(decimals)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }`;
  }

  /**
   * Calculate base monthly payment of principal + interest
   * @param {number} principal
   * @param {number} rate
   * @param {number} term
   * @returns {number}
   */
  calculateBaseMonthlyPayment(principal, rate, term) {
    // Convert annual rate to monthly rate
    const monthlyRate = rate / 100 / 12;
    // Convert term to number of payments
    const numberOfPayments = term * 12;

    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    );
  }

  /**
   * Calculate the monthly tax amount
   * @param {number} principal The purchase price of the house
   * @param {number} taxRate The tax rate per $1000 of mortgage
   * @returns {number} The monthly tax amount
   */
  calculateMonthlyTax(principal, taxRate) {
    // turn tax rate from per $1000 to per $1
    const taxRatePerDollar = taxRate / 1000;
    // Calculate yearly tax amount
    const yearlyTax = principal * taxRatePerDollar;
    // Calculate monthly tax amount
    const monthlyTax = yearlyTax / 12;
    // Round to 2 decimal places
    return Math.round(monthlyTax);
  }

  /**
   * Given a desired max monthly payment, calculate the max purchase price
   * @param {number} desiredMonthlyPayment The desired max monthly payment
   * @param {number} rate The annual interest rate
   * @param {number} term The term of the mortgage in years
   * @param {number} taxRate The tax rate per $1000 of mortgage
   * @param {number} insurance The monthly insurance amount
   * @param {number} hoaFee The monthly HOA/Condo fee
   * @returns {number} The max purchase price
   */
  calculateMaxPurchasePrice(
    desiredMonthlyPayment,
    rate,
    term,
    taxRate,
    insurance,
    hoaFee,
  ) {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = term * 12;

    // Initial guess for principal
    const principal = desiredMonthlyPayment * numberOfPayments;

    // Binary search to find the correct principal
    let low = 0;
    let high = principal * 2;
    let iterations = 0;
    const maxIterations = 1000;
    let totalMonthlyPayment = 0;
    let guess = 0;
    while (
      iterations < maxIterations &&
      Math.abs(totalMonthlyPayment - desiredMonthlyPayment) > 0.01
    ) {
      guess = (low + high) / 2;
      totalMonthlyPayment =
        this.calculateBaseMonthlyPayment(guess, rate, term) +
        this.calculateMonthlyTax(guess, taxRate) +
        insurance +
        hoaFee;
      if (totalMonthlyPayment > desiredMonthlyPayment) {
        high = guess;
      } else {
        low = guess;
      }
      iterations++;
    }

    return guess;
  }

  /**
   * Interest rate buydown calculator. Calculates the cost to buy down the interest rate.
   * Assumes 1 point (costing 1% of principal) buys a 1/6% rate reduction for 30 or 20 year mortgages.
   * Assumes 1 point (costing 1% of principal) buys a 1/4% rate reduction for 15 year mortgages.
   *
   * @param {number} principal The principal amount of the mortgage
   * @param {number} rate The starting annual interest rate (e.g., 6.5 for 6.5%)
   * @param {number} desiredRate The target annual interest rate (e.g., 6.0 for 6.0%)
   * @param {number} term The term of the mortgage in years
   * @return {number} The cost to buy down the interest rate. Returns 0 if desiredRate >= rate.
   */
  calculateInterestRateBuydown(principal, rate, desiredRate, term) {
    if (
      isNaN(principal) ||
      isNaN(rate) ||
      isNaN(desiredRate) ||
      isNaN(term) ||
      principal <= 0 ||
      term <= 0
    ) {
      return 0;
    }

    const rateDifference = rate - desiredRate;

    if (rateDifference <= 0) {
      return 0; // No cost if the desired rate is not lower
    }

    let pointsMultiplier;
    if (term === 15) {
      // For 15 year term, 1 point buys 1/4% reduction (0.25)
      // Points = RateDifference / (1/4) = RateDifference * 4
      pointsMultiplier = 4;
    } else {
      // For other terms (e.g., 20, 30), 1 point buys 1/6% reduction (~0.1667)
      // Points = RateDifference / (1/6) = RateDifference * 6
      pointsMultiplier = 6;
    }

    const pointsNeeded = rateDifference * pointsMultiplier;

    // Calculate cost. 1 point costs 1% of the principal.
    // Cost = Points * (Principal * 1%) = Points * Principal / 100
    const cost = (pointsNeeded * principal) / 100;

    return cost;
  }

  calculate(inputs) {
    const { price, term, rate, tax, insurance, downPayment, hoaFee } = inputs;

    if (this.calcMethod === "payment") {
      const desiredMonthlyPayment = price;

      const purchasePrice = this.calculateMaxPurchasePrice(
        desiredMonthlyPayment,
        rate,
        term,
        tax,
        insurance,
        hoaFee,
      );

      const principalInterest = this.calculateBaseMonthlyPayment(
        purchasePrice,
        rate,
        term,
      );

      const monthlyTax = this.calculateMonthlyTax(purchasePrice, tax);

      return {
        monthlyPayment: this.formatNumber(desiredMonthlyPayment),
        purchasePrice: this.formatNumber(purchasePrice),
        principalInterest: this.formatNumber(principalInterest),
        taxes: this.formatNumber(monthlyTax),
        insuranceAmount: this.formatNumber(insurance),
        hoaFee: this.formatNumber(hoaFee),
      };
    } else {
      const purchasePrice = price;
      const principal = purchasePrice - downPayment;

      const principalInterest = this.calculateBaseMonthlyPayment(
        principal,
        rate,
        term,
      );

      const monthlyTax = this.calculateMonthlyTax(purchasePrice, tax);

      const totalMonthlyPayment = principalInterest + monthlyTax + insurance +
        hoaFee;

      return {
        monthlyPayment: this.formatNumber(totalMonthlyPayment),
        purchasePrice: this.formatNumber(purchasePrice),
        principalInterest: this.formatNumber(principalInterest),
        taxes: this.formatNumber(monthlyTax),
        insuranceAmount: this.formatNumber(insurance),
        hoaFee: this.formatNumber(hoaFee),
      };
    }
  }
}
