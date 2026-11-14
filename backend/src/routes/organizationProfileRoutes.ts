import { FastifyInstance, FastifyPluginAsync } from "fastify";

const organizationProfileRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return {
      success: true,
      message: "Organization profile routes available",
      timestamp: new Date().toISOString(),
    };
  });
};

export default organizationProfileRoutes;
