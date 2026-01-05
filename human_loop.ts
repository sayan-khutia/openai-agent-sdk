import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import fs from "fs/promises";
import readline from "node:readline/promises";

const GetWeatherReportSchema = z.object({
  city: z.string().describe("The city to get the weather of"),
  degree_celsius: z.number().describe("The temperature in Celsius"),
  condition: z.string().optional().describe("The condition of the weather"),
});

const getWeatherTool = tool({
  name: "getWeatherTool",
  description: "Get the weather of a given city",
  parameters: z.object({
    city: z.string().describe("The city to get the weather of"),
  }),
  execute: async function ({ city }) {
    const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
    const response = await axios.get(url, { responseType: "text" });
    return `The weather in ${city} is ${response.data}`;
  },
});

const sendEmailTool = tool({
  name: "sendEmailTool",
  description: "Send an email to a given email address",
  parameters: z.object({
    to_email: z
      .string()
      .email()
      .describe("The email address to send the email to"),
    subject: z.string().describe("The subject of the email"),
    body: z.string().describe("The body of the email"),
  }),
  needsApproval: true,
  execute: async function ({ to_email, subject, body }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is not set. Please sign up at https://resend.com and add your API key to .env file"
      );
    }

    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: fromEmail,
          to: to_email,
          subject: subject,
          html: body.replace(/\n/g, "<br>"), // Convert newlines to <br> for HTML
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return `Email sent successfully to ${to_email} with subject "${subject}". Email ID: ${response.data.id}`;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Failed to send email: ${
            error.response.data.message || error.response.statusText
          }`
        );
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
});

const agent = new Agent({
  name: "Weather Agent",
  instructions:
    "You are an agent who can tell the weather of a given city and send an email to a given email address.",
  tools: [getWeatherTool, sendEmailTool],
  //   outputType: GetWeatherReportSchema,
});

async function askForHumanConfirmation(question: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(`${question} (y/n): `);
  const normalizedAnswer = answer.toLowerCase();
  rl.close();
  return normalizedAnswer === "y" || normalizedAnswer === "yes";
}

async function main(q: string) {
  let result = await run(agent, q);
  let hasInteruptions = result.interruptions.length > 0;
  while (hasInteruptions) {
    const currentState = result.state;
    for (const interput of result.interruptions) {
      if (interput.type === "tool_approval_item") {
        const isAllowed = await askForHumanConfirmation(
          `Agent ${interput.agent.name} is asking for calling tool ${interput.name} with args ${JSON.stringify(interput.arguments)}`
        );
        if (isAllowed) {
          currentState.approve(interput);
        } else {
          currentState.reject(interput);
        }
        result = await run(agent, currentState);
        hasInteruptions = result.interruptions?.length > 0;
      }
    }
  }

  console.log(result.finalOutput);
}

main(
  "What is the weather in kamchatka and send an email to sayan@codingsphere.co with the weather report."
);
