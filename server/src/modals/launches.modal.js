const launches = new Map();

const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

// let latestFlightNumber=100;
// const launch={
//     flightNumber:100,
//     mission:"Kepler Exploration X",
//     rocket:"Explorer IS1",
//     launchDate:new Date("December 27, 2030"),
//     target:"Kepler-442 b",
//     customers:["ZTM","Nasa"],
//     upcoming:true,
//     success:true,
// };

// saveLaunch(launch);

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    // "page":5,
    // "limit":20,
    pagination: false,
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status != 200) {
    console.log("Problem downloading launch data");
    throw new error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.customers}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded!");
  } else {
    await populateLaunches();
  }
}

// launches.set(launch.flightNumber,launch);
async function getAllLaunches(skip, limit) {
  // return Array.from(launches.values());
  return await launchesDatabase
    .find(
      {},
      {
        _id: 0,
        __v: 0,
      }
    )
    .sort({
      flightNumber: 1,
    })
    .skip(skip)
    .limit(limit);
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existLaunchWithId(launchId) {
  // return launches.has(launchId);
  // return await launchesDatabase.findOne({
  //     flightNumber:launchId,
  // });
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Anshu", "Nasa"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

// function addNewLaunches(launch){
//     latestFlightNumber++;
//     launches.set(latestFlightNumber,Object.assign(launch,{
//         upcoming:true,
//         success:true,
//         flightNumber:latestFlightNumber,
//         customers:["Anshu","Nasa"],

//     }));
// }

async function abortLaunchById(launchId) {
  //     const aborted=launches.get(launchId);
  //     aborted.upcoming=false;
  //     aborted.success=false;
  //     return aborted;

  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1 && aborted.matchedCount === 1;
}

module.exports = {
  loadLaunchData,
  existLaunchWithId,
  // addNewLaunches,
  scheduleNewLaunch,
  getAllLaunches,
  abortLaunchById,
};
