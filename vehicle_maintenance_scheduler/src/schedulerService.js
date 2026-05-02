const { Log } = require("../../logging_middleware/index");
const { getDepots, getVehicles } = require("./apiClient");
const { solveKnapsack } = require("./knapsack");

function normalizeDepot(depot) {
  return {
    id: depot.id ?? depot.depotId ?? depot.depot_id ?? depot.ID,
    mechanicHours:
      depot.mechanicHours ??
      depot.hours ??
      depot.availableHours ??
      depot.MechanicHours,
  };
}

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id ?? vehicle.taskId ?? vehicle.task_id ?? vehicle.TaskID,
    duration: vehicle.duration ?? vehicle.hours ?? vehicle.timeRequired ?? vehicle.Duration,
    impact: vehicle.impact ?? vehicle.impactScore ?? vehicle.value ?? vehicle.Impact,
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

  // Greedy allocation: remove scheduled tasks so depots do not share the same task.
  let remainingVehicles = [...vehicles];
  const schedule = depots.map((depot) => {
    const result = solveKnapsack(remainingVehicles, depot.mechanicHours);
    const selectedIds = new Set(result.selected.map((task) => task.id));

    remainingVehicles = remainingVehicles.filter((task) => !selectedIds.has(task.id));

    const totalHoursUsed = result.selected.reduce((sum, task) => sum + task.duration, 0);

    return {
      depotID: depot.id,
      totalImpact: result.totalImpact,
      totalHoursUsed,
      tasksScheduled: result.selected.map((task) => task.id),
    };
  });

  Log("backend", "info", "service", "Completed depot scheduling run");

  return schedule;
}

module.exports = {
  buildSchedule,
};
