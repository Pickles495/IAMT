import { Suspense } from "react";
import { BoardWorkspace } from "@/components/board-workspace";
export default function Learn() {
  return (
    <Suspense>
      <BoardWorkspace />
    </Suspense>
  );
}
