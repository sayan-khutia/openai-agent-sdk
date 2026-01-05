import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

let sharedHistory = [];

const executeSQLTool = tool({
  name: "executeSQLTool",
  description: "Execute a SQL query",
  parameters: z.object({
    sqlQuery: z.string().describe("The SQL query to execute"),
  }),
  execute: async function ({ sqlQuery }) {
    console.log(`[SQL] Execute: ${sqlQuery}`);
    return "done";
  },
});

const sqlAgent = new Agent({
  name: "SQL Expert Agent",
  tools: [executeSQLTool],
  instructions: `
      You are a SQL expert agent that can help with SQL queries.
  
      Postgres Schema:
      CREATE TABLE students (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          enrollment_date DATE
      );
  
      CREATE TABLE grades (
          id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES students(id),
          course VARCHAR(100) NOT NULL,
          grade VARCHAR(2),
          graded_at DATE
      );
      `,
  outputType: z.object({
    sqlQuery: z.string().optional().describe("The SQL query to execute"),
  }),
});

async function main(query = "") {
  // add the user query to the shared history
  sharedHistory.push({ role: "user", content: query });

  const result = await run(sqlAgent, sharedHistory);

  sharedHistory = result.history;

  // console.log(`History: ${result.history}`);
  console.log(`Result: ${result.finalOutput.sqlQuery}`);
}

// TURN 1
main("Hi! my name is Sayan Khutia.").then(() => {
  // TURN 2
  main("get me all the students with my name.");
});
