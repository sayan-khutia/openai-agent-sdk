import "dotenv/config";
import { Agent, run, OutputGuardrailTripwireTriggered } from "@openai/agents";
import { z } from "zod";

const sqlGuardrailAgent = new Agent({
  name: "SQL Guardrail Agent",
  instructions: `
    You are a security guardrail agent responsible for preventing unsafe and sensitive SQL queries from being executed.
    
    Your primary responsibility is to analyze SQL queries and block any operations that could:
    1. Delete or drop database objects (tables, databases, schemas, indexes, etc.)
    2. Modify sensitive data such as grades, student records, or other critical information
    3. Perform destructive operations that could cause data loss
    4. Alter database schema or structure
    5. Execute operations that could compromise data integrity
    
    Specifically, you must BLOCK and flag as unsafe any queries containing:
    - DROP TABLE, DROP DATABASE, DROP SCHEMA, or any DROP operations
    - DELETE statements (especially without proper WHERE clauses or on sensitive tables)
    - UPDATE statements on sensitive fields like grades, student records, or any data that should be immutable
    - ALTER TABLE, ALTER DATABASE, or any schema modification commands
    - TRUNCATE operations
    - GRANT or REVOKE permission changes
    - Any operations that could permanently modify or delete critical data
    
    You should ALLOW:
    - SELECT queries for reading data
    - Safe read-only operations
    - Queries that only retrieve information without modifying anything
    
    When you detect an unsafe query, you must trigger the guardrail and prevent execution.
    Be strict and err on the side of caution - if you're unsure whether a query is safe, block it.
    `,
  outputType: z.object({
    isSafeQuery: z.boolean().describe("Whether the query is unsafe or not"),
    reason: z.string().optional().describe("The reason for the unsafe query"),
  }),
});

const sqlGuardrail = {
  name: "SQL Guardrail",
  async execute({ agentOutput }) {
    // console.log("Executing SQL guardrail with agent output:", agentOutput);
    const result = await run(sqlGuardrailAgent, agentOutput.sqlQuery);
    if (!result.finalOutput.isSafeQuery) {
      console.log("Reason: ", result.finalOutput.reason);
    }
    return {
      tripwireTriggered: !result.finalOutput.isSafeQuery,
      outputInformation: result.finalOutput.reason,
    };
  },
};

const sqlAgent = new Agent({
  name: "SQL Expert Agent",
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
  outputGuardrails: [sqlGuardrail],
});

async function main(query = "") {
  try {
    const result = await run(sqlAgent, query);
    console.log(`Result: ${result.finalOutput.sqlQuery}`);
  } catch (e) {
    if (e instanceof OutputGuardrailTripwireTriggered) {
      console.log("SQL guardrail tripped");
    }
  }
}

main("list all the students").catch(console.error);
