import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SlicerViewer } from "./SlicerViewer";
import type { SliceEstimate, Project } from "@shared/schema";

interface SliceEstimatorProps {
  projectId: string;
  stlFileContent?: string;
  disabled?: boolean;
}

export function SliceEstimator({ projectId, stlFileContent = "", disabled = false }: SliceEstimatorProps) {
  const { data: estimates } = useQuery<SliceEstimate[]>({
    queryKey: [`/api/projects/${projectId}/slice-estimates`],
    enabled: !!projectId,
  });

  const sliceMutation = useMutation({
    mutationFn: async (params: any) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/slice-estimate`, params);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/slice-estimates`] });
    },
  });

  return (
    <SlicerViewer
      stlContent={stlFileContent}
      onSlice={(params) => sliceMutation.mutate(params)}
      isSlicing={sliceMutation.isPending}
    />
  );
}
