import { Suspense } from "react";
import { ExerciseList } from "@/components/exercise-list";
export default function Exercise() {
  return (
    <Suspense>
      <ExerciseList />
    </Suspense>
  );
}
