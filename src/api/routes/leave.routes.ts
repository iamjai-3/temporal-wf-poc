import { Router, Request, Response } from "express";
import { getTemporalClient } from "../../client";
import { LeaveApplicationWorkflow, approvalSignal } from "../../workflows/leave-application";
import { ApplyLeaveRequest, ApproveLeaveRequest } from "../../types";
import { leaveService } from "../../services/leave.service";
import { userService } from "../../services/user.service";
import { leaveRepository } from "../../repositories/leave.repository";
import { leaveValidator } from "../validators/leave.validator";
import { generateWorkflowId } from "../../utils/id";
import { getTemporalConfig } from "../../config/temporal";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const body: ApplyLeaveRequest = req.body;

    const validation = leaveValidator.validateApplyLeaveRequest(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const user = await userService.getById(body.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const client = await getTemporalClient();
    const workflowId = generateWorkflowId(body.userId);
    const config = getTemporalConfig();

    const handle = await client.workflow.start(LeaveApplicationWorkflow, {
      args: [body],
      taskQueue: config.taskQueue,
      workflowId,
    });

    // Wait a moment for the workflow to create the request record
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.status(202).json({
      message: "Leave request submitted",
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });
  } catch (error: any) {
    console.error("Error applying leave:", error);
    res.status(500).json({ error: error.message ?? "Internal server error" });
  }
});

router.post("/:requestId/approve", async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const body: ApproveLeaveRequest = req.body;

    const validation = leaveValidator.validateApproveLeaveRequest(body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const request = leaveService.getById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    if (request.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    if (!request.workflowId) {
      return res.status(400).json({ error: "Workflow ID not found for this request" });
    }

    const client = await getTemporalClient();

    try {
      const signalHandle = client.workflow.getHandle(request.workflowId);

      await signalHandle.signal(approvalSignal, {
        decision: body.decision,
        approverId: body.approverId,
      });

      res.json({
        message: `Leave request ${body.decision.toLowerCase()}d`,
        requestId,
      });
    } catch (signalError: any) {
      console.error("Signal error:", signalError);
      res.status(404).json({ error: "Workflow not found. The request may have timed out." });
    }
  } catch (error: any) {
    console.error("Error approving leave:", error);
    res.status(500).json({ error: error.message ?? "Internal server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const workflowId = req.query.workflowId as string | undefined;

    if (workflowId) {
      const request = leaveRepository.getByWorkflowId(workflowId);
      if (!request) {
        return res.status(404).json({ error: "Leave request not found for this workflow" });
      }
      return res.json(request);
    }

    // Return all requests if no workflowId provided
    const requests = leaveRepository.getAll();
    res.json(requests);
  } catch (error: any) {
    console.error("Error getting leave requests:", error);
    res.status(500).json({ error: error.message ?? "Internal server error" });
  }
});

router.get("/:requestId", async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = leaveService.getById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(request);
  } catch (error: any) {
    console.error("Error getting leave request:", error);
    res.status(500).json({ error: error.message ?? "Internal server error" });
  }
});

export default router;
