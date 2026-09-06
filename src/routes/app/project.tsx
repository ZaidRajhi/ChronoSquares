import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/project")({ component: ProjectPage });