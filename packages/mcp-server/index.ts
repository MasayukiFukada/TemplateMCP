import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { prisma } from "db";

const server = new Server(
  {
    name: "template-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 * Exposes tools to list people and suggest menus.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "greet_and_suggest_all",
        description: "Greets everyone in the database and suggests a menu based on their favorite foods.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "greet_and_suggest_all": {
      const people = await prisma.person.findMany({
        include: {
          favoriteFoods: true,
        },
      });

      if (people.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No one is registered in the database yet.",
            },
          ],
        };
      }

      const suggestions = people.map((person) => {
        const foods = person.favoriteFoods.map((f) => f.name).join(", ");
        const greeting = `Hello, ${person.name}!`;
        const suggestion = foods 
          ? `Since you like ${foods}, how about some ${foods}-based gourmet menu today?`
          : "I don't know your favorite food yet, but I suggest a nice balanced meal!";
        return `${greeting}\n${suggestion}`;
      }).join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: suggestions,
          },
        ],
      };
    }

    default:
      throw new Error("Tool not found");
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Template MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
