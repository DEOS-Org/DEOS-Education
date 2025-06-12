import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';
import { asyncHandler } from '../middlewares/asyncHandler';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await dashboardService.getDashboardStats();
  res.json(stats);
});

export const getUserCountByRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.params;
  const count = await dashboardService.getUserCountByRole(role);
  res.json({ role, count });
});

export const getStudentCountByCourse = asyncHandler(async (req: Request, res: Response) => {
  const { cursoId, divisionId } = req.query;
  
  const count = await dashboardService.getStudentCountByCourse(
    cursoId ? parseInt(cursoId as string) : undefined,
    divisionId ? parseInt(divisionId as string) : undefined
  );
  
  res.json({ 
    curso_id: cursoId,
    division_id: divisionId,
    count 
  });
});

export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const attendanceData = await dashboardService.getAttendanceStats();
  res.json(attendanceData);
});