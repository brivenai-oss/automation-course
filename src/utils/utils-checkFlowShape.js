// Checks a built trigger/action/condition shape against a scenario's expected shape.
// Used by both the sketch-practice exercises (Lesson 6) and the certification test's
// diagram-building part — pulled out as a pure function so both can share it and it
// can be tested directly, since this is the logic that decides whether a learner's
// answer is marked correct.

export function checkFlowShape({ trigger, mainActions, condition, pathA, pathB }, expected, successNote) {
  let correct = false;
  let message = "";

  if (!trigger) {
    message = "Every workflow needs to start with a Trigger — add one first.";
  } else if (expected.condition && !condition) {
    message = "This scenario has two different outcomes depending on a condition — try adding a Condition box.";
  } else if (!expected.condition && condition) {
    message = "This scenario doesn't branch — everything happens the same way every time, so you don't need a Condition box here.";
  } else if (mainActions.length !== expected.preActions) {
    const tooFew = mainActions.length < expected.preActions;
    if (expected.condition) {
      message = tooFew
        ? "You're missing a step that happens before the branch — reread the scenario for anything that happens either way."
        : "You've added a step before the branch that this scenario doesn't describe — only include what happens regardless of the condition.";
    } else {
      message = tooFew
        ? "You're missing at least one action step — reread the scenario for every downstream step."
        : "You've added more actions than this scenario describes — try to match it exactly.";
    }
  } else if (expected.condition && pathA.length !== expected.pathA) {
    message =
      pathA.length < expected.pathA
        ? "Path A is missing at least one action described in that branch of the scenario."
        : "Path A has more actions than that branch of the scenario describes.";
  } else if (expected.condition && pathB.length !== expected.pathB) {
    message =
      pathB.length < expected.pathB
        ? "Path B is missing at least one action described in that branch of the scenario."
        : "Path B has more actions than that branch of the scenario describes.";
  } else {
    correct = true;
    message = successNote;
  }

  return { correct, message };
}
