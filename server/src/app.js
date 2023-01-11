const express = require("express");
const path=require("path");
const api=require("./routes/api");
const cors = require("cors");
const app = express();
const morgan =require("morgan");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(morgan("combined"));  //the middleware for the logging request into the server
app.use(express.static(path.join(__dirname,"..","public")));

app.use("/v1",api);

app.get("/*",(req,res)=>{
  res.sendFile(path.join(__dirname,"..","public","index.html"));
});

module.exports = app;
