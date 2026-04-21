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
 * Mapping of Japanese food names to TheMealDB query keywords (area or category).
 */
const FOOD_MAPPING: Record<string, { area?: string; category?: string; search?: string }> = {
  "和食": { area: "Japanese" },
  "ファストフード": { area: "American" }, // Roughly map to American for burgers etc.
  "中華": { area: "Chinese" },
  "イタリアン": { area: "Italian" },
  "フレンチ": { area: "French" },
  "インド": { area: "Indian" },
  "タイ": { area: "Thai" },
  "メキシカン": { area: "Mexican" },
  "海鮮": { category: "Seafood" },
  "牛肉": { category: "Beef" },
  "鶏肉": { category: "Chicken" },
  "パスタ": { category: "Pasta" },
  "デザート": { category: "Dessert" },
};

/**
 * Fetch a menu from TheMealDB API.
 */
async function getMenuFromWeb(foodName: string): Promise<string | null> {
  try {
    const mapping = FOOD_MAPPING[foodName];
    let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(foodName)}`;

    if (mapping) {
      if (mapping.area) {
        url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${mapping.area}`;
      } else if (mapping.category) {
        url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${mapping.category}`;
      } else if (mapping.search) {
        url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${mapping.search}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) return null;
    const data: any = await response.json();
    const meals = data.meals;

    if (meals && Array.isArray(meals) && meals.length > 0) {
      const meal = meals[Math.floor(Math.random() * meals.length)];
      return meal.strMeal;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching menu for ${foodName}:`, error);
    return null;
  }
}

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

      const suggestionsPromises = people.map(async (person) => {
        const foods = person.favoriteFoods.map((f) => f.name);
        const greeting = `Hello, ${person.name}!`;
        
        if (foods.length === 0) {
          return `${greeting}\nI don't know your favorite food yet, but I suggest a nice balanced meal!`;
        }

        const menuItems = await Promise.all(foods.map(async (food) => {
          const item = await getMenuFromWeb(food);
          if (item) {
            return `Since you like ${food}, how about some "${item}" today? I found this on the web!`;
          }
          return `Since you like ${food}, how about some ${food}-based gourmet menu today?`;
        }));

        return `${greeting}\n${menuItems.join("\n")}`;
      });

      const suggestions = (await Promise.all(suggestionsPromises)).join("\n\n");

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
