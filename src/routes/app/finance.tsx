import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/finance")({ component: FinancePage });