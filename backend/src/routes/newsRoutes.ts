import { FastifyInstance, FastifyPluginAsync } from "fastify";
import News from "../models/News";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const newsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const adminOnly = { preHandler: [authenticateToken, requireAdmin] };
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "News routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Get all news with pagination and filtering
  fastify.get("/", async (request, reply) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        type,
        search,
        featured,
      } = request.query as any;

      const query: any = {};

      // Apply filters
      if (category && category !== "All") {
        query.category = category;
      }

      if (type) {
        query.type = type;
      }

      if (featured !== undefined) {
        query.featured = featured === "true";
      }

      if (search) {
        query.$text = { $search: search };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [news, total] = await Promise.all([
        News.find(query)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        News.countDocuments(query),
      ]);

      return reply.status(200).send({
        success: true,
        news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Get news error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get news",
      });
    }
  });

  // Get featured news
  fastify.get("/featured", async (request, reply) => {
    try {
      const featuredNews = await News.find({ featured: true })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean();

      return reply.status(200).send({
        success: true,
        news: featuredNews,
      });
    } catch (error) {
      console.error("Get featured news error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get featured news",
      });
    }
  });

  // Get news by ID
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const news = await News.findById(id).lean();

      if (!news) {
        return reply.status(404).send({
          success: false,
          message: "News not found",
        });
      }

      return reply.status(200).send({
        success: true,
        news,
      });
    } catch (error) {
      console.error("Get news by ID error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get news",
      });
    }
  });

  // Create news (admin only)
  fastify.post("/", adminOnly, async (request, reply) => {
    try {
      const newsData = request.body as any;

      // Validate required fields
      const requiredFields = [
        "title",
        "description",
        "content",
        "image",
        "type",
        "category",
        "author",
        "readTime",
      ];
      const missingFields = requiredFields.filter((field) => !newsData[field]);

      if (missingFields.length > 0) {
        return reply.status(400).send({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      const newNews = new News(newsData);
      await newNews.save();

      return reply.status(201).send({
        success: true,
        message: "News created successfully",
        news: newNews,
      });
    } catch (error) {
      console.error("Create news error:", error);

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message
        );
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: "Failed to create news",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Update news (admin only)
  fastify.put("/:id", adminOnly, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as any;

      const news = await News.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!news) {
        return reply.status(404).send({
          success: false,
          message: "News not found",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "News updated successfully",
        news,
      });
    } catch (error) {
      console.error("Update news error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update news",
      });
    }
  });

  // Delete news (admin only)
  fastify.delete("/:id", adminOnly, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const news = await News.findByIdAndDelete(id);

      if (!news) {
        return reply.status(404).send({
          success: false,
          message: "News not found",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "News deleted successfully",
      });
    } catch (error) {
      console.error("Delete news error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to delete news",
      });
    }
  });

  // Get news categories
  fastify.get("/categories/list", async (request, reply) => {
    try {
      const categories = await News.distinct("category");

      return reply.status(200).send({
        success: true,
        categories,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get categories",
      });
    }
  });

  // Get news types
  fastify.get("/types/list", async (request, reply) => {
    try {
      const types = await News.distinct("type");

      return reply.status(200).send({
        success: true,
        types,
      });
    } catch (error) {
      console.error("Get types error:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get types",
      });
    }
  });
};

export default newsRoutes;
