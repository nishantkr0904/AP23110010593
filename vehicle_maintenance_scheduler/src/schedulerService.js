const { Log } = require("../../logging_middleware/index");
const { getDepots, getVehicles } = require("./apiClient");
const { solveKnapsack } = require("./knapsack");

function normalizeDepot(depot) {
  return {
    id: depot.id ?? depot.depotId ?? depot.depot_id,
    mechanicHours: depot.mechanicHours ?? depot.hours ?? depot.availableHours,
  };
}

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id ?? vehicle.taskId ?? vehicle.task_id,
    duration: vehicle.duration ?? vehicle.hours ?? vehicle.timeRequired,
    impact: vehicle.impact ?? vehicle.impactScore ?? vehicle.value,
  };
}

async function buildSchedule(accessToken) {
  Log("backend", "info", "service", "Starting depot scheduling run");

  const [depotsRaw, vehiclesRaw] = await Promise.all([
    getDepots(accessToken),
    getVehicles(accessToken),
  ]);

  const depots = Array.isArray(depotsRaw) ? depotsRaw.map(normalizeDepot) : [];
  const vehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw.map(normalizeVehicle) : [];

  const schedule = depots.map((depot) => {
    const result = solveKnapsack(vehicles, depot.mechanicHours);

    return {
      depotId: depot.id,
      mechanicHours: depot.mechanicHours,
      totalImpact: result.totalImpact,
      tasks: result.selected.map((task) => ({
        taskId: task.id,
        duration: task.duration,
        impact: task.impact,
      })),
    };
  });

  Log("backend", "info", "service", "Completed depot scheduling run");

  return {
    generatedAt: new Date().toISOString(),
    schedule,
  };
}

module.exports = {
  buildSchedule,
};
