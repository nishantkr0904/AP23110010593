const { Log } = require("../../logging_middleware/index");

const DEPOTS_ENDPOINT = "http://20.207.122.201/evaluation-service/depots";
const VEHICLES_ENDPOINT = "http://20.207.122.201/evaluation-service/vehicles";

async function fetchJson(url, token) {
  if (!token) {
    Log("backend", "error", "service", "Missing evaluation access token for data fetch");
    throw new Error("Missing evaluation access token");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    Log("backend", "error", "service", `Data fetch failed (${response.status})`);
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function getDepots(token) {
  return fetchJson(DEPOTS_ENDPOINT, token);
}

async function getVehicles(token) {
  return fetchJson(VEHICLES_ENDPOINT, token);
}

module.exports = {
  getDepots,
  getVehicles,
};
