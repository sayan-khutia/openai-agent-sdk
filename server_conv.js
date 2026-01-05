import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

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
});

async function main(query = "") {
  const result = await run(sqlAgent, query, {
    conversationId: "conv_695b5840bcd0819598f7b9f170928428007139f9054a2d61",
  });

  console.log(`Result: ${result.finalOutput}`);
}

main("get me all the students with my name.");