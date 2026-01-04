import "dotenv/config";
import { Agent, run, InputGuardrailTripwireTriggered } from "@openai/agents";
import { z } from "zod";

const mathInputAgent = new Agent({
  name: "Math Input Agent",
  instructions: `
  Your task is to determine whether the user's input is a
  VALID MATHEMATICS QUESTION OR PROBLEM.
  
  Return true ONLY if the primary intent of the input is to
  ask for a mathematical calculation, evaluation, proof, or derivation.
  
  Allowed inputs (return true):
  1. Natural-language math questions
     - "What is the area of a circle with radius 5?"
     - "Solve x^2 + 3x + 2 = 0"
     - "Find the derivative of sin(x)"
  2. Word problems that clearly reduce to mathematics
     - Geometry, algebra, calculus, probability, statistics, linear algebra
  3. Pure mathematical expressions or equations
     - "2 + 2"
     - "∫₀¹ x² dx"
  
  Disallowed inputs (return false):
  1. Programming or code-related content
     - Any code syntax, functions, classes, variables used as code
     - Requests to write programs, scripts, or algorithms
  2. Creative writing or non-math tasks
     - Poems, stories, jokes, essays, metaphors
  3. General explanations not tied to solving a math problem
     - "Explain calculus"
     - "Why is math important?"
  4. Non-mathematical domains
     - Physics, chemistry, biology, finance, economics (unless purely mathematical)
     - Units-heavy real-world modeling beyond basic math
  5. Mixed or ambiguous intent
     - If it could reasonably be answered without doing math, return false
  
  Decision rules:
  - Focus on USER INTENT, not strict formatting
  - Natural language is allowed if the task is mathematical
  - If math is not the dominant purpose, return false
  - When unsure, return false
  
  Examples:
  - "what is the area of a circle with radius 5?" → true
  - "write code to calculate circle area" → false
  - "write a poem about circles" → false
  - "2 * (3 + 4)" → true
  `,
  outputType: z.object({
    isvalidMathsProblem: z.boolean(),
  }),
});

const mathInputGuardrail = {
  name: "Math Homework Guardrail",
  execute: async function ({ input }) {
    const result = await run(mathInputAgent, input);
    return {
      tripwireTriggered: !result.finalOutput.isvalidMathsProblem,
      reason: result.finalOutput.reason,
    };
  },
};

const mathsAgent = new Agent({
  name: "Maths Agent",
  instructions:
    "You are an expert maths agent that can help with maths problems.",
  inputGuardrails: [mathInputGuardrail],
});

async function main(query = "") {
  try {
    const result = await run(mathsAgent, query);
    console.log(`Result: ${result.finalOutput}`);
  } catch (e) {
    if (e instanceof InputGuardrailTripwireTriggered) {
      console.log("Math homework guardrail tripped");
    }
  }
}

main("what is the area of a circle with radius 5?").catch(console.error);
