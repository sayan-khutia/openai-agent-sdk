import "dotenv/config";
import { Agent, tool, run } from "@openai/agents";
import { z } from "zod";
import fs from "node:fs/promises";

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

async function runSalesAgent(query = "") {
  const result = await run(salesAgent, query);
  console.log(result.finalOutput);
}

runSalesAgent(`Hi, I would like to request a refund for my recent payment.
Payment date: 2024-06-10
Amount: ₹599
Reason for refund: Internet was not working for 3 days after payment
Account number: 1234567890
Customer ID: 1234567890
Name: Sayan Khutia`);
