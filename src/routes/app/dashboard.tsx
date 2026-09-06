import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/dashboard")({ component: DashboardPage });