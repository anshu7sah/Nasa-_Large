const http = require("http");
require("dotenv").config();
const app = require("./app");

const {mongoConnect}=require("./services/mongo");

const { loadPlanetsData } = require("./modals/planets.model");
const {loadLaunchData}=require("./modals/launches.modal");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);



async function startServer() {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();
  server.listen(PORT, () => {
    console.log(`Listenting on the port ${PORT}...`);
  });
}

startServer();
