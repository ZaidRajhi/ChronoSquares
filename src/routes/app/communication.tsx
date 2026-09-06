import { createFileRoute } from "@tanstack/react-router";
import { CommunicationPage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/communication")({ component: CommunicationPage });