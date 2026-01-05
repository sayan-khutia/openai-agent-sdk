import "dotenv/config";
import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "Storyteller",
  instructions:
    "You are a storyteller. You will be given a topic and you will tell a story about it.",
});

async function* generateStory(query: string) {
  const result = await run(agent, query, { stream: true });
  const stream = result.toTextStream();

  for await (const val of stream) {
    yield { isCompleted: false, value: val };
  }

  yield { isCompleted: true, value: result.finalOutput };
}

async function main(query: string) {
  for await (const o of generateStory(query)) {
    console.log(o);
  }
}

main("tell me a story about greek mythology in 300 words.");
