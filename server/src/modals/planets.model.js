const { parse } = require("csv-parse");
const fs = require("fs");
const planets=require("./planets.mongo");
const results = [];
// const habitablePlanets = [];
const path = require("path");
function isHabitable(planets) {
  return (
    planets["koi_disposition"] == "CONFIRMED" &&
    planets["koi_insol"] > 0.36 &&
    planets["koi_insol"] < 1.11 &&
    planets["koi_prad"] < 1.6
  );
}
/*
    const promise=new Promise((resolve,reject)=>{
        resolve(42);
    });
    promise.then ((result)=>{

    });
    const result=await promise;
    console.log(result);
*/
function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitable(data)) {
          //TODO: Replace below create with insert + update=upsert
          savePlanets(data);
          // habitablePlanets.push(data);
          
        }
        results.push(data);
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        const countPlanetFound=(await getAllPlanets()).length;
        console.log(`${countPlanetFound} habitable planets found!`);
        // console.log(habitablePlanets);
      });
    resolve();
  });
}
async function getAllPlanets(){
  // return habitablePlanets;
  return await planets.find({},{
    '_id':0,"__v":0,
  });
}

async function savePlanets(planet){
  try{
    await planets.updateOne({
      keplerName:planet.kepler_name,
    },{
      keplerName:planet.kepler_name,
    },{
      upsert:true,
    });
  }catch(err){
    console.log(`Could not save planet ${err}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
