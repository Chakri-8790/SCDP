/**
 * Recommendation engine for SmartConstruct AI.
 * Generates actionable recommendations based on input features and prediction results.
 */

const generateRecommendations = (inputData, predictionResult) => {
  const recommendations = [];

  const timeDeviation = parseFloat(inputData.time_deviation) || 0;
  const costDeviation = parseFloat(inputData.cost_deviation) || 0;
  const safetyIncidents = parseFloat(inputData.safety_incidents) || 0;
  const materialShortage = inputData.material_shortage_alert || 'none';
  const equipmentUtil = parseFloat(inputData.equipment_utilization_rate) || 0;
  const performance = parseFloat(inputData.performance_score) || 50;
  const workerCount = parseFloat(inputData.worker_count) || 0;
  const taskProgress = parseFloat(inputData.task_progress) || 0;
  const machineryStatus = inputData.machinery_status || 'operational';
  const simDeviation = parseFloat(inputData.simulation_deviation) || 0;
  const riskLevel = predictionResult.riskLevel || 'Low';

  // ── Material Shortage ─────────────────────────────────────────────
  if (['high', 'critical'].includes(materialShortage.toLowerCase())) {
    recommendations.push({
      priority: 'High',
      issue: `Material shortage level is "${materialShortage}".`,
      action: 'Review inventory immediately and contact suppliers for emergency replenishment. Identify material-dependent activities on the critical path and assess schedule impact.',
      reason: 'Material shortages directly halt construction activities, causing cascade delays in dependent tasks.',
      expectedBenefit: 'Early supplier engagement can reduce material gap by 40–60% within 48–72 hours.',
    });
  } else if (materialShortage.toLowerCase() === 'medium') {
    recommendations.push({
      priority: 'Medium',
      issue: 'Material supply levels are at medium risk.',
      action: 'Review current stock levels and trigger replenishment orders for materials with less than 2-week supply.',
      reason: 'Medium shortage can escalate to high if not addressed within 1–2 weeks.',
      expectedBenefit: 'Proactive ordering prevents escalation and maintains workflow continuity.',
    });
  }

  // ── Time Deviation ────────────────────────────────────────────────
  if (timeDeviation > 20) {
    recommendations.push({
      priority: 'High',
      issue: `Schedule is running ${timeDeviation.toFixed(1)}% behind planned timeline.`,
      action: 'Review the critical path immediately. Identify delayed activities, assess resource bottlenecks, and evaluate options for overtime or parallel workstreams.',
      reason: 'Time deviations above 20% significantly increase overall project delay risk if left unaddressed.',
      expectedBenefit: 'Early intervention on critical path activities can recover 15–30% of the delay.',
    });
  } else if (timeDeviation > 10) {
    recommendations.push({
      priority: 'Medium',
      issue: `Schedule is running ${timeDeviation.toFixed(1)}% behind planned timeline.`,
      action: 'Review task sequences on the critical path and explore opportunities to fast-track non-dependent activities.',
      reason: 'Early-stage time deviation can compound as the project progresses.',
      expectedBenefit: 'Fast-tracking non-critical activities may recover the schedule without additional cost.',
    });
  }

  // ── Cost Deviation ────────────────────────────────────────────────
  if (costDeviation > 25) {
    recommendations.push({
      priority: 'High',
      issue: `Cost is ${costDeviation.toFixed(1)}% over budget.`,
      action: 'Conduct an urgent budget review. Identify top cost drivers, freeze discretionary expenditures, and submit a revised budget forecast to stakeholders.',
      reason: 'Significant budget overruns reduce financial flexibility and may force scope reductions mid-project.',
      expectedBenefit: 'Immediate cost containment can prevent overrun from escalating beyond contingency reserves.',
    });
  } else if (costDeviation > 10) {
    recommendations.push({
      priority: 'Medium',
      issue: `Cost is ${costDeviation.toFixed(1)}% over budget.`,
      action: 'Review expenditure categories and renegotiate vendor contracts where possible. Monitor cash flow weekly.',
      reason: 'Moderate cost overrun signals procurement or scope management issues that need attention.',
      expectedBenefit: 'Active cost monitoring can contain deviation to within 10% for the remainder of the project.',
    });
  }

  // ── Safety Incidents ──────────────────────────────────────────────
  if (safetyIncidents > 5) {
    recommendations.push({
      priority: 'High',
      issue: `${safetyIncidents} safety incidents recorded.`,
      action: 'Suspend high-risk activities and conduct a full site safety audit. Review and retrain workers on safety protocols. Notify the HSE team immediately.',
      reason: 'High safety incidents not only risk worker wellbeing but can trigger regulatory shutdowns causing extended delays.',
      expectedBenefit: 'Proactive safety intervention reduces incident rate and protects project schedule from regulatory action.',
    });
  } else if (safetyIncidents > 2) {
    recommendations.push({
      priority: 'Medium',
      issue: `${safetyIncidents} safety incidents recorded this period.`,
      action: 'Increase safety monitoring frequency and run a targeted safety briefing for affected work zones.',
      reason: 'Multiple incidents indicate systemic safety process gaps that need attention before escalation.',
      expectedBenefit: 'Targeted interventions can reduce incident frequency by 50%+ within 2 weeks.',
    });
  }

  // ── Equipment Utilization ─────────────────────────────────────────
  if (equipmentUtil < 40) {
    recommendations.push({
      priority: 'Medium',
      issue: `Equipment utilization is low at ${equipmentUtil.toFixed(1)}%.`,
      action: 'Review equipment assignment and task scheduling. Consider redeploying idle equipment to bottleneck activities or returning rented equipment to reduce costs.',
      reason: 'Low equipment utilization wastes financial resources and may indicate scheduling inefficiencies.',
      expectedBenefit: 'Optimizing equipment allocation can improve utilization to 70%+ and reduce rental costs.',
    });
  }

  // ── Machinery Status ──────────────────────────────────────────────
  if (machineryStatus === 'breakdown') {
    recommendations.push({
      priority: 'High',
      issue: 'Critical machinery is in breakdown status.',
      action: 'Mobilize repair crews immediately. If repair takes more than 4 hours, arrange rental replacement equipment to keep activities on schedule.',
      reason: 'Equipment breakdown on critical-path activities can cause direct schedule delays within hours.',
      expectedBenefit: 'Rapid replacement or repair maintains construction momentum and minimizes delay.',
    });
  } else if (machineryStatus === 'maintenance') {
    recommendations.push({
      priority: 'Low',
      issue: 'Machinery is currently under maintenance.',
      action: 'Confirm maintenance timeline with the service team. Schedule maintenance-dependent tasks around the downtime window.',
      reason: 'Planned maintenance is manageable if work sequences are adjusted in advance.',
      expectedBenefit: 'Proactive scheduling around maintenance windows prevents unplanned delays.',
    });
  }

  // ── Performance Score ─────────────────────────────────────────────
  if (performance < 40) {
    recommendations.push({
      priority: 'High',
      issue: `Overall performance score is critically low at ${performance.toFixed(1)}/100.`,
      action: 'Conduct an immediate project health review. Identify the top 3 performance bottlenecks and create a recovery action plan with specific owners and deadlines.',
      reason: 'A critically low performance score reflects multiple concurrent issues that compound delay risk.',
      expectedBenefit: 'Structured performance recovery plans typically improve score by 15–20 points within 2–3 weeks.',
    });
  } else if (performance < 60) {
    recommendations.push({
      priority: 'Medium',
      issue: `Performance score is below target at ${performance.toFixed(1)}/100.`,
      action: 'Review KPIs weekly and identify the 2–3 metrics dragging performance. Assign improvement owners for each.',
      reason: 'Below-target performance often reflects accumulated small issues that are individually manageable.',
      expectedBenefit: 'Focused attention on key metrics typically improves performance score by 10–15 points.',
    });
  }

  // ── Simulation Deviation ──────────────────────────────────────────
  if (simDeviation > 30) {
    recommendations.push({
      priority: 'Medium',
      issue: `Simulation deviation is ${simDeviation.toFixed(1)}%, indicating planning assumptions may be inaccurate.`,
      action: 'Re-run project simulation with current actual data. Update baseline schedule to reflect realistic remaining work durations.',
      reason: 'Large simulation deviations suggest original planning assumptions no longer reflect site reality.',
      expectedBenefit: 'Updated baseline provides more accurate forecasting and improves stakeholder communication.',
    });
  }

  // ── General Critical Risk Recommendation ─────────────────────────
  if (['High', 'Critical'].includes(riskLevel) && recommendations.length < 2) {
    recommendations.push({
      priority: 'High',
      issue: `Project risk level is ${riskLevel}.`,
      action: 'Schedule an urgent project risk review meeting with key stakeholders. Review all current risk register items and update mitigation plans.',
      reason: 'Elevated risk level requires structured management attention to prevent further deterioration.',
      expectedBenefit: 'Structured risk management can reduce risk level by one category within 2–4 weeks.',
    });
  }

  // Sort by priority
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 6); // Return top 6
};

module.exports = { generateRecommendations };
