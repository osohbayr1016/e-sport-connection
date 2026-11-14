import { FastifyInstance, FastifyPluginAsync } from "fastify";

// The legacy mass-deletion endpoint provided a catastrophic failure mode.
// Use audited database maintenance scripts with backups instead.
const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/health", async () => ({
    success: true,
    message: "Admin routes available",
    timestamp: new Date().toISOString(),
  }));

  fastify.delete("/clear-all", async (_request, reply) =>
    reply.status(410).send({
      success: false,
      message: "Bulk deletion API is permanently disabled",
    })
  );
};

export default adminRoutes;
