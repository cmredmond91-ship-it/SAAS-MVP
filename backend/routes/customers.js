const express = require("express");
const fs = require("fs");
const router = express.Router();

const filePath = "./data/customers.json";

// Helpers
function loadCustomers() {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveCustomers(customers) {
  fs.writeFileSync(filePath, JSON.stringify(customers, null, 2));
}

// GET all customers
router.get("/", (req, res) => {
  res.json(loadCustomers());
});

// POST new customer
router.post("/", (req, res) => {
  const customers = loadCustomers();
  const { name, email, paid = false, notes = "" } = req.body;

  const newId =
    customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;

  const newCustomer = {
    id: newId,
    name,
    email,
    paid,
    notes,
    history: [],
  };

  customers.push(newCustomer);
  saveCustomers(customers);

  res.status(201).json(newCustomer);
});

// PUT update customer
router.put("/:id", (req, res) => {
  const customers = loadCustomers();
  const customerId = parseInt(req.params.id, 10);
  const index = customers.findIndex((c) => c.id === customerId);

  if (index === -1) {
    return res.status(404).json({ error: "Customer not found" });
  }

  customers[index] = { ...customers[index], ...req.body };
  saveCustomers(customers);

  res.json(customers[index]);
});

// DELETE customer
router.delete("/:id", (req, res) => {
  const customers = loadCustomers();
  const customerId = parseInt(req.params.id, 10);
  const newCustomers = customers.filter((c) => c.id !== customerId);

  if (customers.length === newCustomers.length) {
    return res.status(404).json({ error: "Customer not found" });
  }

  saveCustomers(newCustomers);
  res.json({ message: "Customer deleted" });
});

module.exports = router; // ✅ must be a router
