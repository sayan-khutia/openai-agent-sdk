import "dotenv/config";
import { Agent, run, RunContext, tool } from "@openai/agents";
import { z } from "zod";

interface MyContext {
  userId: string;
  userName: string;

  fetchUserInfoFromDb: () => Promise<string>;
}

const getUserInfoTool = tool({
  name: "getUserInfoTool",
  description: "Get the user info",
  parameters: z.object({}),
  execute: async (
    _args,
    runContext?: RunContext<MyContext>
  ): Promise<string> => {
    return `${await runContext?.context.fetchUserInfoFromDb()}`;
  },
});

const customerSupportAgent = new Agent<MyContext>({
  name: "Customer Support Agent",
  tools: [getUserInfoTool],
  instructions: ({ context }) => {
    return `You are a customer support agent. You are responsible for helping customers with their issues and questions.`;
  },
});

async function main(query: string, context: MyContext) {
  const result = await run(customerSupportAgent, query, { context });
  console.log(result.finalOutput);
}

main("say my name!", {
  userId: "148",
  userName: "john nolan",

  fetchUserInfoFromDb: async () => {
    return "User ID: 148, User Name: john nolan";
  },
});
