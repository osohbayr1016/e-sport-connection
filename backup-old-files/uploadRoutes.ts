import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";

// Extend Request interface to include file property
interface MulterRequest extends Request {
  file?: any;
}

const router = Router();

// Uploads disabled in this deployment

// Upload image to Cloudinary
router.post(
  "/image",
  authenticateToken,
  async (req: Request, res: Response) => {
    return res.status(503).json({ message: "Image uploads are disabled." });
  }
);

// Delete image from Cloudinary
router.delete(
  "/image/:publicId",
  authenticateToken,
  async (req: Request, res: Response) => {
    return res.status(503).json({ message: "Image deletion is disabled." });
  }
);

export default router;
