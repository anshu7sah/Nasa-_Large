const {getAllLaunches,
    // addNewLaunches,
    scheduleNewLaunch,
    existLaunchWithId,
    abortLaunchById,
    }=require("../../modals/launches.modal");


const {getPagination}=require("../../services/query");


async function httpGetAllLaunches(req,res){
    const {skip,limit}=getPagination(req.query);
    const launches=await getAllLaunches(skip,limit);
    return res.status(200).json(launches);
}


async function httpAddNewLaunches(req,res){
    const launch=req.body;

    if (!launch.mission || !launch.rocket || !launch.target 
        || !launch.launchDate){
            return res.status(400).json({
                error:"Missing required launch property",
            });
        }

    launch.launchDate=new Date(launch.launchDate);

    if (isNaN(launch.launchDate) ){ //launch.launchDate.tostring()==="Invalid Date"
        return res.status(400).json({
            error:"Invalid launch date",
        });
        
    }

    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
}
async function httpAbortLaunch(req,res){
  launchId=Number(req.params.id);

  const existsLaunch=await existLaunchWithId(launchId);

  if (!existsLaunch){
    return res.status(404).json({
        error:"launch not found"
    });
  }
  
  const aborted=await abortLaunchById(launchId);

  if (!aborted){
    return res.status(400).json({
        error:"Launch not aborted",
    })
  }


  return res.status(200).json({
    ok:true,
  });

}

module.exports={
    httpGetAllLaunches,
    httpAddNewLaunches,
    httpAbortLaunch,
}