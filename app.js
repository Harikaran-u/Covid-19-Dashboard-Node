const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
//get api states

app.get("/states/", async (request, response) => {
  const allStatesListQuery = `SELECT state_id as stateId, 
  state_name as stateName,
  population as population FROM state;`;
  const allStates = await db.all(allStatesListQuery);
  response.send(allStates);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT state_id as stateId,
  state_name as stateName,
  population as population FROM state
    WHERE state_id = ${stateId};`;
  const stateData = await db.get(getStateQuery);
  response.send(stateData);
});

app.post("/districts/", async (request, response) => {
  const districtData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtData;
  const newDistrictQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(newDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT district_id as districtId,
  district_name as districtName,
  state_id as stateId,
  cases as cases,
  cured as cured,
  active as active,
  deaths as deaths FROM district 
    WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district 
    WHERE district_id = ${districtId};`;
  db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistrictData = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updateDistrictData;
  const updateDataQuery = `UPDATE district
  SET
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  await db.run(updateDataQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT sum(district.cases) as totalCases, 
    sum(district.cured)as totalCured, sum(district.active)
    as totalActive, sum(district.deaths) as totalDeaths
    FROM district WHERE state_id = ${stateId};`;
  const total = await db.get(getStateQuery);
  response.send(total);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT state_name as stateName 
    FROM state INNER JOIN district
    WHERE district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});
initializeDbAndServer();

module.exports = app;
