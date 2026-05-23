import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs, resolvers } from "./schema";

const PORT = process.env.PORT || 3005;
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  await server.start();

  app.use("/graphql", expressMiddleware(server));

  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`🚀 GraphQL Gateway running on http://localhost:${PORT}/graphql`);
    console.log(`📊 Apollo Sandbox available at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start GraphQL gateway:", err);
  process.exit(1);
});
