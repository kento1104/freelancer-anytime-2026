import express from "express";
import app from "./_works/_codes/server.js";

const vercelApp = express();
vercelApp.use(app);

export default vercelApp;
