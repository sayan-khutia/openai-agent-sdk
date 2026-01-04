import "dotenv/config";
import { Agent, tool, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { z } from "zod";
import fs from "node:fs/promises";

// Refund Agent
const refundRequestTool = tool({
  name: "refundRequestTool",
  description: "Request a refund for a payment",
  parameters: z.object({
    customerId: z.string().describe("The customer id"),
    amount: z.number().describe("The amount of the payment"),
    reason: z.string().describe("The reason for the refund request"),
  }),
  execute: async function ({ customerId, amount, reason }) {
    await fs.appendFile(
      "refund_requests.txt",
      `Refund Request: Customer ID: ${customerId}, Amount: ${amount}, Reason: ${reason}\n`,
      "utf-8"
    );

    return { refundIssued: true };
  },
});

const refundAgent = new Agent({
  name: "Refund Agent",
  instructions: `
      You are an expert refund agent for an internet broadband provider.
      Talk to the user and help them with what they are looking for.
      `,
  tools: [refundRequestTool],
});

// Sales Agent
const fetchAvailablePlansTool = tool({
  name: "fetchAvailablePlansTool",
  description: "Fetch the available plans from the database",
  parameters: z.object({}),
  execute: async function () {
    return [
      {
        plan_id: "1",
        plan_name: "Basic",
        plan_price_inr: 399,
        plan_bandwidth_gb: 10,
        plan_speed_mbps: 100,
        plan_type: "Fiber",
      },
      {
        plan_id: "2",
        plan_name: "Premium",
        plan_price_inr: 599,
        plan_bandwidth_gb: 20,
        plan_speed_mbps: 200,
        plan_type: "Fiber",
      },
      {
        plan_id: "3",
        plan_name: "Enterprise",
        plan_price_inr: 999,
        plan_bandwidth_gb: 30,
        plan_speed_mbps: 300,
        plan_type: "Fiber",
      },
    ];
  },
});

const salesAgent = new Agent({
  name: "Sales Agent",
  instructions: `
      You are an expert sales agent for an internet broadband provider.
      Talk to the user and help them with what they are looking for.
      `,
  tools: [
    fetchAvailablePlansTool,
    refundAgent.asTool({
      toolName: "refund_expert",
      toolDescription:
        "An expert refund agent for an internet broadband provider.",
    }),
  ],
});

// Reception Agent
const receptionAgent = new Agent({
  name: "Reception Agent",
  instructions: `
    ${RECOMMENDED_PROMPT_PREFIX}
    You are the customer facing agent expert in understanding what customer needs 
    and then route them or handoff them to the right agent.
    `,
  handoffDescription: `
    You have two agents available:
    - salesAgent: Expert in handling queries like all plans and pricing available. Good for new customers.
    - refundAgent: Expert in handling user queries for existing customers and issue refunds and help them.
    `,
  handoffs: [salesAgent, refundAgent],
});

async function main(query = "") {
  const result = await run(receptionAgent, query);
  console.log(`Result: ${result.finalOutput}`);
  console.log(`History: ${JSON.stringify(result.history, null, 2)}`);
}

// main(`Hi, can you tell me which plan is best for me? 
//   I'm working remotely as a software engineer and need a fast internet connection.
//   Apart from my work I stream movies and series online and a little bit of gaming.`);

main(`Hi, I would like to request a refund for my recent payment.
Payment date: 2024-06-10
Amount: ₹599
Reason for refund: Internet is very slow, not upto the speed as per the plan I bought.
Account number: 1234567890
Customer ID: 1234567890
Name: Narendra Gandhi`);