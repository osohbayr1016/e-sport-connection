import { FastifyInstance, FastifyPluginAsync } from "fastify";

const testRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Test routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Test endpoint
  fastify.get("/test", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Test endpoint working",
      timestamp: new Date().toISOString(),
    });
  });
};

export default testRoutes;
