const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());

// Stripe webhook raw body
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

// Other routes use normal JSON
app.use(express.json());

// ✅ Debug logs for route imports
const customerRoutes = require("./routes/customers");
console.log("customerRoutes type:", typeof customerRoutes, customerRoutes);

const stripeRoutes = require("./routes/stripeRoutes");
console.log("stripeRoutes type:", typeof stripeRoutes, stripeRoutes);

// Routes
app.use("/customers", customerRoutes);
app.use("/stripe", stripeRoutes);

// Error handler (optional)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
