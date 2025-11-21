import { Request, Response, NextFunction } from "express";

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  console.error("Error:", error);
  const message = error.message ?? "Internal server error";
  res.status(error.status ?? 500).json({ error: message });
}

